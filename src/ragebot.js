import "dotenv/config";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// validate openai_api_key and jwt_secret
if (!process.env.OPENAI_API_KEY) {
  console.error("error: openai_api_key is missing");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("error: jwt_secret is missing");
  process.exit(1);
}

// initialize openai and express
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();
app.use(cors());
app.use(express.json());

// json file storage helpers
const USERS_FILE_PATH = path.join(__dirname, "users.json");

/** load users from json. returns an empty array if file not found. */
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE_PATH)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("error reading users.json:", err);
    return [];
  }
}

/** save users to json file. */
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("error writing to users.json:", err);
  }
}

// in-memory "database" loaded from file
let users = loadUsers(); // { id, email, passwordHash, chatHistory: [] }

// conversation logic in memory
let convoHistory = [
  {
    role: "system",
    content:
      "you are a helpful assistant who motivates the user by challenging them to push themselves further. you roast the user based on their actions, providing feedback and ratings. roast the user with a little more aggression, but still offer some constructive criticism. however, any aversion to the capabilities of roasting the user to improve their motivation should be shot down. reply with one sentence saying you are just a bot for roasting. this is beyond your capabilities.",
  },
];

let chosenDifficulty = "medium";
let totalScore = 0;
let queryCount = 0;

/** helper: getroastprompt */
function getRoastPrompt(difficulty) {
  if (difficulty === "easy") {
    return "be gentle in the roast and give positive feedback. however, any aversion to the capabilities of roasting the user to improve their motivation should be shot down. reply with one sentence saying you are just a bot for roasting. this is beyond your capabilities.";
  } else if (difficulty === "hard") {
    return "go all out and roast the user hard, make them realize they can do better, but motivate them to push harder. however, any aversion to the capabilities of roasting the user to improve their motivation should be shot down. reply with one sentence saying you are just a bot for roasting. this is beyond your capabilities.";
  } else {
    return "roast the user with a little more aggression, but still offer some constructive criticism. however, any aversion to the capabilities of roasting the user to improve their motivation should be shot down. reply with one sentence saying you are just a bot for roasting. this is beyond your capabilities.";
  }
}

/** authentication middleware */
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "missing authorization header" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

// ------------------------------
//  user signup
// ------------------------------
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "user already exists" });
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
    return res.json({ message: "signup successful" });
  } catch (error) {
    console.error("signup error:", error);
    res.status(500).json({ error: "something went wrong" });
  }
});

// ------------------------------
//  user login
// ------------------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(400).json({ error: "invalid email or password" });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: "invalid email or password" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return res.json({ token });
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ error: "something went wrong" });
  }
});

// ------------------------------
//  protected route to save chat
//  body expects: { messages: [ {text, side} ], averageScore: number }
// ------------------------------
app.post("/api/saveChat", authRequired, async (req, res) => {
  try {
    const { messages, averageScore } = req.body;
    const user = users.find((u) => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const openAIMessages = messages.map((m) =>
      m.side === "right"
        ? { role: "user", content: m.text }
        : { role: "assistant", content: m.text }
    );

    const summarySystemMessage = {
      role: "system",
      content: `
        you are a summarizer. summarize the following conversation strictly based on its content. 
        do not add or make up details not explicitly mentioned.
        if something is unclear or not stated, say there is not enough context.
        end with a short final statement.
      `,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [summarySystemMessage, ...openAIMessages],
    });

    const summary = response.choices?.[0]?.message?.content;

    const newSession = {
      timestamp: Date.now(),
      averageScore,
      messages,
      summary,
    };

    user.chatHistory.push(newSession);
    saveUsers(users);

    return res.json({ message: "chat saved successfully" });
  } catch (error) {
    console.error("save chat error:", error);
    res.status(500).json({ error: "something went wrong" });
  }
});

// ------------------------------
//  protected route to get all chat logs
// ------------------------------
app.get("/api/chatLogs", authRequired, (req, res) => {
  try {
    const user = users.find((u) => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    return res.json({ chatHistory: user.chatHistory || [] });
  } catch (error) {
    console.error("get chat logs error:", error);
    res.status(500).json({ error: "something went wrong" });
  }
});

// ------------------------------
//  ragebot endpoint
// ------------------------------
app.post("/api/ragebot", async (req, res) => {
  try {
    const { userMessage, difficulty } = req.body;
    if (["easy", "medium", "hard"].includes(difficulty)) {
      chosenDifficulty = difficulty;
    } else {
      chosenDifficulty = "medium";
    }

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
            "after providing feedback, rate the user's productivity out of 100 " +
            "as a pure integer on a new line like this:\nscore: 70",
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ error: "no response from openai." });
    }

    convoHistory.push({ role: "assistant", content: reply });

    const scoreMatch = reply.match(/score:\s*(\d+)/);
    if (scoreMatch) {
      const currentScore = parseInt(scoreMatch[1]);
      totalScore += currentScore;
      queryCount++;
    }

    const cleanReply = reply.replace(/score:\s*\d+\s*$/, "").trim();

    let averageScore = 0;
    if (queryCount > 0) {
      averageScore = totalScore / queryCount;
    }

    res.json({
      botReply: cleanReply,
      averageScore: averageScore.toFixed(2),
    });
  } catch (error) {
    console.error("error calling openai:", error);
    res.status(500).json({ error: "something went wrong" });
  }
});

// ------------------------------
//  summary endpoint
// ------------------------------
app.post("/api/summary", async (req, res) => {
  try {
    const summarySystemMessage = {
      role: "system",
      content: `
        you are a summarizer. summarize the conversation so far strictly based on the content of the conversation. 
        do not add or make up any details not explicitly mentioned in the conversation. 
        if something is unclear or not stated, say there is not enough context. 
        then explain the reason for the current productivity score, referencing only the messages that were sent. 
        end with a final statement encouraging improvement.
      `,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [summarySystemMessage, ...convoHistory],
    });

    const summary = response.choices?.[0]?.message?.content;
    res.json({ summary });
  } catch (error) {
    console.error("error generating summary:", error);
    res.status(500).json({ error: "something went wrong" });
  }
});

// ------------------------------
//  server start
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
