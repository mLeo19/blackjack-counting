import { Card, Suit, Rank } from "@/types";

// Constants

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// Deck

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceDown: false });
    }
  }
  return deck; // 52 cards
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shoe (standard 6 decks)

export function createShoe(numDecks: number = 6): Card[] {
  const shoe: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    shoe.push(...createDeck());
  }
  return shuffleDeck(shoe);
}

export function dealCard(shoe: Card[], faceDown: boolean = false): { card: Card; remaining: Card[] } {
  const remaining = [...shoe];
  const card = { ...remaining.pop()!, faceDown };
  return { card, remaining }; // return the dealt card and the new shoe state
}

export function shouldReshuffle(shoe: Card[], numDecks: number = 6): boolean {
  const totalCards = numDecks * 52;
  const penetration = 1 - shoe.length / totalCards;
  return penetration >= 0.75; // reshuffle after 75% of shoe is dealt
}

export function decksRemaining(shoe: Card[], numDecks: number = 6): number {
  return parseFloat((shoe.length / 52).toFixed(2)); // needed for true count calculation
}