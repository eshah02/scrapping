
"use client";
import './globals.css';
import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input }),
    });

    const data = await res.json();

    setMessages((m) => [
      ...m,
      { role: "bot", text: data.answer || "No response" },
    ]);
    setLoading(false);
  }

  return (
    <div className="chat-container">
      <div className="chat-header">Resend Docs Chatbot</div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`message ${m.role === "user" ? "user" : "bot"}`}
          >
            {m.text}
          </div>
        ))}
        {loading && <div className="message bot">Typing...</div>}
      </div>

      <div className="chat-input">
        <input
          placeholder="Ask something about Resend..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
