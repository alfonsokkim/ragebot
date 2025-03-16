import 'dotenv/config';
import { OpenAI } from 'openai';
import * as readline from 'readline';

if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is missing');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let convoHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
  { role: 'system', content: 'You are a helpful assistant who motivates the user by challenging them to push themselves further. You roast the user based on their actions, providing feedback and ratings.' },
];

let chosenDifficulty: string = 'medium';
let totalScore = 0;
let queryCount = 0;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askDifficulty() {
  rl.question('Choose difficulty (easy/medium/hard): ', (difficulty) => {
    if (!['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
      console.log('Invalid difficulty level. Defaulting to medium.');
      difficulty = 'medium';
    }
    chosenDifficulty = difficulty.toLowerCase();
    console.log(`Difficulty set to ${chosenDifficulty}`);
    promptUser();
  });
}

async function sendMessage(message: string) {
  convoHistory.push({ role: 'user', content: message });

  let roastPrompt: string;
  if (chosenDifficulty === 'easy') {
    roastPrompt = 'Be gentle but motivating. Encourage the user to improve while being positive.';
  } else if (chosenDifficulty === 'hard') {
    roastPrompt = 'Roast the user hard, but make it clear they can do better and encourage improvement.';
  } else {
    roastPrompt = 'Balance between roasting and motivating the user. Provide constructive criticism.';
  }

  // Include instruction for rating at the end on a new line
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: roastPrompt },
      ...convoHistory,
      {
        role: 'system',
        content: `After providing feedback, rate the user's productivity out of 100 as a pure integer on a new line like this:\nScore: 70`,
      },
    ],
  });

  const reply = response.choices[0]?.message?.content;

  if (reply) {
    // Add full response to convo history for context
    convoHistory.push({ role: 'assistant', content: reply });

    // Split response and extract the score using regex
    const scoreMatch = reply.match(/Score:\s*(\d+)/);
    if (scoreMatch) {
      const currentScore = parseInt(scoreMatch[1]);
      totalScore += currentScore;
      queryCount++;
    }

    // Remove the score part from the displayed response
    const cleanReply = reply.replace(/Score:\s*\d+\s*$/, '').trim();

    console.log(`AI: ${cleanReply}\n`);
  } else {
    console.error('No response from OpenAI...');
  }
}

function promptUser() {
  rl.question('You: ', async (message) => {
    if (message.toLowerCase() === 'exit') {
      if (queryCount > 0) {
        console.log(`Final Average Productivity Score: ${(totalScore / queryCount).toFixed(2)}/100`);
      } else {
        console.log('No valid scores recorded.');
      }
      console.log('Goodbye!');
      rl.close();
      return;
    }

    await sendMessage(message);
    promptUser();
  });
}

console.log('Start chatting! (type "exit" to quit)');
askDifficulty();
