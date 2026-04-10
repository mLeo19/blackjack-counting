"use client";

import { useCountStore } from "@/store/countStore";
import { useTheme } from "@/context/ThemeContext";
import { GamePhase, Hand } from "@/types";

interface CountOverlayProps {
  phase: GamePhase | string;
  playerHand: Hand | null;
  dealerUpCard: string | null;
}

export default function CountOverlay({ phase, playerHand, dealerUpCard }: CountOverlayProps) {
  const { runningCount, trueCount, trainMode, hintVisible, countHistory, showHint, hideHint } = useCountStore();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  if (!trainMode) return null;

  const showHintToggle = playerHand &&
    playerHand.cards.length >= 2 &&
    phase === "playerTurn";

  const countColor = (count: number) => {
    if (count > 0) return isDark ? "#00f5ff" : "#1a6b3a";
    if (count < 0) return isDark ? "#ff2d78" : "#c0392b";
    return isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
  };

  const countGlow = (count: number) => {
    if (!isDark) return "none";
    if (count > 0) return "0 0 10px rgba(0,245,255,0.5)";
    if (count < 0) return "0 0 10px rgba(255,45,120,0.5)";
    return "none";
  };

  const entryColor = (value: number) => {
    if (value > 0) return isDark ? "#00f5ff" : "#1a6b3a";
    if (value < 0) return isDark ? "#ff2d78" : "#c0392b";
    return isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)";
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <div
        className="flex flex-col gap-2 px-4 py-3 rounded-2xl"
        style={{
          backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)",
          border: `1px solid ${isDark ? "rgba(0,245,255,0.15)" : "rgba(107,77,6,0.2)"}`,
          backdropFilter: "blur(8px)",
          minWidth: "140px",
        }}
      >
        {/* Running count */}
        <div className="flex flex-col items-center">
          <span
            className="text-xs uppercase tracking-widest"
            style={{
              color: isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.6)",
              fontFamily: "DM Mono, monospace",
            }}
          >
            Running
          </span>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontWeight: 700,
              fontSize: "22px",
              color: countColor(runningCount),
              textShadow: countGlow(runningCount),
              transition: "color 0.3s ease",
            }}
          >
            {runningCount > 0 ? `+${runningCount}` : runningCount}
          </span>

          {/* Count history */}
          {countHistory.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center mt-1" style={{ maxWidth: "120px" }}>
              {/* Starting count before this round */}
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "DM Mono, monospace",
                  fontWeight: 600,
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)",
                  opacity: 0.8,
                }}
              >
                {(() => {
                  const startingCount = countHistory.reduce((acc, e) => acc - e.value, runningCount);
                  return startingCount > 0 ? `+${startingCount}` : `${startingCount}`;
                })()}
              </span>
              <span style={{ fontSize: "10px", color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", fontFamily: "DM Mono, monospace" }}>
                →
              </span>
              {countHistory.map((entry, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "10px",
                    fontFamily: "DM Mono, monospace",
                    fontWeight: 600,
                    color: entryColor(entry.value),
                    opacity: 0.8,
                  }}
                >
                  {entry.value > 0 ? `+${entry.value}` : entry.value === 0 ? "0" : entry.value}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />

        {/* True count */}
        <div className="flex flex-col items-center">
          <span
            className="text-xs uppercase tracking-widest"
            style={{
              color: isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.6)",
              fontFamily: "DM Mono, monospace",
            }}
          >
            True
          </span>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontWeight: 700,
              fontSize: "22px",
              color: countColor(trueCount),
              textShadow: countGlow(trueCount),
              transition: "color 0.3s ease",
            }}
          >
            {trueCount > 0 ? `+${trueCount}` : trueCount}
          </span>
        </div>

        {/* Hint toggle */}
        {showHintToggle && (
          <>
            <div style={{ height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
            <div className="flex flex-col items-center gap-1.5">
              <span
                className="text-xs uppercase tracking-widest"
                style={{
                  color: isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.6)",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                Hint
              </span>
              <button
                onClick={hintVisible ? hideHint : showHint}
                className="relative transition-all duration-300 hover:scale-105"
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "999px",
                  backgroundColor: hintVisible
                    ? isDark ? "#ffd700" : "#8b6508"
                    : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: hintVisible && isDark ? "0 0 12px rgba(255,215,0,0.4)" : "none",
                  transition: "background-color 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: hintVisible ? "23px" : "3px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    transition: "left 0.3s ease",
                  }}
                />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}