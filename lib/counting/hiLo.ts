import { Card, Rank } from "@/types";

// ─── Hi-Lo card values ────────────────────────────────────────────────────────

const HI_LO_VALUES: Record<Rank, number> = {
  "2": 1,
  "3": 1,
  "4": 1,
  "5": 1,
  "6": 1,
  "7": 0,
  "8": 0,
  "9": 0,
  "10": -1,
  "J": -1,
  "Q": -1,
  "K": -1,
  "A": -1,
};

export function getHiLoValue(card: Card): number {
  if (card.faceDown) return 0; // don't count face down cards
  return HI_LO_VALUES[card.rank];
}

export function calculateTrueCount(runningCount: number, decksRemaining: number): number {
  if (decksRemaining <= 0) return 0;
  return parseFloat((runningCount / decksRemaining).toFixed(1));
}