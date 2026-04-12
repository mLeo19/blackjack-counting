"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import PageLayout from "@/components/ui/PageLayout";

function LandingButton({
  label,
  onClick,
  variant,
  isDark,
}: {
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary" | "ghost";
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const styles = {
    primary: {
      background: hovered
        ? isDark
          ? "linear-gradient(135deg, rgba(0,245,255,0.25), rgba(0,245,255,0.12))"
          : "linear-gradient(135deg, rgba(107,77,6,0.22), rgba(107,77,6,0.12))"
        : isDark
          ? "linear-gradient(135deg, rgba(0,245,255,0.15), rgba(0,245,255,0.06))"
          : "linear-gradient(135deg, rgba(107,77,6,0.12), rgba(107,77,6,0.05))",
      border: isDark ? "1.5px solid rgba(0,245,255,0.5)" : "1.5px solid rgba(107,77,6,0.6)",
      color: isDark ? "#00f5ff" : "#4a3500",
      boxShadow: hovered
        ? isDark
          ? "0 0 40px rgba(0,245,255,0.25), inset 0 0 30px rgba(0,245,255,0.08)"
          : "0 8px 32px rgba(107,77,6,0.25)"
        : isDark
          ? "0 0 20px rgba(0,245,255,0.1)"
          : "0 4px 16px rgba(107,77,6,0.1)",
      textShadow: isDark && hovered ? "0 0 12px rgba(0,245,255,0.8)" : "none",
    },
    secondary: {
      background: hovered
        ? isDark ? "rgba(255,45,120,0.12)" : "rgba(139,101,8,0.1)"
        : "transparent",
      border: isDark ? "1.5px solid rgba(255,45,120,0.4)" : "1.5px solid rgba(139,101,8,0.35)",
      color: isDark ? "#ff2d78" : "#6b4d06",
      boxShadow: hovered
        ? isDark ? "0 0 30px rgba(255,45,120,0.2)" : "0 6px 24px rgba(139,101,8,0.15)"
        : "none",
      textShadow: isDark && hovered ? "0 0 10px rgba(255,45,120,0.6)" : "none",
    },
    ghost: {
      background: "transparent",
      border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.12)",
      color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
      boxShadow: hovered
        ? isDark ? "0 0 20px rgba(255,255,255,0.05)" : "0 4px 16px rgba(0,0,0,0.08)"
        : "none",
      textShadow: "none",
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "16px 32px",
        borderRadius: "999px",
        fontFamily: "DM Mono, monospace",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        cursor: "pointer",
        transform: hovered ? "scale(1.03) translateY(-2px)" : "scale(1) translateY(0)",
        transition: "all 0.25s ease",
        ...styles,
      }}
    >
      {label}
    </button>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";

  return (
    <PageLayout showTopBar={false}>

      {/* Custom top bar */}
      <div className="flex justify-between items-center px-8 py-6">
        <span
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "20px",
            fontWeight: 700,
            color: isDark ? "rgba(0,245,255,0.7)" : "rgba(107,77,6,0.7)",
            letterSpacing: "0.05em",
          }}
        >
          ♠ Soft17
        </span>
        <button
          onClick={toggleTheme}
          className="transition-all hover:scale-110"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "24px",
            filter: theme === "light" ? "brightness(0)" : "none",
          }}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-8 py-16">

        {/* Eyebrow */}
        <div className="flex items-center gap-3">
          <div style={{ height: "1px", width: "40px", backgroundColor: isDark ? "rgba(0,245,255,0.4)" : "rgba(107,77,6,0.4)" }} />
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.6)", fontFamily: "DM Mono, monospace" }}
          >
            The Card Counting Trainer
          </span>
          <div style={{ height: "1px", width: "40px", backgroundColor: isDark ? "rgba(0,245,255,0.4)" : "rgba(107,77,6,0.4)" }} />
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(64px, 12vw, 140px)",
            fontWeight: 700,
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
            color: isDark ? "#ffffff" : "#1a1200",
            textShadow: isDark ? "0 0 80px rgba(0,245,255,0.15), 0 0 160px rgba(0,245,255,0.08)" : "none",
          }}
        >
          Soft
          <span style={{
            color: isDark ? "#00f5ff" : "#8b6508",
            textShadow: isDark ? "0 0 40px rgba(0,245,255,0.5), 0 0 80px rgba(0,245,255,0.2)" : "none",
          }}>
            17
          </span>
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "clamp(14px, 2vw, 18px)",
            color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            maxWidth: "480px",
          }}
        >
          Master the count.
          <span style={{ color: isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.7)" }}> Beat the house.</span>
        </p>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%", maxWidth: "320px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
          <span style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", fontSize: "16px" }}>♦</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-4 w-full" style={{ maxWidth: "320px" }}>
          <LandingButton label="Play as Guest" onClick={() => router.push("/game")} variant="primary" isDark={isDark} />
          <LandingButton label="Log In" onClick={() => router.push("/login")} variant="secondary" isDark={isDark} />
          <LandingButton label="Create Account" onClick={() => router.push("/signup")} variant="ghost" isDark={isDark} />
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center" style={{ maxWidth: "480px" }}>
          {["Hi-Lo System", "Basic Strategy Hints", "Train Mode"].map((feature) => (
            <span
              key={feature}
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "10px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "6px 14px",
                borderRadius: "999px",
                color: isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.6)",
                border: `1px solid ${isDark ? "rgba(0,245,255,0.15)" : "rgba(107,77,6,0.2)"}`,
                backgroundColor: isDark ? "rgba(0,245,255,0.04)" : "rgba(107,77,6,0.04)",
              }}
            >
              {feature}
            </span>
          ))}
        </div>

      </div>

      {/* Footer */}
      <div className="flex justify-center pb-8">
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", letterSpacing: "0.15em", color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}>
          ♠ ♥ ♦ ♣
        </span>
      </div>

    </PageLayout>
  );
}