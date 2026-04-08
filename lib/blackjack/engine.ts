import { GameState, Hand, Card, HandResult, GamePhase } from "@/types";
import { createShoe, dealCard, shouldReshuffle } from "./deck";
import { createHand, getHandValue, isBlackjack, isBust, canSplit } from "./hand";
import { playDealerHand } from "./dealer";

// Constants

const NUM_DECKS = 6;
const STARTING_BANKROLL = 1000;

// Initial state

export function createInitialState(): GameState {
  return {
    phase: "idle",
    shoe: createShoe(NUM_DECKS),
    dealerHand: createHand(),
    playerHands: [],
    activeHandIndex: 0,
    bankroll: STARTING_BANKROLL,
    results: [],
    insuranceBet: 0,
  };
}

// Deal

export function deal(state: GameState, bet: number): GameState {
  if (bet > state.bankroll) throw new Error("Bet exceeds bankroll");
  if (bet <= 0) throw new Error("Bet must be greater than 0");

  let shoe = shouldReshuffle(state.shoe, NUM_DECKS)
    ? createShoe(NUM_DECKS)
    : [...state.shoe];

  // deal: player, dealer, player, dealer (standard order)
  const { card: p1, remaining: s1 } = dealCard(shoe);
  const { card: d1, remaining: s2 } = dealCard(s1);
  const { card: p2, remaining: s3 } = dealCard(s2);
  const { card: d2, remaining: s4 } = dealCard(s3, true); // hole card

  const playerHand: Hand = {
    cards: [p1, p2],
    bet,
    isDoubled: false,
    isSplit: false,
    isSurrendered: false,
    isLockedAce: false,
  };

  const dealerHand: Hand = {
    cards: [d1, d2],
    bet: 0,
    isDoubled: false,
    isSplit: false,
    isSurrendered: false,
    isLockedAce: false,
  };

  const hasBlackjack = isBlackjack([p1, p2]);

  // if player has blackjack, skip dealer play and settle immediately (dealer hand is revealed in settle function)
  if (hasBlackjack) {
    const dealerCards = [
      { ...d1, faceDown: false },
      { ...d2, faceDown: false },
    ];
    return settle({
    ...state,
    shoe: s4,
    playerHands: [playerHand],
    dealerHand: { ...dealerHand, cards: dealerCards },
    activeHandIndex: 0,
    bankroll: state.bankroll - bet,
    results: [],
    insuranceBet: 0,
    phase: "dealerTurn",
    });
  }

  // offer insurance if dealer shows an Ace
  const phase: GamePhase = d1.rank === "A" ? "insurance" : "playerTurn";

  return {
    ...state,
    shoe: s4,
    playerHands: [playerHand],
    activeHandIndex: 0,
    dealerHand,
    bankroll: state.bankroll - bet,
    results: [],
    insuranceBet: 0,
    phase,
  };
}

// Insurance

export function takeInsurance(state: GameState): GameState {
  if (state.phase !== "insurance") return state;
  const insuranceBet = Math.floor(state.playerHands[0].bet / 2);
  if (insuranceBet > state.bankroll) return state;

  return {
    ...state,
    insuranceBet,
    bankroll: state.bankroll - insuranceBet,
    phase: "playerTurn",
  };
}

export function declineInsurance(state: GameState): GameState {
  if (state.phase !== "insurance") return state;
  return { ...state, insuranceBet: 0, phase: "playerTurn" };
}

// Hit

export function hit(state: GameState): GameState {
  if (state.phase !== "playerTurn") return state;
  const activeHand = state.playerHands[state.activeHandIndex];
  if (activeHand.isLockedAce) return state; // cannot hit on split aces

  const { card, remaining } = dealCard(state.shoe);
  
  const updatedCards = [...activeHand.cards, card];
  const updatedHand = {...activeHand, cards: updatedCards };
  const updatedHands = state.playerHands.map((h, i) =>
    i === state.activeHandIndex ? updatedHand : h
  );

  if (isBust(updatedCards) || getHandValue(updatedCards) === 21) {
    return advanceHand({
      ...state,
      shoe: remaining,
      playerHands: updatedHands,
    });
  }

  return {
    ...state,
    shoe: remaining,
    playerHands: updatedHands 
  };
}

