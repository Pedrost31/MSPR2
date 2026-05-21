import React from "react";
import { ChatBox } from "./components/ChatBox";

export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdfa 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#065f46" }}>HealthAI Coach</div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Votre assistant santé & nutrition intelligent</div>
        </div>
        <ChatBox />
      </div>
    </div>
  );
}