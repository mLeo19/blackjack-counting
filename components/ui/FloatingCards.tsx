"use client";

import { useState, useEffect } from "react";

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

export default function FloatingCards({ isDark, count = 12 }: { isDark: boolean; count?: number }) {
  const [cards] = useState(() => generateCards(count));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
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
          <div style={{
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
          }}>
            <span style={{
              fontSize: "24px",
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              color: card.isRed ? isDark ? "#b91c1c" : "#ff4444" : isDark ? "#1c1917" : "#e8f5e8",
              lineHeight: 1,
            }}>
              {card.rank}
            </span>
            <span style={{
              fontSize: "20px",
              color: card.isRed ? isDark ? "#b91c1c" : "#ff4444" : isDark ? "#1c1917" : "#e8f5e8",
              lineHeight: 1,
            }}>
              {card.suit}
            </span>
          </div>
        </div>
      ))}

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
    </>
  );
}