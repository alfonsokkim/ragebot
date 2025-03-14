import 'dotenv/config';
import { OpenAI } from 'openai';
import * as readline from 'readline';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function runChat () {
  const messages = [
    { role: 'system', content: 'You are a helpful chatbot.' },
    { role: 'user', content: 'Hello! How are you?' }
  ] as any[];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 100,
    });

    console.log(response.choices[0]?.message.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

runChat(); 
