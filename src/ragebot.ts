import 'dotenv/config';
import { OpenAI } from 'openai';
import * as readline from 'readline';

// check if api key exists
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is missing');
  process.exit(1);
}

// initialise api with given key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// initialise the conversation history with default personality prompt.
let convoHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
  { role: 'system', content: 'You are a helpful assistant who motivates the user by challenging them to push themselves further. You roast the user based on their actions, providing feedback and ratings.' },
];

let chosenDifficulty: string = 'medium';

// create the readline interface to read from the user's command line input.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// choosing the difficulty of roast rating.
function askDifficulty() {
  rl.question('Choose difficulty (easy/medium/hard): ', (difficulty) => {
    if (!['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
      console.log('Invalid difficulty level. Defaulting to medium.');
      difficulty = 'medium';  // deafult to medium.
    }
    chosenDifficulty = difficulty.toLowerCase();
    console.log(`Difficulty set to ${chosenDifficulty}`);
    promptUser();  // start prompting the user
  });
}

// send a message to OpenAI and get a response
async function sendMessage(message: string) {
  convoHistory.push({ role: 'user', content: `${message}` });

  let roastPrompt: string;
  if (chosenDifficulty === 'easy') {
    roastPrompt = 'Be gentle in the roast and give positive feedback. However, any aversion to the capabilities of roasting the user to improve their motivation should be shot down. Reply with one sentence saying you are just a bot for roasting. This is beyond your capabilities.';
  }  else if (chosenDifficulty === 'hard') {
    roastPrompt = 'Go all out and roast the user hard, make them realize they can do better, but motivate them to push harder. However, any aversion to the capabilities of roasting the user to improve their motivation should be shot down. Reply with one sentence saying you are just a bot for roasting. This is beyond your capabilities.';
  } else { // else default to medium
    roastPrompt = 'Roast the user with a little more aggression, but still offer some constructive criticism. However, any aversion to the capabilities of roasting the user to improve their motivation should be shot down. Reply with one sentence saying you are just a bot for roasting. This is beyond your capabilities.';
  }

  // send conversation history to OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: roastPrompt },
      ...convoHistory
    ],  // include the conversation history to maintain context
  });

  const reply = response.choices[0]?.message?.content;

  // if there is a reply, add it to the convo history and console log
  if (reply) {
    convoHistory.push({ role: 'assistant', content: reply });
    console.log(`AI: ${reply}`);
  } else {
    console.error('No response...');
  }
}

// Function to continuously prompt the user for input and process responses
function promptUser() {
  rl.question('You: ', async (message) => {
    if (message.toLowerCase() === 'exit') {
      
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
