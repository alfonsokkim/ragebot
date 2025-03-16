import React from "react";
import "./ChatComponents.css";

export const Header: React.FC = () => {
  return (
    <div className="header-container">
      <div className="counter-display">875</div>
      <button className="header-button">Today</button>
      <button className="header-button">Week</button>
      <button className="header-button">Blah</button>
      <button className="header-button">😊</button>
      <button className="header-button">Light</button>
      <button className="header-button">Medium</button>
      <button className="header-button">Hard</button>
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

export const MessageList: React.FC = () => {
  return (
    <div className="messages-container">
      <MessageBubble
        text="I've done really good stuff today :)."
        side="right"
      />
      <MessageBubble text="You are shit" side="left" />
      <MessageBubble text="oh" side="right" />
    </div>
  );
};

export const ChatInput: React.FC = () => {
  return (
    <div className="input-container">
      <input
        className="text-input"
        type="text"
        placeholder="Type something here..."
      />
      {/* If you want a Send button */}
      <button className="send-button">Send</button>
    </div>
  );
};

const ChatUI: React.FC = () => {
  return (
    <div className="chat-wrapper">
      <Header />
      <MessageList />
      <ChatInput />
    </div>
  );
};

export default ChatUI;
