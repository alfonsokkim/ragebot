import React, { useState } from "react";
import "./ChatComponents.css";

// Header now lets the user select a difficulty.
export const Header: React.FC<{
  setDifficulty: (diff: string) => void;
  currentDifficulty: string;
}> = ({ setDifficulty, currentDifficulty }) => {
  return (
    <div className="header-container">
      <div className="counter-display">875</div>
      {/* Difficulty buttons */}
      <button
        className="header-button"
        onClick={() => setDifficulty("easy")}
        style={{
          fontWeight: currentDifficulty === "easy" ? "bold" : "normal",
        }}
      >
        Easy
      </button>
      <button
        className="header-button"
        onClick={() => setDifficulty("medium")}
        style={{
          fontWeight: currentDifficulty === "medium" ? "bold" : "normal",
        }}
      >
        Medium
      </button>
      <button
        className="header-button"
        onClick={() => setDifficulty("hard")}
        style={{
          fontWeight: currentDifficulty === "hard" ? "bold" : "normal",
        }}
      >
        Hard
      </button>
      {/* Other header buttons remain unchanged */}
      <button className="header-button">Today</button>
      <button className="header-button">Week</button>
      <button className="header-button">Blah</button>
      <button className="header-button">😊</button>
      <button className="header-button">⭐</button>
    </div>
  );
};

type MessageBubbleProps = {
  text: string;
  side?: "left" | "right";
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  side = "left",
}) => {
  const bubbleClass = side === "left" ? "left-bubble" : "right-bubble";
  return <div className={bubbleClass}>{text}</div>;
};

export type ChatMessage = {
  text: string;
  side: "left" | "right";
};

export const MessageList: React.FC<{ messages: ChatMessage[] }> = ({
  messages,
}) => {
  return (
    <div className="messages-container">
      {messages.map((msg, index) => (
        <MessageBubble key={index} text={msg.text} side={msg.side} />
      ))}
    </div>
  );
};

type ChatInputProps = {
  onSend: (message: string) => void;
};

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim() !== "") {
      onSend(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="input-container">
      <input
        className="text-input"
        type="text"
        placeholder="Type something here..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button className="send-button" onClick={handleSend}>
        Send
      </button>
    </div>
  );
};

const ChatUI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [difficulty, setDifficulty] = useState("medium");

  // Sends the user's message to the Express server and updates messages with the bot's reply.
  const handleSendMessage = async (userMessage: string) => {
    // Add user message to chat
    setMessages((prev) => [...prev, { text: userMessage, side: "right" }]);

    try {
      const response = await fetch("http://localhost:3001/api/ragebot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage, difficulty }),
      });
      const data = await response.json();
      if (data.botReply) {
        setMessages((prev) => [...prev, { text: data.botReply, side: "left" }]);
      }
      if (data.averageScore) {
        console.log("Current Average Score:", data.averageScore);
      }
    } catch (error) {
      console.error("Error contacting RageBot:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error contacting RageBot", side: "left" },
      ]);
    }
  };

  return (
    <div className="chat-wrapper">
      <Header setDifficulty={setDifficulty} currentDifficulty={difficulty} />
      <MessageList messages={messages} />
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
};

export default ChatUI;
