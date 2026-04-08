// Card

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank =
  | "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  faceDown?: boolean;
}

// Hand

export interface Hand {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isSplit: boolean;
  isSurrendered: boolean;
  isLockedAce: boolean;
}

export type HandResult =
  | "blackjack"
  | "win"
  | "lose"
  | "push"
  | "bust"
  | "surrender";

// Game state

export type GamePhase = "idle" | "playerTurn" | "dealerTurn" | "roundOver" | "insurance";  // added "insurance" phase for future implementation

export interface GameState {
  phase: GamePhase;
  shoe: Card[];
  dealerHand: Hand;
  playerHands: Hand[]; // changed from single playerHand to array for potential splits
  activeHandIndex: number; // index of the currently active hand for player actions
  bankroll: number;
  results: HandResult[]; // array to store results for each player hand at the end of the round
  insuranceBet: number; // 0 if no insurance bet placed, otherwise amount of insurance bet (up to half of original bet)
}