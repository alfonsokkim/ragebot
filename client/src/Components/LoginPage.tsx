import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3005/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem("token", data.token);
        // Navigate to chat
        navigate("/chat");
      } else {
        setErrorMsg(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("An error occurred during login.");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" style={{ marginTop: 10 }}>
          Login
        </button>
      </form>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <p>
        Don’t have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}
