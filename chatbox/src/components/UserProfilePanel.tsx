import React from "react";

interface Props {
  data: string[];
}

const icons = ["☀️", "🌤️", "🌙", "🍎", "🍵"];

export const MealPlanCard: React.FC<Props> = ({ data }) => (
  <div style={{
    background: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)",
    border: "1px solid #e9d5ff",
    borderRadius: 12,
    padding: "16px 18px",
    marginTop: 10,
    maxWidth: 420,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <div style={{ fontSize: 20 }}>📋</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#581c87" }}>Plan repas personnalisé</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((meal, i) => (
        <div key={i} style={{
          background: "white",
          border: "1px solid #f3e8ff",
          borderRadius: 8,
          padding: "10px 14px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{icons[i % icons.length]}</span>
          <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{meal}</span>
        </div>
      ))}
    </div>
  </div>
);