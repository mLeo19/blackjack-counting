"use client";

export default function TrainToggle({ trainMode, isDark, onToggle }: {
  trainMode: boolean; isDark: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title="Train Mode"
      style={{
        width: "72px", height: "30px", borderRadius: "999px",
        border: "none", cursor: "pointer", position: "relative",
        backgroundColor: trainMode
          ? isDark ? "#00f5ff" : "#8b6508"
          : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
        boxShadow: trainMode && isDark ? "0 0 10px rgba(0,245,255,0.4)" : "none",
        transition: "background-color 0.3s ease, box-shadow 0.3s ease",
        flexShrink: 0, display: "flex", alignItems: "center",
      }}
    >
      <div style={{
        position: "absolute", top: "3px",
        left: trainMode ? "46px" : "3px",
        width: "24px", height: "24px", borderRadius: "50%",
        backgroundColor: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        transition: "left 0.3s ease", zIndex: 1,
      }} />
      <span style={{
        position: "absolute",
        left: trainMode ? "6px" : "28px",
        fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700,
        letterSpacing: "0.08em",
        color: trainMode
          ? isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)"
          : isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)",
        transition: "left 0.3s ease, color 0.3s ease",
        userSelect: "none", zIndex: 0,
      }}>
        TRAIN
      </span>
    </button>
  );
}