// ChatComponents.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatComponents.css";

/** TYPES & INTERFACES **/
export type ChatMessage = {
  text: string;
  side: "left" | "right";
};

type MessageBubbleProps = {
  text: string;
  side?: "left" | "right";
};

/** HEADER COMPONENT **/
export const Header: React.FC<{
  setDifficulty: (diff: string) => void;
  currentDifficulty: string;
  averageScore: string;
  onEmojiClick: () => void;
  onHistoryClick: () => void;
  onLogout: () => void;
}> = ({
  setDifficulty,
  currentDifficulty,
  averageScore,
  onEmojiClick,
  onHistoryClick,
  onLogout,
}) => {
  // Determine which image to show based on averageScore
  const score = parseFloat(averageScore) || 0;
  let emojiImage = "";
  if (score >= 0 && score <= 20) {
    emojiImage = "/1.png";
  } else if (score >= 21 && score <= 40) {
    emojiImage = "/2.png";
  } else if (score >= 41 && score <= 60) {
    emojiImage = "/3.png";
  } else if (score >= 61 && score <= 80) {
    emojiImage = "/4.png";
  } else if (score >= 81 && score <= 100) {
    emojiImage = "/5.png";
  }

  return (
    <div className="header-container">
      <div className="counter-display">{averageScore}/100</div>
      <button
        className="header-button"
        onClick={() => setDifficulty("easy")}
        style={{ fontWeight: currentDifficulty === "easy" ? "bold" : "normal" }}
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
        style={{ fontWeight: currentDifficulty === "hard" ? "bold" : "normal" }}
      >
        Hard
      </button>
      {/* Image acting as emoji button */}
      <div
        className="header-button image-button"
        onClick={onEmojiClick}
        style={{ cursor: "pointer" }}
      >
        <img src={emojiImage} alt="Score Emoji" className="score-emoji" />
      </div>
      <button className="header-button">Week</button>
      <button className="header-button" onClick={onHistoryClick}>
        ⭐
      </button>
      <button className="header-button" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
};

/** MESSAGE BUBBLE **/
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  side = "left",
}) => {
  const bubbleClass = side === "left" ? "left-bubble" : "right-bubble";
  return <div className={bubbleClass}>{text}</div>;
};

/** MESSAGE LIST **/
export const MessageList: React.FC<{ messages: ChatMessage[] }> = ({
  messages,
}) => {
  return (
    <div className="messages-container">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} text={msg.text} side={msg.side} />
      ))}
    </div>
  );
};

/** CHAT INPUT **/
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

/** SUMMARY POPUP **/
const SummaryPopup: React.FC<{
  messages: ChatMessage[];
  averageScore: string;
  aiSummary: string;
  onClose: () => void;
}> = ({ messages, averageScore, aiSummary, onClose }) => {
  const userCount = messages.filter((m) => m.side === "right").length;
  const botCount = messages.filter((m) => m.side === "left").length;
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

/** HISTORY POPUP **/
type HistorySession = {
  timestamp: number; // date/time of chat
  averageScore: number; // final average score for that session
  messages: ChatMessage[]; // entire conversation
  summary?: string; // AI-generated summary
};

const HistoryPopup: React.FC<{
  chatHistory: HistorySession[];
  onClose: () => void;
}> = ({ chatHistory, onClose }) => {
  return (
    <div className="summary-popup-overlay">
      <div className="summary-popup">
        <h2>Your Chat History</h2>
        {chatHistory.length === 0 ? (
          <p>No previous chats found.</p>
        ) : (
          chatHistory.map((session, idx) => {
            const dateStr = new Date(session.timestamp).toLocaleString();
            return (
              <div
                key={idx}
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  margin: "8px 0",
                  textAlign: "left",
                }}
              >
                <strong>Date:</strong> {dateStr}
                <br />
                <strong>Score:</strong> {(session.averageScore ?? 0).toFixed(2)}
                /100
                <br />
                <strong>Messages:</strong> {session.messages.length} total
                <br />
                <strong>Summary:</strong>{" "}
                {session.summary || "No summary available"}
              </div>
            );
          })
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

/** MAIN CHAT UI **/
const ChatUI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [averageScore, setAverageScore] = useState("0.00");

  // Summary & History popups
  const [showSummary, setShowSummary] = useState(false);
  const [aiSummary, setAISummary] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<HistorySession[]>([]);

  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Auto-save chat to server after each AI response
  const autoSaveChat = async (
    updatedMessages: ChatMessage[],
    score: string
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // Not logged in
      const numericScore = parseFloat(score) || 0;
      const response = await fetch("http://localhost:3005/api/saveChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          averageScore: numericScore,
        }),
      });
      if (!response.ok) {
        console.error("Error auto-saving chat:", await response.text());
      }
    } catch (err) {
      console.error("Error auto-saving chat:", err);
    }
  };

  // Send a message to RageBot
  const handleSendMessage = async (userMessage: string) => {
    // Add user's message
    const newMessages = [
      ...messages,
      { text: userMessage, side: "right" as const },
    ];
    setMessages(newMessages);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3005/api/ragebot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userMessage, difficulty }),
      });
      const data = await response.json();

      // Add bot's reply
      let updatedMessages = newMessages;
      if (data.botReply) {
        updatedMessages = [
          ...newMessages,
          { text: data.botReply, side: "left" as const },
        ];
        setMessages(updatedMessages);
      }

      // Update average score
      if (data.averageScore) {
        setAverageScore(data.averageScore);
      }

      // Auto-save after AI response
      autoSaveChat(updatedMessages, data.averageScore || "0.00");
    } catch (error) {
      console.error("Error contacting RageBot:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error contacting RageBot", side: "left" as const },
      ]);
    }
  };

  // Fetch AI summary (for the image popup)
  const fetchAISummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3005/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

  const handleEmojiClick = async () => {
    await fetchAISummary();
    setShowSummary(true);
  };

  // Fetch user's entire chat history
  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch("http://localhost:3005/api/chatLogs", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error("Error fetching chat logs:", await response.text());
        return;
      }
      const data = await response.json();
      setChatHistory(data.chatHistory || []);
    } catch (error) {
      console.error("Error fetching chat logs:", error);
    }
  };

  const handleHistoryClick = async () => {
    await fetchChatHistory();
    setShowHistory(true);
  };

  return (
    <div className="chat-wrapper">
      <Header
        setDifficulty={setDifficulty}
        currentDifficulty={difficulty}
        averageScore={averageScore}
        onEmojiClick={handleEmojiClick}
        onHistoryClick={handleHistoryClick}
        onLogout={handleLogout}
      />

      <MessageList messages={messages} />
      <ChatInput onSend={handleSendMessage} />

      {/* Summary popup */}
      {showSummary && (
        <SummaryPopup
          messages={messages}
          averageScore={averageScore}
          aiSummary={aiSummary}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* History popup */}
      {showHistory && (
        <HistoryPopup
          chatHistory={chatHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default ChatUI;
