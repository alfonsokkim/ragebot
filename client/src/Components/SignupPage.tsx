import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3005/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // on success, navigate to login
        navigate("/");
      } else {
        setErrorMsg(data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrorMsg("An error occurred during signup.");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup}>
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
          Sign Up
        </button>
      </form>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <p>
        Already have an account? <a href="/">Login</a>
      </p>
    </div>
  );
}
