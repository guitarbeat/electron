import React, { useState } from "react";

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export const MessagesPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "Aaron", text: "Hey! Let's pick a movie to watch.", timestamp: new Date().toLocaleTimeString() },
    { id: "2", sender: "Electra", text: "Sounds good, checking the queue!", timestamp: new Date().toLocaleTimeString() },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "Aaron", text: inputText.trim(), timestamp: new Date().toLocaleTimeString() },
    ]);
    setInputText("");
  };

  return (
    <div className="messages-panel" style={{ padding: "1rem", color: "#fff", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Workspace Chat</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              padding: "0.75rem",
              borderRadius: "0.5rem",
              background: m.sender === "Aaron" ? "rgba(56, 189, 248, 0.15)" : "rgba(244, 114, 182, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.25rem", opacity: 0.8 }}>
              {m.sender} • {m.timestamp}
            </div>
            <div style={{ fontSize: "0.875rem" }}>{m.text}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            borderRadius: "0.375rem",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "#0f172a",
            color: "#fff",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default MessagesPanel;
