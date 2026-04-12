"use client";

import { useState } from "react";

interface AuthButtonProps {
  label: string;
  disabled?: boolean;
  color?: string;
  isDark: boolean;
  onClick?: () => void;
  type?: "submit" | "button";
  fullWidth?: boolean;
}

export default function AuthButton({
  label,
  disabled,
  color,
  isDark,
  onClick,
  type = "submit",
  fullWidth = true,
}: AuthButtonProps) {
  const [hovered, setHovered] = useState(false);
  const accentColor = color ?? (isDark ? "#00f5ff" : undefined);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "14px",
        borderRadius: "999px",
        fontFamily: "DM Mono, monospace",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        width: fullWidth ? "100%" : "auto",
        border: isDark
          ? `1.5px solid ${accentColor ?? "rgba(0,245,255,0.5)"}${hovered ? "" : "80"}`
          : "2px solid rgba(107,77,6,0.6)",
        backgroundColor: hovered
          ? isDark ? `${accentColor}20` : "rgba(107,77,6,0.12)"
          : isDark ? `${accentColor}10` : "rgba(107,77,6,0.06)",
        color: isDark ? accentColor : "#4a3500",
        boxShadow: hovered
          ? isDark
            ? `0 0 30px ${accentColor}40, inset 0 0 20px ${accentColor}10`
            : "0 6px 24px rgba(107,77,6,0.2)"
          : isDark ? `0 0 12px ${accentColor}20` : "none",
        textShadow: hovered && isDark ? `0 0 10px ${accentColor}` : "none",
        opacity: disabled ? 0.6 : 1,
        transform: hovered && !disabled ? "scale(1.02) translateY(-1px)" : "scale(1) translateY(0)",
        transition: "all 0.25s ease",
      }}
    >
      {label}
    </button>
  );
}