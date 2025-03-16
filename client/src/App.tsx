import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./Components/LoginPage";
import SignupPage from "./Components/SignupPage";
import ChatUI from "./Components/ChatComponents";

function App() {
  return (
    <div className="outer-container">
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/chat" element={<ChatUI />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
