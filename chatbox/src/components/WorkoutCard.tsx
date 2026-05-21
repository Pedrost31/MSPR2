import React from "react";
import type { WorkoutRecommendation } from "../types";

interface Props {
  data: WorkoutRecommendation[];
}

const intensityColor: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "#d1fae5", text: "#065f46", label: "Faible" },
  medium: { bg: "#fef3c7", text: "#92400e", label: "Modérée" },
  high: { bg: "#fee2e2", text: "#991b1b", label: "Intense" },
};

export const WorkoutCard: React.FC<Props> = ({ data }) => (
  <div style={{
    background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)",
    border: "1px solid #bfdbfe",
    borderRadius: 12,
    padding: "16px 18px",
    marginTop: 10,
    maxWidth: 380,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <div style={{ fontSize: 20 }}>💪</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a" }}>Programme d'entraînement</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((ex, i) => {
        const ic = intensityColor[ex.intensity] ?? intensityColor.medium;
        return (
          <div key={i} style={{
            background: "white",
            border: "1px solid #e0e7ff",
            borderRadius: 8,
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e40af" }}>{ex.name}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {ex.category} · {ex.duration}
              </div>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              background: ic.bg,
              color: ic.text,
              borderRadius: 20,
              padding: "3px 10px",
            }}>{ic.label}</span>
          </div>
        );
      })}
    </div>
  </div>
);
