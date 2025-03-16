import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatComponents.css";

export type ChatMessage = {
  text: string;
  side: "left" | "right";
};

export type HistorySession = {
  timestamp: number;
  averageScore: number;
  messages: ChatMessage[];
  summary?: string;
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
    if (e.key === "enter") {
      handleSend();
    }
  };

  return (
    <div className="input-container">
      <input
        className="text-input"
        type="text"
        placeholder="type something here..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button className="send-button" onClick={handleSend}>
        send
      </button>
    </div>
  );
};

const SummaryPopup: React.FC<{
  messages: ChatMessage[];
  averageScore: string;
  aiSummary: string;
  onClose: () => void;
}> = ({ messages, averageScore, aiSummary, onClose }) => {
  const userCount = messages.filter((m) => m.side === "right").length;
  const botCount = messages.filter((m) => m.side === "left").length;
  const basicSummary = `you have sent ${userCount} messages and received ${botCount} responses.
your current productivity score is ${averageScore}/100.`;

  return (
    <div className="summary-popup-overlay">
      <div className="summary-popup">
        <h2>chat summary</h2>
        <p>{basicSummary}</p>
        <h3>ai explanation</h3>
        {aiSummary ? <p>{aiSummary}</p> : <p>loading summary...</p>}
        <button onClick={onClose}>close</button>
      </div>
    </div>
  );
};

const HistoryPopup: React.FC<{
  chatHistory: HistorySession[];
  onClose: () => void;
}> = ({ chatHistory, onClose }) => {
  return (
    <div className="summary-popup-overlay">
      <div className="summary-popup">
        <h2>your chat history</h2>
        {chatHistory.length === 0 ? (
          <p>no previous chats found.</p>
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
                <strong>date:</strong> {dateStr}
                <br />
                <strong>score:</strong> {(session.averageScore ?? 0).toFixed(2)}
                /100
                <br />
                <strong>messages:</strong> {session.messages.length} total
                <br />
                <strong>summary:</strong>{" "}
                {session.summary || "no summary available"}
              </div>
            );
          })
        )}
        <button onClick={onClose}>close</button>
      </div>
    </div>
  );
};

const WeekPopup: React.FC<{
  chatHistory: HistorySession[];
  onClose: () => void;
}> = ({ chatHistory, onClose }) => {
  const lastSession =
    chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
  const sundaySummary = lastSession?.summary || "no summary";
  const sundayScore = lastSession
    ? lastSession.averageScore.toFixed(2)
    : "0.00";

  return (
    <div className="summary-popup-overlay">
      <div className="summary-popup">
        <h2>weekly summary</h2>
        <table style={{ margin: "0 auto", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>monday</th>
              <th>tuesday</th>
              <th>wednesday</th>
              <th>thursday</th>
              <th>friday</th>
              <th>saturday</th>
              <th>sunday</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}></td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                <strong>summary:</strong> {sundaySummary}
                <br />
                <strong>avg score:</strong> {sundayScore}
              </td>
            </tr>
          </tbody>
        </table>
        <button onClick={onClose}>close</button>
      </div>
    </div>
  );
};

export const Header: React.FC<{
  setDifficulty: (diff: string) => void;
  currentDifficulty: string;
  averageScore: string;
  onEmojiClick: () => void;
  onHistoryClick: () => void;
  onWeekClick: () => void;
  onLogout: () => void;
}> = ({
  setDifficulty,
  currentDifficulty,
  averageScore,
  onEmojiClick,
  onHistoryClick,
  onWeekClick,
  onLogout,
}) => {
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
        easy
      </button>
      <button
        className="header-button"
        onClick={() => setDifficulty("medium")}
        style={{
          fontWeight: currentDifficulty === "medium" ? "bold" : "normal",
        }}
      >
        medium
      </button>
      <button
        className="header-button"
        onClick={() => setDifficulty("hard")}
        style={{
          fontWeight: currentDifficulty === "hard" ? "bold" : "normal",
        }}
      >
        hard
      </button>
      <div
        className="header-button image-button"
        onClick={onEmojiClick}
        style={{ cursor: "pointer" }}
      >
        <img src={emojiImage} alt="score emoji" className="score-emoji" />
      </div>
      <button className="header-button" onClick={onWeekClick}>
        week
      </button>
      <button className="header-button" onClick={onHistoryClick}>
        ⭐
      </button>
      <button className="header-button" onClick={onLogout}>
        logout
      </button>
    </div>
  );
};

