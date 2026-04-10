"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

interface BetControlsProps {
  bankroll: number;
  onDeal: (bet: number) => void;
  maxBet?: number;
  minBet?: number;
}

const CHIPS = [
  { value: 10,  color: "#1d4ed8", border: "#1e40af", shine: "#3b82f6", label: "$10" },
  { value: 25,  color: "#15803d", border: "#166534", shine: "#22c55e", label: "$25" },
  { value: 50,  color: "#b91c1c", border: "#991b1b", shine: "#ef4444", label: "$50" },
  { value: 100, color: "#1c1917", border: "#000000", shine: "#57534e", label: "$100" },
  { value: 500, color: "#7e22ce", border: "#6b21a8", shine: "#a855f7", label: "$500" },
];

function Chip({
  value,
  color,
  border,
  shine,
  label,
  disabled,
  onClick,
  size = "lg",
}: {
  value: number;
  color: string;
  border: string;
  shine: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? 64 : 44;
  const fontSize = size === "lg" ? "11px" : "9px";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{
        width: `${dim}px`,
        height: `${dim}px`,
        backgroundColor: color,
        border: `3px solid ${border}`,
        boxShadow: disabled
          ? "none"
          : `0 6px 16px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3), inset 0 2px 0 ${shine}60, inset 0 -2px 0 rgba(0,0,0,0.3)`,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 2px 0 ${shine}80, inset 0 -2px 0 rgba(0,0,0,0.3), 0 0 16px ${shine}50`;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = `0 6px 16px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3), inset 0 2px 0 ${shine}60, inset 0 -2px 0 rgba(0,0,0,0.3)`;
      }}
    >
      {/* Outer dashed ring */}
      <div
        className="absolute rounded-full"
        style={{
          inset: "4px",
          border: "1.5px dashed rgba(255,255,255,0.45)",
        }}
      />
      {/* Inner shine arc */}
      <div
        className="absolute rounded-full"
        style={{
          top: "5px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: "30%",
          background: `linear-gradient(to bottom, ${shine}50, transparent)`,
          borderRadius: "999px",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          color: "white",
          fontSize,
          fontWeight: 700,
          fontFamily: "DM Mono, monospace",
          letterSpacing: "0.02em",
          textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

export default function BetControls({ bankroll, onDeal, maxBet = 500, minBet = 10 }: BetControlsProps) {
  const [bet, setBet] = useState(0);
  const [chipStack, setChipStack] = useState<typeof CHIPS[0][]>([]);
  const { theme } = useTheme();

  const addChip = (chip: typeof CHIPS[0]) => {
    if (bet + chip.value > maxBet) return;
    if (bet + chip.value > bankroll) return;
    setBet((prev) => prev + chip.value);
    setChipStack((prev) => [...prev, chip]);
  };

  const clearBet = () => {
    setBet(0);
    setChipStack([]);
  };

  const handleDeal = () => {
    if (bet < minBet || bet > bankroll) return;
    onDeal(bet);
    setBet(0);
    setChipStack([]);
  };

  const canDeal = bet >= minBet && bet <= bankroll;

  return (
    <div className="flex flex-col items-center gap-4">

      {/* Bet label */}
      <span
        className="text-xs uppercase tracking-widest"
        style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}
      >
        {bet > 0 ? `Bet: $${bet}` : "Place your bet"}
      </span>

      {/* Chip stack display */}
      <div
        className="relative flex items-end justify-center"
        style={{ height: "90px", width: "64px" }}
      >
        {chipStack.length === 0 ? (
          <div
            className="absolute bottom-0 w-14 rounded-full"
            style={{
              height: "3px",
              backgroundColor: theme === "dark" ? "rgba(0,245,255,0.15)" : "rgba(107,77,6,0.2)",
            }}
          />
        ) : (
          chipStack.map((chip, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: "52px",
                height: "52px",
                bottom: `${i * 7}px`,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: chip.color,
                border: `3px solid ${chip.border}`,
                boxShadow: `0 4px 8px rgba(0,0,0,0.5), inset 0 2px 0 ${chip.shine}60, inset 0 -2px 0 rgba(0,0,0,0.3)`,
                zIndex: i,
              }}
            >
              {/* Dashed ring on stack chip */}
              <div
                className="absolute rounded-full"
                style={{ inset: "4px", border: "1.5px dashed rgba(255,255,255,0.35)" }}
              />
              {/* Shine arc */}
              <div
                style={{
                  position: "absolute",
                  top: "5px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "55%",
                  height: "28%",
                  background: `linear-gradient(to bottom, ${chip.shine}50, transparent)`,
                  borderRadius: "999px",
                }}
              />
            </div>
          ))
        )}
      </div>

      {/* Chip selector */}
      <div className="flex gap-3 items-center flex-wrap justify-center">
        {CHIPS.map((chip) => (
          <Chip
            key={chip.value}
            {...chip}
            size="lg"
            disabled={
              bet + chip.value > maxBet ||
              bet + chip.value > bankroll ||
              bankroll < minBet
            }
            onClick={() => addChip(chip)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {/* Clear button */}
        <button
          onClick={clearBet}
          disabled={bet === 0}
          className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            padding: "10px 20px",
            borderRadius: "999px",
            backgroundColor: "transparent",
            border: theme === "dark"
              ? "1.5px solid rgba(255,255,255,0.2)"
              : "1.5px solid rgba(107,77,6,0.4)",
            color: theme === "dark" ? "rgba(255,255,255,0.6)" : "rgba(107,77,6,0.7)",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "DM Mono, monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            cursor: bet === 0 ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (bet === 0) return;
            e.currentTarget.style.backgroundColor = theme === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(107,77,6,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          Clear
        </button>

        {/* Bet / Deal button */}
        <button
          onClick={handleDeal}
          disabled={!canDeal}
          className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
          style={{
            padding: "10px 28px",
            borderRadius: "999px",
            fontSize: "12px",
            fontFamily: "DM Mono, monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            cursor: canDeal ? "pointer" : "not-allowed",
            transition: "all 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
            ...(theme === "dark" ? {
              background: canDeal
                ? "linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,180,0,0.9))"
                : "rgba(255,215,0,0.15)",
              border: "1.5px solid rgba(255,215,0,0.8)",
              color: canDeal ? "#1a1100" : "rgba(255,215,0,0.4)",
              boxShadow: canDeal
                ? "0 0 20px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)"
                : "none",
            } : {
              background: canDeal
                ? "linear-gradient(135deg, rgba(107,77,6,0.9), rgba(80,55,0,0.9))"
                : "rgba(107,77,6,0.1)",
              border: "2px solid rgba(107,77,6,0.8)",
              color: canDeal ? "#fff8e6" : "rgba(107,77,6,0.3)",
              boxShadow: canDeal
                ? "0 4px 16px rgba(107,77,6,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"
                : "none",
            }),
          }}
          onMouseEnter={(e) => {
            if (!canDeal) return;
            if (theme === "dark") {
              e.currentTarget.style.boxShadow = "0 0 32px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)";
            } else {
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(107,77,6,0.45), inset 0 1px 0 rgba(255,255,255,0.15)";
            }
          }}
          onMouseLeave={(e) => {
            if (!canDeal) return;
            if (theme === "dark") {
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)";
            } else {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(107,77,6,0.3), inset 0 1px 0 rgba(255,255,255,0.15)";
            }
          }}
        >
          {bet > 0 ? `Bet $${bet}` : "Place Bet"}
        </button>
      </div>

    </div>
  );
}