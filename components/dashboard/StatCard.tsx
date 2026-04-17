"use client";

import { useState } from "react";

export default function StatCard({ label, value, sub, isDark, color, delay = 0, mounted }: {
  label: string; value: string; sub?: string; isDark: boolean;
  color?: string; delay?: number; mounted: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const accentColor = color ?? (isDark ? "#00f5ff" : "#8b6508");

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 140px", padding: "24px 20px", borderRadius: "20px",
        backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)",
        border: `1px solid ${hovered
          ? isDark ? `${accentColor}40` : "rgba(107,77,6,0.3)"
          : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
        backdropFilter: "blur(12px)",
        boxShadow: hovered ? isDark ? `0 0 30px ${accentColor}15` : "0 8px 32px rgba(0,0,0,0.08)" : "none",
        transition: "all 0.3s ease",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transitionDelay: `${delay}ms`,
        display: "flex", flexDirection: "column", gap: "6px",
      }}
    >
      <span style={{ fontFamily: "DM Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
        {label}
      </span>
      <span style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", fontWeight: 700, color: accentColor, textShadow: isDark ? `0 0 20px ${accentColor}40` : "none", lineHeight: 1 }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}