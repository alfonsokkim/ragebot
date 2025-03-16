// ragebot.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// If you're using ES modules, we need these to simulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let weeklySummary = [];

// Function to record daily score
function recordDailyScore(score) {
  const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
  const existingDay = weeklySummary.find((day) => day.date === today);

  if (existingDay) {
    existingDay.totalScore += score;
    existingDay.queryCount += 1;
  } else {
    weeklySummary.push({
      date: today,
      totalScore: score,
      queryCount: 1,
    });
  }
}

// 1) Validate OPENAI_API_KEY and JWT_SECRET
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is missing");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("Error: JWT_SECRET is missing");
  process.exit(1);
}

// 2) Initialize OpenAI and Express
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();
app.use(cors());
app.use(express.json());

// JSON File Storage Helpers
const USERS_FILE_PATH = path.join(__dirname, "users.json");

/** Load users from JSON. Returns an empty array if file not found. */
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE_PATH)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading users.json:", err);
    return [];
  }
}

/** Save users to JSON file. */
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to users.json:", err);
  }
}

// In-Memory "Database" -> loaded from file
let users = loadUsers(); // { id, email, passwordHash, chatHistory: [] }

// We'll keep your existing conversation logic in memory for now:
let convoHistory = [
  {
    role: "system",
    content:
      "You are a helpful assistant who motivates the user by challenging them to push themselves further. You roast the user based on their actions, providing feedback and ratings.",
  },
];

let chosenDifficulty = "medium";
let totalScore = 0;
let queryCount = 0;

/** Helper: getRoastPrompt */
function getRoastPrompt(difficulty) {
  if (difficulty === "easy") {
    return "Be gentle but motivating. Encourage the user to improve while being positive.";
  } else if (difficulty === "hard") {
    return "Roast the user hard, but make it clear they can do better and encourage improvement.";
  } else {
    return "Balance between roasting and motivating the user. Provide constructive criticism.";
  }
}

/** Authentication Middleware */
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization; // "Bearer <token>"
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ------------------------------
//  User Signup
// ------------------------------
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      email,
      passwordHash,
      chatHistory: [],
    };
    users.push(newUser);
    saveUsers(users);
    return res.json({ message: "Signup successful" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------
//  User Login
// ------------------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    // Create JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------
// 1) Protected route to save chat
//    Body expects: { messages: [ {text, side} ], averageScore: number }
// ------------------------------
app.post("/api/saveChat", authRequired, async (req, res) => {
  try {
    const { messages, averageScore } = req.body;
    const user = users.find((u) => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Convert messages into OpenAI format
    const openAIMessages = messages.map((m) =>
      m.side === "right"
        ? { role: "user", content: m.text }
        : { role: "assistant", content: m.text }
    );

    // Summarize just this session
    const summarySystemMessage = {
      role: "system",
      content: `
        You are a summarizer. Summarize the following conversation strictly based on its content. 
        Do not add or make up details not explicitly mentioned.
        If something is unclear or not stated, say there is not enough context.
        End with a short final statement.
      `,
    };

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [summarySystemMessage, ...openAIMessages],
    });

    // NOTE: For openai@3.x, the data is top-level. For openai@4.x, it's under response.data.
    // Based on your logs, it appears top-level:
    const summary = response.choices?.[0]?.message?.content;

    // Create the new session
    const newSession = {
      timestamp: Date.now(),
      averageScore,
      messages,
      summary, // store the AI-generated summary here
    };

    // Save to user's history
    user.chatHistory.push(newSession);
    saveUsers(users);

    return res.json({ message: "Chat saved successfully" });
  } catch (error) {
    console.error("Save chat error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------
// 2) Protected route to get all chat logs
// ------------------------------
app.get("/api/chatLogs", authRequired, (req, res) => {
  try {
    const user = users.find((u) => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ chatHistory: user.chatHistory || [] });
  } catch (error) {
    console.error("Get chat logs error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------
//  RageBot Endpoint
// ------------------------------
app.post("/api/ragebot", async (req, res) => {
  try {
    const { userMessage, difficulty } = req.body;
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      chosenDifficulty = "medium";
    } else {
      chosenDifficulty = difficulty;
    }

    // Add the user's message to the conversation
    convoHistory.push({ role: "user", content: userMessage });

    const roastPrompt = getRoastPrompt(chosenDifficulty);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: roastPrompt },
        ...convoHistory,
        {
          role: "system",
          content:
            "After providing feedback, rate the user's productivity out of 100 " +
            "as a pure integer on a new line like this:\nScore: 70",
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ error: "No response from OpenAI." });
    }

    // Add the assistant's reply to the conversation
    convoHistory.push({ role: "assistant", content: reply });

    // Extract Score
    const scoreMatch = reply.match(/Score:\s*(\d+)/);
    if (scoreMatch) {
      const currentScore = parseInt(scoreMatch[1]);
      totalScore += currentScore;
      queryCount++;
      recordDailyScore(currentScore);
    }

    // Remove "Score: 70" from the reply text
    const cleanReply = reply.replace(/Score:\s*\d+\s*$/, "").trim();

    let averageScore = 0;
    if (queryCount > 0) {
      averageScore = totalScore / queryCount;
    }

    res.json({
      botReply: cleanReply,
      averageScore: averageScore.toFixed(2),
    });
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------
//  Summary Endpoint
// ------------------------------
app.post("/api/summary", async (req, res) => {
  try {
    const summarySystemMessage = {
      role: "system",
      content: `
        You are a summarizer. Summarize the conversation so far strictly based on the content of the conversation. 
        Do not add or make up any details not explicitly mentioned in the conversation. 
        If something is unclear or not stated, say there is not enough context. 
        Then explain the reason for the current productivity score, referencing only the user's messages and the assistant's replies. 
        End with a final statement.
      `,
    };

    const conversationExcludingOriginalSystem = convoHistory.filter(
      (msg) => msg.role !== "system"
    );

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [summarySystemMessage, ...conversationExcludingOriginalSystem],
    });

    const summary = response.choices?.[0]?.message?.content;
    if (!summary) {
      return res.status(500).json({ error: "No summary from OpenAI." });
    }

    res.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ------------------------------
//  Start the server
// ------------------------------
const PORT = 3005;
app.listen(PORT, () => {
  console.log(`RageBot server is running on port ${PORT}`);
});
