// ragebot.js

import "dotenv/config";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

// 1) Validate your OPENAI_API_KEY
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is missing");
  process.exit(1);
}

// 2) Initialize OpenAI and Express
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();
app.use(cors());
app.use(express.json());

// 3) Global conversation state
let convoHistory = [
  {
    role: "system",
    content:
      "You are a helpful assistant who motivates the user by challenging them to push themselves further. You roast the user based on their actions, providing feedback and ratings.",
  },
];

// 4) Difficulty, total score, query count
let chosenDifficulty = "medium";
let totalScore = 0;
let queryCount = 0;

/**
 * Helper function to determine roast prompt based on difficulty
 */
function getRoastPrompt(difficulty) {
  if (difficulty === "easy") {
    return "Be gentle but motivating. Encourage the user to improve while being positive.";
  } else if (difficulty === "hard") {
    return "Roast the user hard, but make it clear they can do better and encourage improvement.";
  } else {
    // default: 'medium'
    return "Balance between roasting and motivating the user. Provide constructive criticism.";
  }
}

// 5) Endpoint: POST /api/ragebot
// Body expects: { userMessage: string, difficulty?: 'easy'|'medium'|'hard' }
app.post("/api/ragebot", async (req, res) => {
  try {
    const { userMessage, difficulty } = req.body;

    // Validate or default difficulty
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      chosenDifficulty = "medium";
    } else {
      chosenDifficulty = difficulty;
    }

    // Add user's message to conversation
    convoHistory.push({ role: "user", content: userMessage });

    // Build dynamic system prompt
    const roastPrompt = getRoastPrompt(chosenDifficulty);

    // Call OpenAI Chat Completion
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

    // Add AI’s full reply to the conversation
    convoHistory.push({ role: "assistant", content: reply });

    // Extract the "Score: NN" portion
    const scoreMatch = reply.match(/Score:\s*(\d+)/);
    if (scoreMatch) {
      const currentScore = parseInt(scoreMatch[1]);
      totalScore += currentScore;
      queryCount++;
    }

    // Remove the score line from the displayed text
    const cleanReply = reply.replace(/Score:\s*\d+\s*$/, "").trim();

    // Calculate average so far
    let averageScore = 0;
    if (queryCount > 0) {
      averageScore = totalScore / queryCount;
    }

    // Return both the cleaned-up reply and the average
    res.json({
      botReply: cleanReply,
      averageScore: averageScore.toFixed(2), // e.g. "70.00"
    });
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 6) Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`RageBot server is running on port ${PORT}`);
});
