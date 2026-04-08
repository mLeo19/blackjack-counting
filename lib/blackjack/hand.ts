import { Card, Hand, Rank } from "@/types";

// Card value

function getCardValue(rank: Rank): number {
  if (["J", "Q", "K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank);
}

// Hand value

export function getHandValue(cards: Card[]): number {
  const visibleCards = cards.filter((c) => !c.faceDown); // skip face-down cards to account for dealer's hole card

  let total = 0;
  let aces = 0;

  for (const card of visibleCards) {
    total += getCardValue(card.rank);
    if (card.rank === "A") aces++;
  }

  // downgrade aces from 11 to 1 as needed to avoid bust
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

// Hand state

export function isBust(cards: Card[]): boolean {
  return getHandValue(cards) > 21;
}

export function isBlackjack(cards: Card[]): boolean {
  return (
    cards.length === 2 &&
    cards.every((c) => !c.faceDown) &&
    getHandValue(cards) === 21
  );
}

export function isSoft(cards: Card[]): boolean {
  // a hand is soft if it contains an ace counted as 11
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    total += getCardValue(card.rank);
    if (card.rank === "A") aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return aces > 0; // at least one ace still counted as 11
}

export function canSplit(cards: Card[]): boolean {
  return cards.length === 2 && cards[0].rank === cards[1].rank;
}

export function canDouble(cards: Card[]): boolean {
  return cards.length === 2;
}

// Create the hand

export function createHand(bet: number = 0): Hand {
  return {
    cards: [],
    bet,
    isDoubled: false,
    isSplit: false,
    isSurrendered: false,
    isLockedAce: false,
  };
}