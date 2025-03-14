"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const openai_1 = require("openai");
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
async function runChat() {
    const messages = [
        { role: 'system', content: 'You are a helpful chatbot.' },
        { role: 'user', content: 'Hello! How are you?' }
    ];
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            max_tokens: 100,
        });
        console.log(response.choices[0]?.message.content);
    }
    catch (error) {
        console.error('Error:', error);
    }
}
runChat();
