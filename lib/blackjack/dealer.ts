import { Card } from "@/types";
import { getHandValue, isSoft } from "./hand";
import { dealCard } from "./deck";

// Dealer logic following standard casino rules:
// - Dealer hits on hard 16 or below
// - Dealer hits on soft 16 (e.g. A+5)
// - Dealer stands on hard 17 or above
// - Dealer stands on soft 17 (some casinos hit soft 17)

export function shouldDealerHit(cards: Card[]): boolean {
  const value = getHandValue(cards);
  if (value < 17) return true;
  if (value === 17 && isSoft(cards)) return false; // stand on soft 17
  return false;
}

// Reveal hole card

export function revealHoleCard(cards: Card[]): Card[] {
  return cards.map((card) => ({ ...card, faceDown: false }));
}

// Play dealer hand

export function playDealerHand(
  cards: Card[],
  shoe: Card[]
): { cards: Card[]; shoe: Card[] } {
  let dealerCards = revealHoleCard(cards);
  let currentShoe = [...shoe];

  while (shouldDealerHit(dealerCards)) {
    const { card, remaining } = dealCard(currentShoe);
    dealerCards = [...dealerCards, card];
    currentShoe = remaining;
  }

  return { cards: dealerCards, shoe: currentShoe };
}