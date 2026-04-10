import { Hand } from "@/types";
import { getHandValue, isSoft, canSplit, canDouble } from "@/lib/blackjack/hand";

export type Action = "hit" | "stand" | "double" | "split" | "surrender";

// ─── Basic Strategy lookup ────────────────────────────────────────────────────
// Based on standard 6-deck, dealer stands on soft 17

// Dealer up card value (2-11, where 11 = Ace)
function dealerUpValue(rank: string): number {
  if (rank === "A") return 11;
  if (["J", "Q", "K"].includes(rank)) return 10;
  return parseInt(rank);
}

// ─── Pair splitting ───────────────────────────────────────────────────────────
function pairStrategy(pairRank: string, dealerUp: number): Action {
  switch (pairRank) {
    case "A": return "split";
    case "8": return "split";
    case "9":
      return [7, 10, 11].includes(dealerUp) ? "stand" : "split";
    case "7":
      return dealerUp <= 7 ? "split" : "hit";
    case "6":
      return dealerUp <= 6 ? "split" : "hit";
    case "5":
      return dealerUp <= 9 ? "double" : "hit";
    case "4":
      return [5, 6].includes(dealerUp) ? "split" : "hit";
    case "3":
    case "2":
      return dealerUp <= 7 ? "split" : "hit";
    default:
      return "stand"; // 10s, Js, Qs, Ks
  }
}

// ─── Soft totals ──────────────────────────────────────────────────────────────
function softStrategy(total: number, dealerUp: number): Action {
  if (total >= 19) return "stand";
  if (total === 18) {
    if ([3, 4, 5, 6].includes(dealerUp)) return "double";
    if ([2, 7, 8].includes(dealerUp)) return "stand";
    return "hit";
  }
  if (total === 17) {
    return [3, 4, 5, 6].includes(dealerUp) ? "double" : "hit";
  }
  if (total === 16 || total === 15) {
    return [4, 5, 6].includes(dealerUp) ? "double" : "hit";
  }
  if (total === 14 || total === 13) {
    return [5, 6].includes(dealerUp) ? "double" : "hit";
  }
  return "hit";
}

// ─── Hard totals ──────────────────────────────────────────────────────────────
function hardStrategy(total: number, dealerUp: number, canDoubleDown: boolean, canSurrender: boolean): Action {
  if (total >= 17) return "stand";
  if (total >= 13 && total <= 16) {
    if (canSurrender && total === 16 && [9, 10, 11].includes(dealerUp)) return "surrender";
    if (canSurrender && total === 15 && dealerUp === 10) return "surrender";
    return dealerUp <= 6 ? "stand" : "hit";
  }
  if (total === 12) {
    return [4, 5, 6].includes(dealerUp) ? "stand" : "hit";
  }
  if (total === 11) {
    return canDoubleDown ? "double" : "hit";
  }
  if (total === 10) {
    return canDoubleDown && dealerUp <= 9 ? "double" : "hit";
  }
  if (total === 9) {
    return canDoubleDown && [3, 4, 5, 6].includes(dealerUp) ? "double" : "hit";
  }
  return "hit";
}

// ─── Main strategy function ───────────────────────────────────────────────────
export function getBasicStrategy(
  playerHand: Hand,
  dealerUpCard: string,
): Action {
  const dealerUp = dealerUpValue(dealerUpCard);
  const total = getHandValue(playerHand.cards);
  const soft = isSoft(playerHand.cards);
  const canDoubleDown = canDouble(playerHand.cards) && !playerHand.isLockedAce;
  const canSplit2 = canSplit(playerHand.cards) && !playerHand.isLockedAce;
  const canSurrender2 = playerHand.cards.length === 2 && !playerHand.isSplit;

  // pairs
  if (canSplit2) {
    return pairStrategy(playerHand.cards[0].rank, dealerUp);
  }

  // soft hands
  if (soft) {
    const action = softStrategy(total, dealerUp);
    if (action === "double" && !canDoubleDown) return "hit";
    return action;
  }

  // hard hands
  return hardStrategy(total, dealerUp, canDoubleDown, canSurrender2);
}