const ChatUI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [averageScore, setAverageScore] = useState("0.00");
  const [showSummary, setShowSummary] = useState(false);
  const [aiSummary, setAISummary] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<HistorySession[]>([]);
  const [showWeek, setShowWeek] = useState(false);

  const navigate = useNavigate();

  // if not authenticated, redirect to login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  // logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // auto-save chat to server after each ai response
  const autoSaveChat = async (
    updatedMessages: ChatMessage[],
    score: string
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const numericScore = parseFloat(score) || 0;
      const response = await fetch("http://localhost:3005/api/saveChat", {
        method: "post",
        headers: {
          "content-type": "application/json",
          authorization: `bearer ${token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          averageScore: numericScore,
        }),
      });
      if (!response.ok) {
        console.error("error auto-saving chat:", await response.text());
      }
    } catch (err) {
      console.error("error auto-saving chat:", err);
    }
  };

  // send a message to ragebot
  const handleSendMessage = async (userMessage: string) => {
    const newMessages = [
      ...messages,
      { text: userMessage, side: "right" as const },
    ];
    setMessages(newMessages);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3005/api/ragebot", {
        method: "post",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userMessage, difficulty }),
      });
      const data = await response.json();

      let updatedMessages = newMessages;
      if (data.botReply) {
        updatedMessages = [
          ...newMessages,
          { text: data.botReply, side: "left" as const },
        ];
        setMessages(updatedMessages);
      }

      if (data.averageScore) {
        setAverageScore(data.averageScore);
      }

      autoSaveChat(updatedMessages, data.averageScore || "0.00");
    } catch (error) {
      console.error("error contacting ragebot:", error);
      setMessages((prev) => [
        ...prev,
        { text: "error contacting ragebot", side: "left" as const },
      ]);
    }
  };

  // fetch ai summary for the image popup
  const fetchAISummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3005/api/summary", {
        method: "post",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      if (data.summary) {
        setAISummary(data.summary);
      } else {
        setAISummary("no summary available.");
      }
    } catch (error) {
      console.error("error fetching summary:", error);
      setAISummary("error fetching summary.");
    }
  };

  const handleEmojiClick = async () => {
    await fetchAISummary();
    setShowSummary(true);
  };

  // fetch user's entire chat history
  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch("http://localhost:3005/api/chatLogs", {
        method: "get",
        headers: {
          authorization: `bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error("error fetching chat logs:", await response.text());
        return;
      }
      const data = await response.json();
      setChatHistory(data.chatHistory || []);
    } catch (error) {
      console.error("error fetching chat logs:", error);
    }
  };

  const handleHistoryClick = async () => {
    await fetchChatHistory();
    setShowHistory(true);
  };

  // handle the new "week" button
  const handleWeekClick = async () => {
    await fetchChatHistory();
    setShowWeek(true);
  };

  return (
    <div className="chat-wrapper">
      <Header
        setDifficulty={setDifficulty}
        currentDifficulty={difficulty}
        averageScore={averageScore}
        onEmojiClick={handleEmojiClick}
        onHistoryClick={handleHistoryClick}
        onWeekClick={handleWeekClick}
        onLogout={handleLogout}
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

      {showHistory && (
        <HistoryPopup
          chatHistory={chatHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showWeek && (
        <WeekPopup
          chatHistory={chatHistory}
          onClose={() => setShowWeek(false)}
        />
      )}
    </div>
  );
};

export default ChatUI;
