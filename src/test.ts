import * as dotenv from 'dotenv';
dotenv.config();

console.log("Hello, TypeScript!");
console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY}`);