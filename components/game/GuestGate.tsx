"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import FloatingCards from "@/components/ui/FloatingCards";

interface GuestGateProps {
  onReady: (bankroll: number) => void;
}

export default function GuestGate({ onReady }: GuestGateProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";

  const [bankroll, setBankroll] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setTimeout(() => setMounted(true), 50);
  });

  const handleStart = () => {
    const bankrollNum = parseInt(bankroll);
    if (!bankroll || isNaN(bankrollNum) || bankrollNum < 100) {
      return setError("Minimum starting bankroll is $100.");
    }
    try {
      localStorage.setItem("guestBankroll", bankrollNum.toString());
    } catch {}
    onReady(bankrollNum);
  };

  return (
    <div className="felt-texture min-h-screen flex flex-col overflow-hidden relative" style={{ color: "var(--text-primary)" }}>
      <FloatingCards isDark={isDark} count={12} />

      {/* Top bar */}
      <div
        className="relative z-10 flex justify-between items-center px-8 py-6"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <span style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 700, color: isDark ? "rgba(0,245,255,0.7)" : "rgba(107,77,6,0.7)" }}>
          ♠ Soft17
        </span>
        <button
          onClick={toggleTheme}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", filter: theme === "light" ? "brightness(0)" : "none" }}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-1 items-center justify-center px-6 py-12"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s",
        }}
      >
        <div style={{
          width: "100%", maxWidth: "400px", padding: "40px", borderRadius: "24px",
          backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.6)",
          border: `1px solid ${isDark ? "rgba(0,245,255,0.12)" : "rgba(107,77,6,0.15)"}`,
          backdropFilter: "blur(12px)",
          boxShadow: isDark ? "0 0 60px rgba(0,0,0,0.4)" : "0 20px 60px rgba(0,0,0,0.08)",
        }}>
          <div className="flex flex-col items-center gap-1 mb-8">
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "24px", fontWeight: 700, color: isDark ? "#ffffff" : "#1a1200" }}>
              Play as Guest
            </h1>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: "13px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
              No account required
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" as const, color: isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.6)", marginBottom: "6px", display: "block" }}>
                Starting Bankroll
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontFamily: "DM Mono, monospace", fontSize: "13px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", pointerEvents: "none" }}>$</span>
                <input
                  type="number"
                  value={bankroll}
                  onChange={(e) => { setBankroll(e.target.value); setError(""); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                  placeholder="1000"
                  min={100}
                  style={{
                    width: "100%", padding: "14px 16px", paddingLeft: "28px",
                    borderRadius: "12px",
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${focused
                      ? isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.5)"
                      : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
                    color: isDark ? "#e8f5e8" : "#1a1200",
                    fontFamily: "DM Mono, monospace", fontSize: "13px", outline: "none",
                    boxShadow: focused ? isDark ? "0 0 12px rgba(0,245,255,0.15)" : "0 0 12px rgba(107,77,6,0.1)" : "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                />
              </div>
              <p style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", marginTop: "4px" }}>
                Minimum $100
              </p>
            </div>

            {error && (
              <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#ff2d78" }}>✦ {error}</p>
            )}

            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <button
                  onClick={() => {
                    localStorage.removeItem("guestBankroll");
                    router.push("/");
                  }}
                  style={{
                    width: "100%", padding: "14px", borderRadius: "999px",
                    fontFamily: "DM Mono, monospace", fontSize: "12px", fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    cursor: "pointer", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                    backgroundColor: "transparent", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                    transition: "all 0.25s ease",
                  }}
                >
                  ← Back
                </button>
              </div>
              <div style={{ flex: 2 }}>
                <button
                  onClick={handleStart}
                  style={{
                    width: "100%", padding: "14px", borderRadius: "999px",
                    fontFamily: "DM Mono, monospace", fontSize: "12px", fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
                    border: isDark ? "1.5px solid rgba(0,245,255,0.5)" : "1.5px solid rgba(107,77,6,0.6)",
                    backgroundColor: isDark ? "rgba(0,245,255,0.1)" : "rgba(107,77,6,0.06)",
                    color: isDark ? "#00f5ff" : "#4a3500",
                    boxShadow: isDark ? "0 0 12px rgba(0,245,255,0.1)" : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  Start Playing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}