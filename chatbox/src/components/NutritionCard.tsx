import React from "react";
import type { NutritionData } from "../types";

interface Props {
  data: NutritionData;
}

const macro = (label: string, value: number, unit: string, color: string, pct: number) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{value}{unit}</span>
    </div>
    <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  </div>
);

export const NutritionCard: React.FC<Props> = ({ data }) => {
  const total = data.proteins * 4 + data.carbs * 4 + data.fats * 9;

  return (
    <div style={{
      background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
      border: "1px solid #a7f3d0",
      borderRadius: 12,
      padding: "16px 18px",
      marginTop: 10,
      maxWidth: 340,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ fontSize: 20 }}>🥗</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#065f46" }}>{data.label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>{data.calories} <span style={{ fontSize: 13, fontWeight: 500, color: "#34d399" }}>kcal</span></div>
        </div>
      </div>
      {macro("Protéines", data.proteins, "g", "#6366f1", (data.proteins * 4 / total) * 100)}
      {macro("Glucides", data.carbs, "g", "#f59e0b", (data.carbs * 4 / total) * 100)}
      {macro("Lipides", data.fats, "g", "#ec4899", (data.fats * 9 / total) * 100)}
    </div>
  );
};