// Stand

export function stand(state: GameState): GameState {
  if (state.phase !== "playerTurn") return state;
  const activeHand = state.playerHands[state.activeHandIndex];
  if (activeHand.isLockedAce) return state; // ← add this line
  return advanceHand(state);
}

// Double down

export function doubleDown(state: GameState): GameState {
  if (state.phase !== "playerTurn") return state;
  const activeHand = state.playerHands[state.activeHandIndex];
  if (activeHand.cards.length !== 2) return state;
  if (state.bankroll < activeHand.bet) return state;

  const { card, remaining } = dealCard(state.shoe);
  const updatedHand: Hand = {
    ...activeHand,
    cards: [...activeHand.cards, card],
    bet: activeHand.bet * 2,
    isDoubled: true,
  };
  
  const updatedHands = state.playerHands.map((h, i) =>
    i === state.activeHandIndex ? updatedHand : h
  );

  return advanceHand({
    ...state,
    shoe: remaining,
    playerHands: updatedHands,
    bankroll: state.bankroll - activeHand.bet,
  });
}

// Split

export function split(state: GameState): GameState {
  if (state.phase !== "playerTurn") return state;
  const activeHand = state.playerHands[state.activeHandIndex];
  if (!canSplit(activeHand.cards)) return state;
  if (state.bankroll < activeHand.bet) return state;
  if (state.playerHands.length >= 4) return state; // max 4 hands

  const [card1, card2] = activeHand.cards;

  // deal one new card to each split hand
  const { card: newCard1, remaining: s1 } = dealCard(state.shoe);
  const { card: newCard2, remaining: s2 } = dealCard(s1);

  // if splitting aces, only deal one card to each and there are no re-splits
  const splittingAces = card1.rank === "A";

  const hand1: Hand = {
    cards: [card1, newCard1],
    bet: activeHand.bet,
    isDoubled: false,
    isSplit: true,
    isSurrendered: false,
    isLockedAce: splittingAces, // custom property to indicate this hand is from splitting aces
  };

  const hand2: Hand = {
    cards: [card2, newCard2],
    bet: activeHand.bet,
    isDoubled: false,
    isSplit: true,
    isSurrendered: false,
    isLockedAce: splittingAces,
  };

  // replace active hand with two new hands
  const updatedHands = [
    ...state.playerHands.slice(0, state.activeHandIndex),
    hand1,
    hand2,
    ...state.playerHands.slice(state.activeHandIndex + 1),
  ];

  const newState: GameState = {
    ...state,
    shoe: s2,
    playerHands: updatedHands,
    bankroll: state.bankroll - activeHand.bet,
  };

  // if splitting Aces, auto-advance since only one card is dealt per hand
  if (splittingAces) {
    return advanceHand(newState);
  }

return newState;
}

// Surrender

export function surrender(state: GameState): GameState {
  if (state.phase !== "playerTurn") return state;
  const activeHand = state.playerHands[state.activeHandIndex];
  if (activeHand.cards.length !== 2) return state; // early surrender only

  const updatedHand: Hand = { ...activeHand, isSurrendered: true };
  const updatedHands = state.playerHands.map((h, i) =>
    i === state.activeHandIndex ? updatedHand : h
  );

  return advanceHand({
    ...state,
    playerHands: updatedHands,
  });
}

