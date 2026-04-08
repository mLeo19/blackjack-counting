"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

interface FlyingCardProps {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  faceDown: boolean;
  rank: string;
  suit: string;
  onComplete: (id: string) => void;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const RED_SUITS = ["hearts", "diamonds"];

export default function FlyingCard({
  id,
  from,
  to,
  faceDown,
  rank,
  suit,
  onComplete,
}: FlyingCardProps) {
  const controls = useAnimation();
  const hasRun = useRef(false);
  const isRed = RED_SUITS.includes(suit);
  const suitColor = isRed ? "#b91c1c" : "#1c1917";
  const suitSymbol = SUIT_SYMBOLS[suit];

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function animate() {
      await new Promise((res) => requestAnimationFrame(res));

      await controls.set({
        x: from.x,
        y: from.y,
        rotateY: 180,
        opacity: 1,
      });

      await controls.start({
        x: to.x,
        y: to.y,
        transition: { duration: 0.35, ease: "easeOut" },
      });

      if (!faceDown) {
        await controls.start({
          rotateY: 0,
          transition: { duration: 0.2, ease: "easeInOut" },
        });
      }

      onComplete(id);
    }

    animate();
  }, []);

  const cardFace = (
    <div
      className="absolute inset-0 rounded-xl select-none overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #fdfaf4, #f5ede0)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
        border: "1px solid rgba(180,160,120,0.4)",
      }}
    >
      {/* Subtle inner border */}
      <div
        className="absolute inset-1 rounded-lg pointer-events-none"
        style={{ border: "0.5px solid rgba(180,150,100,0.25)" }}
      />

      {/* Top left corner */}
      <div
        className="absolute top-1.5 left-2 flex flex-col items-center leading-none"
        style={{ color: suitColor }}
      >
        <span
          style={{
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            lineHeight: 1,
          }}
        >
          {rank}
        </span>
        <span style={{ fontSize: "11px", lineHeight: 1, marginTop: "1px" }}>
          {suitSymbol}
        </span>
      </div>

      {/* Center suit */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: suitColor }}
      >
        <span style={{ fontSize: "28px", opacity: 0.85 }}>{suitSymbol}</span>
      </div>

      {/* Bottom right corner (rotated) */}
      <div
        className="absolute bottom-1.5 right-2 flex flex-col items-center leading-none rotate-180"
        style={{ color: suitColor }}
      >
        <span
          style={{
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            lineHeight: 1,
          }}
        >
          {rank}
        </span>
        <span style={{ fontSize: "11px", lineHeight: 1, marginTop: "1px" }}>
          {suitSymbol}
        </span>
      </div>
    </div>
  );

  const cardBack = (
    <div
      className="absolute inset-0 rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #1e3a5f, #162d4a)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Outer border */}
      <div
        className="absolute inset-1 rounded-lg"
        style={{ border: "0.5px solid rgba(255,255,255,0.15)" }}
      />
      {/* Inner border */}
      <div
        className="absolute inset-2 rounded-md"
        style={{ border: "0.5px solid rgba(255,255,255,0.08)" }}
      />

      {/* Diamond pattern */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <svg width="60" height="90" viewBox="0 0 60 90">
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => (
              <text
                key={`${row}-${col}`}
                x={col * 16 + (row % 2 === 0 ? 6 : 14)}
                y={row * 18 + 14}
                fontSize="10"
                fill="white"
                textAnchor="middle"
              >
                ♦
              </text>
            ))
          )}
        </svg>
      </div>

      {/* Center emblem */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: "28px",
            height: "28px",
            background: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.2)",
          }}
        >
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>♠</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: "none",
        perspective: "600px",
      }}
    >
      <motion.div
        animate={controls}
        style={{
          width: "80px",
          height: "128px",
          position: "absolute",
          transformStyle: "preserve-3d",
          translateX: "-50%",
          translateY: "-50%",
          opacity: 0,
        }}
      >
        <div style={{ backfaceVisibility: "hidden" }} className="absolute inset-0">
          {cardFace}
        </div>
        <div
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          className="absolute inset-0"
        >
          {cardBack}
        </div>
      </motion.div>
    </div>
  );
}