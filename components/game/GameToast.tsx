"use client";

export default function GameToast({ message, isDark }: { message: string; isDark: boolean }) {
  return (
    <div style={{
      position: "fixed", top: "20px", right: "16px", zIndex: 100,
      padding: "10px 20px", borderRadius: "999px",
      backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)",
      border: `1px solid ${isDark ? "rgba(0,245,255,0.3)" : "rgba(107,77,6,0.3)"}`,
      backdropFilter: "blur(12px)",
      boxShadow: isDark ? "0 0 24px rgba(0,245,255,0.15)" : "0 8px 32px rgba(0,0,0,0.1)",
      fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700,
      letterSpacing: "0.12em",
      color: isDark ? "#00f5ff" : "#4a3500",
      textShadow: isDark ? "0 0 10px rgba(0,245,255,0.6)" : "none",
      animation: "toast-appear 2.5s ease forwards", whiteSpace: "nowrap",
    }}>
      {message}
    </div>
  );
}