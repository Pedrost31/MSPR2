import React, { useState, useRef, useEffect, useCallback } from "react";
import type { Message, UserProfile, StructuredData, NutritionData, WorkoutRecommendation } from "../types";
import { extractStructuredData, cleanMarkdown } from "../utils/parser";
import { buildSystemPrompt } from "../utils/systemPrompt";
import { NutritionCard } from "./NutritionCard";
import { WorkoutCard } from "./WorkoutCard";
import { MealPlanCard } from "./MealPlanCard";
import { UserProfilePanel } from "./UserProfilePanel";

const QUICK_PROMPTS = [
  "📊 Analyser mon repas",
  "💪 Programme entraînement",
  "🍽️ Plan repas semaine",
  "⚖️ Calculer mon IMC",
];

function StructuredDataView({ sd }: { sd: StructuredData }) {
  if (sd.type === "nutrition") return <NutritionCard data={sd.data as NutritionData} />;
  if (sd.type === "workout") return <WorkoutCard data={sd.data as WorkoutRecommendation[]} />;
  if (sd.type === "plan") return <MealPlanCard data={sd.data as string[]} />;
  return null;
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 16px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#059669",
          animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const time = msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 8,
      marginBottom: 16,
      alignItems: "flex-end",
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #059669, #0d9488)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, flexShrink: 0, color: "white", fontWeight: 700,
        }}>H</div>
      )}
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 4, alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          background: isUser
            ? "linear-gradient(135deg, #059669, #0d9488)"
            : "white",
          color: isUser ? "white" : "#111827",
          borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
          padding: "10px 14px",
          fontSize: 14,
          lineHeight: 1.6,
          boxShadow: isUser ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
          border: isUser ? "none" : "1px solid #f3f4f6",
          whiteSpace: "pre-wrap",
        }}>
          {msg.content}
        </div>
        {msg.structuredData && <StructuredDataView sd={msg.structuredData} />}
        <span style={{ fontSize: 11, color: "#9ca3af" }}>{time}</span>
      </div>
    </div>
  );
}

export const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: "Bonjour ! Je suis HealthAI Coach, votre assistant santé personnalisé. 🌿\n\nJe peux vous aider à :\n• Analyser vos repas et calculer vos macros\n• Créer des programmes d'entraînement\n• Générer des plans de repas\n• Calculer votre IMC et suivre vos objectifs\n\nComment puis-je vous aider aujourd'hui ?",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const [showProfile, setShowProfile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg]
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(profile),
          messages: history,
        }),
      });

      const data = await res.json();
      const rawText = data.content?.map((b: { type: string; text?: string }) => b.type === "text" ? b.text : "").join("") ?? "Désolé, une erreur s'est produite.";

      const structuredData = extractStructuredData(rawText);
      const cleanText = cleanMarkdown(rawText);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanText,
        timestamp: new Date(),
        structuredData,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Une erreur réseau est survenue. Veuillez réessayer.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, profile]);

  const hasProfile = Object.keys(profile).length > 0;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", maxHeight: 720,
      background: "#f9fafb",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
      borderRadius: 16,
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    }}>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
        padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🌿</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>HealthAI Coach</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              {loading ? "⏳ En train de répondre..." : "🟢 En ligne"}
            </div>
          </div>
        </div>
        <button onClick={() => setShowProfile(true)} style={{
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 8, padding: "6px 12px",
          color: "white", fontSize: 13, cursor: "pointer",
          fontWeight: hasProfile ? 700 : 400,
        }}>
          {hasProfile ? "✅ Profil" : "👤 Profil"}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column" }}>
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "flex-end" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #059669, #0d9488)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, color: "white", fontWeight: 700,
            }}>H</div>
            <div style={{
              background: "white", borderRadius: "4px 18px 18px 18px",
              border: "1px solid #f3f4f6",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}>
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div style={{ padding: "0 16px 8px", display: "flex", gap: 6, overflowX: "auto", flexShrink: 0 }}>
        {QUICK_PROMPTS.map(q => (
          <button key={q} onClick={() => sendMessage(q)} disabled={loading}
            style={{
              whiteSpace: "nowrap", padding: "6px 12px",
              border: "1px solid #d1fae5", borderRadius: 20,
              background: "white", fontSize: 12, cursor: "pointer",
              color: "#065f46", fontWeight: 500,
              opacity: loading ? 0.5 : 1,
              transition: "background 0.15s",
            }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 16px 14px",
        background: "white",
        borderTop: "1px solid #f3f4f6",
        display: "flex", gap: 10, alignItems: "flex-end",
        flexShrink: 0,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Posez votre question santé... (Entrée pour envoyer)"
          rows={1}
          style={{
            flex: 1, resize: "none", padding: "10px 14px",
            border: "1px solid #d1d5db", borderRadius: 12,
            fontSize: 14, outline: "none", lineHeight: 1.5,
            fontFamily: "inherit", color: "#111827",
            background: "#f9fafb",
            maxHeight: 100,
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            width: 42, height: 42,
            background: input.trim() && !loading ? "#059669" : "#e5e7eb",
            border: "none", borderRadius: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, transition: "background 0.2s",
            flexShrink: 0,
          }}
          aria-label="Envoyer"
        >
          {loading ? "⏳" : "➤"}
        </button>
      </div>

      {/* Profile panel */}
      {showProfile && (
        <UserProfilePanel
          profile={profile}
          onSave={setProfile}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};