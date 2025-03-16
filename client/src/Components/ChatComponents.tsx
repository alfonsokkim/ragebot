import React, { useState } from "react";
import "./ChatComponents.css";

// Updated Header accepts an onEmojiClick prop.
export const Header: React.FC<{
  setDifficulty: (diff: string) => void;
  currentDifficulty: string;
  averageScore: string;
  onEmojiClick: () => void;
}> = ({ setDifficulty, currentDifficulty, averageScore, onEmojiClick }) => {
  return (
    <div className="header-container">
      {/* Display the average score in the format n/100 */}
      <div className="counter-display">{averageScore}/100</div>
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
      {/* Emoji button which triggers the summary popup */}
      <button className="header-button" onClick={onEmojiClick}>
        😊
      </button>
      <button className="header-button">Today</button>
      <button className="header-button">Week</button>
      <button className="header-button">Blah</button>
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

// The modal that displays a summary of the current chat and score
const SummaryPopup: React.FC<{
  messages: ChatMessage[];
  averageScore: string;
  aiSummary: string;
  onClose: () => void;
}> = ({ messages, averageScore, aiSummary, onClose }) => {
  // A basic count summary.
  const userCount = messages.filter((msg) => msg.side === "right").length;
  const botCount = messages.filter((msg) => msg.side === "left").length;
  const basicSummary = `You have sent ${userCount} messages and received ${botCount} responses.
Your current productivity score is ${averageScore}/100.`;

  return (
    <div className="summary-popup-overlay">
      <div className="summary-popup">
        <h2>Chat Summary</h2>
        <p>{basicSummary}</p>
        <h3>AI Explanation</h3>
        {aiSummary ? <p>{aiSummary}</p> : <p>Loading summary...</p>}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const ChatUI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [averageScore, setAverageScore] = useState("0.00");
  const [showSummary, setShowSummary] = useState(false);
  const [aiSummary, setAISummary] = useState("");

  const handleSendMessage = async (userMessage: string) => {
    // append user's message to the chat
    setMessages((prev) => [...prev, { text: userMessage, side: "right" }]);

    try {
      const response = await fetch("http://localhost:3005/api/ragebot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage, difficulty }),
      });
      const data = await response.json();
      if (data.botReply) {
        setMessages((prev) => [...prev, { text: data.botReply, side: "left" }]);
      }
      if (data.averageScore) {
        setAverageScore(data.averageScore);
      }
    } catch (error) {
      console.error("Error contacting RageBot:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error contacting RageBot", side: "left" },
      ]);
    }
  };

  // fetch the AI summary from the server.
  const fetchAISummary = async () => {
    try {
      const response = await fetch("http://localhost:3005/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.summary) {
        setAISummary(data.summary);
      } else {
        setAISummary("No summary available.");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      setAISummary("Error fetching summary.");
    }
  };

  // when emoji is clicked, fetch the summary and then show the popup.
  const handleEmojiClick = async () => {
    await fetchAISummary();
    setShowSummary(true);
  };

  return (
    <div className="chat-wrapper">
      <Header
        setDifficulty={setDifficulty}
        currentDifficulty={difficulty}
        averageScore={averageScore}
        onEmojiClick={handleEmojiClick}
      />
      <MessageList messages={messages} />
      <ChatInput onSend={handleSendMessage} />
      {showSummary && (
        <SummaryPopup
          messages={messages}
          averageScore={averageScore}
          aiSummary={aiSummary}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
};

export default ChatUI;
