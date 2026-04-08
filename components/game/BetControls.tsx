"use client";

import { useState } from "react";

interface BetControlsProps {
  bankroll: number;
  onDeal: (bet: number) => void;
  maxBet?: number;
  minBet?: number;
}

const CHIPS = [
  { value: 10, color: "#1d4ed8", border: "#1e40af", label: "$10" },
  { value: 25, color: "#15803d", border: "#166534", label: "$25" },
  { value: 50, color: "#b91c1c", border: "#991b1b", label: "$50" },
  { value: 100, color: "#1c1917", border: "#000000", label: "$100" },
  { value: 500, color: "#7e22ce", border: "#6b21a8", label: "$500" },
];

function Chip({
  value,
  color,
  border,
  label,
  disabled,
  onClick,
  size = "lg",
}: {
  value: number;
  color: string;
  border: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? 64 : 40;
  const fontSize = size === "lg" ? "11px" : "8px";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{
        width: `${dim}px`,
        height: `${dim}px`,
        backgroundColor: color,
        border: `3px solid ${border}`,
        boxShadow: disabled
          ? "none"
          : `0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`,
      }}
    >
      {/* Outer ring */}
      <div
        className="absolute rounded-full"
        style={{
          inset: "4px",
          border: "1.5px dashed rgba(255,255,255,0.4)",
        }}
      />
      <span
        style={{
          color: "white",
          fontSize,
          fontWeight: 700,
          fontFamily: "Georgia, serif",
          letterSpacing: "0.02em",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
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

  return (
    <div className="flex flex-col items-center gap-4">

      {/* Chip stack display */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs uppercase tracking-widest text-green-400">
          {bet > 0 ? `Bet: $${bet}` : "Place your bet"}
        </span>

        {/* Stack */}
        <div
          className="relative flex items-end justify-center"
          style={{ height: "80px", width: "64px" }}
        >
          {chipStack.length === 0 ? (
            <div
              className="absolute bottom-0 w-16 h-1 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            />
          ) : (
            chipStack.map((chip, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: "48px",
                  height: "48px",
                  bottom: `${i * 6}px`,
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: chip.color,
                  border: `3px solid ${chip.border}`,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                  zIndex: i,
                }}
              >
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: "3px",
                    border: "1px dashed rgba(255,255,255,0.35)",
                  }}
                />
              </div>
            ))
          )}
        </div>
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
        <button
          onClick={clearBet}
          disabled={bet === 0}
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
        >
          Clear
        </button>
        <button
          onClick={handleDeal}
          disabled={bet < minBet || bet > bankroll}
          className="px-8 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors text-sm"
        >
          Deal ${bet}
        </button>
      </div>

    </div>
  );
}