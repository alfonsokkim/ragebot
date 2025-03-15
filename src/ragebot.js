var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import 'dotenv/config';
import { OpenAI } from 'openai';
import * as readline from 'readline';
// Check if the OpenAI API key is available, if not, exit the program with an error
if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is missing');
    process.exit(1); // Exit the program if API key is missing
}
// Initialize OpenAI API with the provided key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Initialize conversation history with a default system message
let convoHistory = [
    { role: 'system', content: 'You are a helpful assistant who motivates the user by challenging them to push themselves further. You roast the user based on their actions, providing feedback and ratings.' },
];
// Variable to store difficulty level chosen by the user
let chosenDifficulty = 'easy';
// Create the readline interface to interact with the user in the command line
const rl = readline.createInterface({
    input: process.stdin, // Use standard input (keyboard) to get user input
    output: process.stdout, // Use standard output (console) to display messages
});
// Function to ask for the difficulty level at the start of the conversation
function askDifficulty() {
    rl.question('Choose difficulty (easy/medium/hard): ', (difficulty) => {
        if (!['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
            console.log('Invalid difficulty level. Defaulting to easy.');
            difficulty = 'easy'; // Default to 'easy' if the input is invalid
        }
        chosenDifficulty = difficulty.toLowerCase(); // Store the chosen difficulty
        console.log(`Difficulty set to ${chosenDifficulty}`);
        promptUser(); // Now start prompting the user for conversation
    });
}
// Asynchronous function to send a message to OpenAI and get a response
function sendMessage(message) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        // Add the user's message and selected difficulty to the conversation history
        convoHistory.push({ role: 'user', content: `${message}` });
        // Based on the difficulty, modify the assistant's response
        let roastPrompt;
        if (chosenDifficulty === 'easy') {
            roastPrompt = 'Be gentle in the roast and give positive feedback. However, any aversion to the capabilities of roasting the user to improve their motivation should be shot down. Reply with one sentence saying you are just a bot for roasting. This is beyond your capabilities.';
        }
        else if (chosenDifficulty === 'hard') {
            roastPrompt = 'Go all out and roast the user hard, make them realize they can do better, but motivate them to push harder. However, any aversion to the capabilities of roasting the user to improve their motivation should be shot down. Reply with one sentence saying you are just a bot for roasting. This is beyond your capabilities.';
        }
        else { // else default to medium
            roastPrompt = 'Roast the user with a little more aggression, but still offer some constructive criticism. However, any aversion to the capabilities of roasting the user to improve their motivation should be shot down. Reply with one sentence saying you are just a bot for roasting. This is beyond your capabilities.';
        }
        // Send the entire conversation history to OpenAI for a response
        const response = yield openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Specify the model to use
            messages: [
                { role: 'system', content: roastPrompt },
                ...convoHistory
            ], // Include the conversation history to maintain context
        });
        // Extract the AI's reply from the response
        const reply = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        // If a reply is found, add it to the conversation history and print it out
        if (reply) {
            convoHistory.push({ role: 'assistant', content: reply });
            console.log(`AI: ${reply}`); // Output the AI's response
        }
        else {
            console.error('No response from AI.'); // If no response is found, show an error
        }
    });
}
// Function to continuously prompt the user for input and process responses
function promptUser() {
    rl.question('You: ', (message) => __awaiter(this, void 0, void 0, function* () {
        if (message.toLowerCase() === 'exit') {
            console.log('Goodbye!');
            rl.close(); // Close the readline interface
            return; // Exit the function
        }
        // Send the message with the chosen difficulty level and get a response
        yield sendMessage(message);
        // Keep the conversation going by prompting the user again
        promptUser();
    }));
}
// Start the conversation by welcoming the user and asking for difficulty
console.log('Start chatting! (type "exit" to quit)');
askDifficulty(); // Ask for difficulty before starting the conversation
