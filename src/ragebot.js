// ragebot.js

import "dotenv/config";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

// 1) validate the OPENAI_API_KEY
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is missing");
  process.exit(1);
}

// 2) initialize OpenAI and Express
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();
app.use(cors());
app.use(express.json());

// 3) global conversation state
let convoHistory = [
  {
    role: "system",
    content:
      "You are a helpful assistant who motivates the user by challenging them to push themselves further. You roast the user based on their actions, providing feedback and ratings.",
  },
];

// 4) Difficulty, total score, query count
// Currently using difficulty default as medium, could be set to easy though.
let chosenDifficulty = "medium";
let totalScore = 0;
let queryCount = 0;

/**
 * Helper function to determine roast prompt based on difficulty
 * Basically, the dynamic difficulty based on input.
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

    // validate the difficulty.
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      chosenDifficulty = "medium";
    } else {
      chosenDifficulty = difficulty;
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
            "After providing feedback, rate the user's productivity out of 100 " +
            "as a pure integer on a new line like this:\nScore: 70",
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ error: "No response from OpenAI." });
    }

    // Push the reply to the convoHistory.
    // Should be using this later for the user convo history.
    convoHistory.push({ role: "assistant", content: reply });

    // Extract the "Score: NN" portion from the terminal
    // This probably can be done easier, but since we had
    // to switch from terminal output to requests, this is what we have.
    const scoreMatch = reply.match(/Score:\s*(\d+)/);
    if (scoreMatch) {
      const currentScore = parseInt(scoreMatch[1]);
      totalScore += currentScore;
      queryCount++;
    }

    // remove the score line from the displayed text
    // Again, since we did terminal output first, need to trim the text.
    const cleanReply = reply.replace(/Score:\s*\d+\s*$/, "").trim();

    let averageScore = 0;
    if (queryCount > 0) {
      averageScore = totalScore / queryCount;
    }

    // returned repsonse
    res.json({
      botReply: cleanReply,
      averageScore: averageScore.toFixed(2), // e.g. "70.00"
    });
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/api/summary", async (req, res) => {
  try {
    // Request for a strict summary of the conversation, and nothing else
    const summarySystemMessage = {
      role: "system",
      content: `
          You are a summarizer. Summarize the conversation so far strictly based on the content of the conversation. 
          Do not add or make up any details not explicitly mentioned in the conversation. 
          If something is unclear or not stated, say there is not enough context. 
          Then explain the reason for the current productivity score, referencing only the user's messages and the assistant's replies. 
          End with a final statement.`,
    };

    // this filters out the "You are a helpful assistant..." system message
    const conversationExcludingOriginalSystem = convoHistory.filter(
      (msg) => msg.role !== "system"
    );

    // call OpenAI with temperature=0 to reduce “creative” guesses
    // this should fix it not making any bold / made up guesses
    // of what the user did
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0, // helps reduce hallucination
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

// 6) Start the server
const PORT = 3005;
app.listen(PORT, () => {
  console.log(`RageBot server is running on port ${PORT}`);
});
