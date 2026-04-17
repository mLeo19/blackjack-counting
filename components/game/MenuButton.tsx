"use client";

import { useState } from "react";

export default function MenuButton({ label, isDark, onClick, icon, danger, disabled }: {
  label: string; isDark: boolean; onClick: () => void;
  icon?: React.ReactNode; danger?: boolean; disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const color = danger ? "#ff2d78" : isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)";

  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px",
        background: hovered && !disabled ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" : "transparent",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" : color,
        fontFamily: "DM Mono, monospace", fontSize: "12px", fontWeight: 600,
        letterSpacing: "0.05em", textAlign: "left", transition: "background 0.15s ease",
        textShadow: danger && hovered && isDark && !disabled ? "0 0 8px rgba(255,45,120,0.5)" : "none",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {icon}{label}
    </button>
  );
}