// Function in order to test specific scenarios by manipulating the shoe order
export function bringToTop(
  state: GameState,
  // order: [p1, d1, p2, d2]
  targets: { rank: string; suit?: string }[]
): GameState {
  let shoe = [...state.shoe];
  const pulled: Card[] = [];

  for (const target of targets) {
    const index = shoe.findIndex(
      (c) =>
        c.rank === target.rank &&
        (target.suit ? c.suit === target.suit : true)
    );
    if (index !== -1) {
      pulled.push(shoe[index]);
      shoe.splice(index, 1);
    } else {
      console.warn(`Card not found in shoe: ${target.rank} ${target.suit ?? ""}`);
    }
  }

  // dealCard uses .pop() so last card = first dealt
  // pulled is [p1, d1, p2, d2], reverse to [d2, p2, d1, p1]
  return {
    ...state,
    shoe: [...shoe, ...pulled.reverse()],
  };
}

// Advance card: moves to the next split hand, or triggers dealer turn if all hands are done

function advanceHand(state: GameState): GameState {
  const nextIndex = state.activeHandIndex + 1;

  if (nextIndex < state.playerHands.length) {
    const nextHand = state.playerHands[nextIndex];
    const nextState = { ...state, activeHandIndex: nextIndex };
    if (nextHand.isLockedAce) {
      return advanceHand(nextState);
    }
    return nextState;
  }

  // *** NEW: skip dealer draw if all player hands busted or surrendered ***
  const allBustOrSurrender = state.playerHands.every(
    (h) => isBust(h.cards) || h.isSurrendered
  );

  if (allBustOrSurrender) {
    const dealerCards = state.dealerHand.cards.map((c) => ({ ...c, faceDown: false }));
    return settle({
      ...state,
      dealerHand: { ...state.dealerHand, cards: dealerCards },
      phase: "dealerTurn",
    });
  }
  // *** END NEW ***

  // all hands played — dealer's turn
  const { cards: dealerCards, shoe } = playDealerHand(
    state.dealerHand.cards,
    state.shoe
  );

  return settle({
    ...state,
    shoe,
    dealerHand: { ...state.dealerHand, cards: dealerCards },
    phase: "dealerTurn",
  });
}

// Settle

function settle(state: GameState): GameState {
  const dealerValue = getHandValue(state.dealerHand.cards);
  const dealerBJ = isBlackjack(state.dealerHand.cards);
  const dealerBust = isBust(state.dealerHand.cards);

  let bankroll = state.bankroll;

  // settle insurance first
  if (state.insuranceBet > 0) {
    if (dealerBJ) {
      bankroll += state.insuranceBet * 3; // insurance pays 2:1
    }
    // if no dealer BJ, insurance bet is already deducted
  }

  const results: HandResult[] = state.playerHands.map((hand) => {
    const playerValue = getHandValue(hand.cards);
    const playerBJ = isBlackjack(hand.cards);
    const playerBust = isBust(hand.cards);
    const bet = hand.bet;

    let result: HandResult;
    let payout = 0;

    if (hand.isSurrendered) {
      result = "surrender";
      payout = Math.floor(bet / 2); // return half the bet
    } else if (playerBust) {
      result = "bust";
      payout = 0;
    } else if (playerBJ && !hand.isSplit && dealerBJ) {
      result = "push";
      payout = bet;
    } else if (playerBJ && !hand.isSplit) {
      result = "blackjack";
      payout = bet + bet * 1.5; // 3:2
    } else if (dealerBJ) {
      result = "lose";
      payout = 0;
    } else if (dealerBust) {
      result = "win";
      payout = bet * 2;
    } else if (playerValue > dealerValue) {
      result = "win";
      payout = bet * 2;
    } else if (playerValue < dealerValue) {
      result = "lose";
      payout = 0;
    } else {
      result = "push";
      payout = bet;
    }

    bankroll += payout;
    return result;
  });

  return {
    ...state,
    bankroll,
    results,
    phase: "roundOver",
  };
}

// New round

export function newRound(state: GameState): GameState {
  return {
    ...state,
    playerHands: [],
    dealerHand: createHand(),
    activeHandIndex: 0,
    results: [],
    insuranceBet: 0,
    phase: "idle",
  };
}