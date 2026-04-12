"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7"];

interface FloatingCard {
  id: number;
  suit: string;
  rank: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  duration: number;
  delay: number;
  isRed: boolean;
}

function generateCards(count: number): FloatingCard[] {
  return Array.from({ length: count }, (_, i) => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    return {
      id: i,
      suit,
      rank,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 60 - 30,
      scale: 0.6 + Math.random() * 0.8,
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 8,
      isRed: suit === "♥" || suit === "♦",
    };
  });
}

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
      border: isDark ? "1.5px solid rgba(0,245,255,0.5)" : "2px solid rgba(107,77,6,0.6)",
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
      border: isDark ? "1.5px solid rgba(255,45,120,0.4)" : "2px solid rgba(139,101,8,0.35)",
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
  const [cards] = useState(() => generateCards(16));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="felt-texture min-h-screen flex flex-col overflow-hidden relative"
      style={{ color: "var(--text-primary)" }}
    >
      {/* ── Floating background cards ── */}
      {mounted && cards.map((card) => (
        <div
          key={card.id}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${card.x}%`,
            top: `${card.y}%`,
            zIndex: 0,
            opacity: 0,
            animation: `float-card-${card.id % 4} ${card.duration}s ease-in-out ${card.delay}s infinite alternate`,
          }}
        >
          <div
            style={{
              width: "70px",
              height: "100px",
              borderRadius: "10px",
              transform: `rotate(${card.rotation}deg) scale(${card.scale})`,
              background: isDark
                ? "linear-gradient(145deg, #fdfaf4, #f5ede0)"
                : "linear-gradient(145deg, #1a2a1a, #0d1a0d)",
              border: "1px solid rgba(180,160,120,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.4)"
                : "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <span style={{
              fontSize: "24px",
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              color: card.isRed
                ? isDark ? "#b91c1c" : "#ff4444"
                : isDark ? "#1c1917" : "#e8f5e8",
              lineHeight: 1,
            }}>
              {card.rank}
            </span>
            <span style={{
              fontSize: "20px",
              color: card.isRed
                ? isDark ? "#b91c1c" : "#ff4444"
                : isDark ? "#1c1917" : "#e8f5e8",
              lineHeight: 1,
            }}>
              {card.suit}
            </span>
          </div>
        </div>
      ))}

      {/* ── Radial glow ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,245,255,0.04) 0%, transparent 70%)"
            : "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(184,134,11,0.06) 0%, transparent 70%)",
          zIndex: 1,
        }}
      />

      {/* ── Top bar ── */}
      <div
        className="relative z-10 flex justify-between items-center px-8 py-6"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
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

      {/* ── Hero ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center gap-8 py-16">

        {/* Eyebrow */}
        <div
          className="flex items-center gap-3"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          <div style={{
            height: "1px",
            width: "40px",
            backgroundColor: isDark ? "rgba(0,245,255,0.4)" : "rgba(107,77,6,0.4)",
          }} />
          <span
            className="text-xs uppercase tracking-widest"
            style={{
              color: isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.6)",
              fontFamily: "DM Mono, monospace",
            }}
          >
            The Card Counting Trainer
          </span>
          <div style={{
            height: "1px",
            width: "40px",
            backgroundColor: isDark ? "rgba(0,245,255,0.4)" : "rgba(107,77,6,0.4)",
          }} />
        </div>

        {/* Title */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s",
          }}
        >
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "clamp(64px, 12vw, 140px)",
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: "-0.02em",
              color: isDark ? "#ffffff" : "#1a1200",
              textShadow: isDark
                ? "0 0 80px rgba(0,245,255,0.15), 0 0 160px rgba(0,245,255,0.08)"
                : "none",
            }}
          >
            Soft
            <span style={{
              color: isDark ? "#00f5ff" : "#8b6508",
              textShadow: isDark
                ? "0 0 40px rgba(0,245,255,0.5), 0 0 80px rgba(0,245,255,0.2)"
                : "none",
            }}>
              17
            </span>
          </h1>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s",
          }}
        >
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
        </div>

        {/* Divider */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 1s ease 0.3s",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            width: "100%",
            maxWidth: "320px",
          }}
        >
          <div style={{ flex: 1, height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
          <span style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", fontSize: "16px" }}>♦</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
        </div>

        {/* CTAs */}
        <div
          className="flex flex-col gap-4 w-full"
          style={{
            maxWidth: "320px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.9s ease 0.35s, transform 0.9s ease 0.35s",
          }}
        >
          <LandingButton
            label="Play as Guest"
            onClick={() => router.push("/game")}
            variant="primary"
            isDark={isDark}
          />
          <LandingButton
            label="Log In"
            onClick={() => router.push("/login")}
            variant="secondary"
            isDark={isDark}
          />
          <LandingButton
            label="Create Account"
            onClick={() => router.push("/signup")}
            variant="ghost"
            isDark={isDark}
          />
        </div>

        {/* Feature pills */}
        <div
          className="flex flex-wrap gap-3 justify-center"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 1s ease 0.5s",
            maxWidth: "480px",
          }}
        >
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

      {/* ── Footer ── */}
      <div
        className="relative z-10 flex justify-center pb-8"
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 1s ease 0.6s",
        }}
      >
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "10px",
            letterSpacing: "0.15em",
            color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
          }}
        >
          ♠ ♥ ♦ ♣
        </span>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes float-card-0 {
          0%   { transform: translateY(0px); opacity: 0; }
          15%  { opacity: 0.07; }
          85%  { opacity: 0.07; }
          100% { transform: translateY(-18px); opacity: 0; }
        }
        @keyframes float-card-1 {
          0%   { transform: translateY(0px); opacity: 0; }
          15%  { opacity: 0.06; }
          85%  { opacity: 0.06; }
          100% { transform: translateY(-24px); opacity: 0; }
        }
        @keyframes float-card-2 {
          0%   { transform: translateY(0px); opacity: 0; }
          15%  { opacity: 0.08; }
          85%  { opacity: 0.08; }
          100% { transform: translateY(-14px); opacity: 0; }
        }
        @keyframes float-card-3 {
          0%   { transform: translateY(0px); opacity: 0; }
          15%  { opacity: 0.05; }
          85%  { opacity: 0.05; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}