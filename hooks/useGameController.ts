import { useState, useRef, useCallback } from "react";
import { GameState, Card } from "@/types";
import {
  createInitialState,
  deal as engineDeal,
  hit as engineHit,
  stand as engineStand,
  doubleDown as engineDouble,
  split as engineSplit,
  surrender as engineSurrender,
  takeInsurance as engineInsurance,
  declineInsurance as engineDeclineInsurance,
  newRound as engineNewRound,
  bringToTop,
} from "@/lib/blackjack/engine";
import { createHand, isBlackjack, isBust } from "@/lib/blackjack/hand";
import { useShoeContext } from "@/context/ShoeContext";
import { useCountStore } from "@/store/countStore";
import { getHiLoValue, calculateTrueCount } from "@/lib/counting/hiLo";
import { decksRemaining } from "@/lib/blackjack/deck";

export interface FlyingCardData {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  faceDown: boolean;
  rank: string;
  suit: string;
}

interface Position { x: number; y: number }

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

let flyingCardIdCounter = 0;

export function useGameController() {
  const { getShoePosition, getDealerPosition, getPlayerPosition } = useShoeContext();
  const { addCount, setTrueCount, resetCount, resetHint, clearHistory } = useCountStore();

  const [visibleGame, setVisibleGame] = useState<GameState>(createInitialState());
  const [visibleBankroll, setVisibleBankroll] = useState(createInitialState().bankroll);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([]);
  const resolvedGame = useRef<GameState>(createInitialState());
  const pendingResolves = useRef<Record<string, () => void>>({});
  const isProcessing = useRef(false);

  // ── Called by FlyingCard when animation completes ──
  const onFlyingCardComplete = useCallback((id: string) => {
    setFlyingCards((prev) => prev.filter((c) => c.id !== id));
    pendingResolves.current[id]?.();
    delete pendingResolves.current[id];
  }, []);

  // ── Launch a flying card and wait for it to complete ──
  const flyCard = useCallback((
    card: Card,
    from: Position,
    to: Position,
    faceDown: boolean,
  ): Promise<void> => {
    return new Promise((resolve) => {
      const id = `card-${flyingCardIdCounter++}`;
      pendingResolves.current[id] = resolve;
      setFlyingCards((prev) => [...prev, {
        id,
        from,
        to,
        faceDown,
        rank: card.rank,
        suit: card.suit,
      }]);
    });
  }, []);

  // ── Reveal card in hand state and update count ──
  const revealInHand = useCallback((
    target: "player" | "dealer",
    cardIndex: number,
    handIndex: number,
    card: Card,
    faceDown: boolean,
  ) => {
    // update count BEFORE setVisibleGame — never inside an updater function
    if (!faceDown) {
      const hiLoValue = getHiLoValue(card);
      const currentRunning = useCountStore.getState().runningCount;
      const newRunning = currentRunning + hiLoValue;
      addCount(hiLoValue, card.rank);
      const decksLeft = decksRemaining(resolvedGame.current.shoe);
      setTrueCount(calculateTrueCount(newRunning, decksLeft));
    }

    setVisibleGame((prev) => {
      if (target === "dealer") {
        const updatedCards = [...prev.dealerHand.cards];
        updatedCards[cardIndex] = { ...card, faceDown };
        return { ...prev, dealerHand: { ...prev.dealerHand, cards: updatedCards } };
      } else {
        const updatedHands = prev.playerHands.map((h, i) => {
          if (i !== handIndex) return h;
          const updatedCards = [...h.cards];
          updatedCards[cardIndex] = { ...card, faceDown };
          return { ...h, cards: updatedCards };
        });
        return { ...prev, playerHands: updatedHands };
      }
    });
  }, [addCount, setTrueCount]);

  // ── Deal one card: fly it, then reveal in hand ──
  const dealOneCard = useCallback(async (
    card: Card,
    target: "player" | "dealer",
    cardIndex: number,
    handIndex: number,
    faceDown: boolean,
  ) => {
    const from = getShoePosition()!;
    const to = target === "dealer"
      ? getDealerPosition()!
      : getPlayerPosition(handIndex)!;
    await flyCard(card, from, to, faceDown);
    revealInHand(target, cardIndex, handIndex, card, faceDown);
  }, [getShoePosition, getDealerPosition, getPlayerPosition, flyCard, revealInHand]);

  // ── Deal ──────────────────────────────────────────────────────────────────
  const deal = useCallback(async (bet: number) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setIsAnimating(true);

    const resolved = engineDeal(resolvedGame.current, bet);
    resolvedGame.current = resolved;

    // reset count if shoe was reshuffled
    if (resolved.shoe.length >= 308) {
      resetCount();
    }

    const p1 = resolved.playerHands[0].cards[0];
    const d1 = resolved.dealerHand.cards[0];
    const p2 = resolved.playerHands[0].cards[1];
    const d2 = resolved.dealerHand.cards[1];

    setVisibleBankroll((prev) => prev - bet);
    // Clear count history
    clearHistory();
    setVisibleGame((prev) => ({
      ...prev,
      phase: "dealing" as any,
      shoe: resolved.shoe,
      playerHands: [{ ...createHand(bet), cards: [] }],
      dealerHand: { ...createHand(), cards: [] },
    }));

    await sleep(100);

    await dealOneCard(p1, "player", 0, 0, false);
    await sleep(80);
    await dealOneCard(d1, "dealer", 0, 0, false);
    await sleep(80);
    await dealOneCard(p2, "player", 1, 0, false);
    await sleep(80);
    await dealOneCard(d2, "dealer", 1, 0, true);

    setVisibleGame((prev) => ({
      ...prev,
      phase: resolved.phase,
      results: resolved.results,
    }));

    if (resolved.phase === "roundOver") {
      await runSettlement(resolved);
    }

    setIsAnimating(false);
    isProcessing.current = false;
  }, [dealOneCard, resetCount]);

  // ── Hit ───────────────────────────────────────────────────────────────────
  const hit = useCallback(async () => {
    const resolved = engineHit(resolvedGame.current);
    resolvedGame.current = resolved;
    setIsAnimating(true);

    const handIndex = visibleGame.activeHandIndex;
    const newCardIndex = visibleGame.playerHands[handIndex]?.cards.length ?? 0;
    const newCard = resolved.playerHands[handIndex].cards[newCardIndex];

    await dealOneCard(newCard, "player", newCardIndex, handIndex, false);

    setVisibleGame((prev) => ({
      ...prev,
      phase: resolved.phase,
      activeHandIndex: resolved.activeHandIndex,
      shoe: resolved.shoe,
      bankroll: resolved.bankroll,
    }));

    if (resolved.phase === "roundOver") {
      await runSettlement(resolved);
    }

    resetHint();
    setIsAnimating(false);
  }, [visibleGame, dealOneCard, resetHint]);

  // ── Settlement ────────────────────────────────────────────────────────────
  const runSettlement = useCallback(async (resolved: GameState) => {
    // update count for hole card BEFORE flipping it
    const holeCard = resolved.dealerHand.cards[1];
    if (holeCard) {
      const hiLoValue = getHiLoValue(holeCard);
      const currentRunning = useCountStore.getState().runningCount;
      const newRunning = currentRunning + hiLoValue;
      addCount(hiLoValue, holeCard.rank);
      const decksLeft = decksRemaining(resolved.shoe);
      setTrueCount(calculateTrueCount(newRunning, decksLeft));
    }

    // flip hole card
    setVisibleGame((prev) => ({
      ...prev,
      dealerHand: {
        ...prev.dealerHand,
        cards: prev.dealerHand.cards.map((c) => ({ ...c, faceDown: false })),
      },
    }));

    const playerHasBlackjack = resolved.playerHands.some(
      (h) => isBlackjack(h.cards) && !h.isSplit
    );
    const allBustOrSurrender = resolved.playerHands.every(
      (h) => isBust(h.cards) || h.isSurrendered
    );

    await sleep(playerHasBlackjack || allBustOrSurrender ? 300 : 600);

    if (!playerHasBlackjack && !allBustOrSurrender) {
      const resolvedDealerCards = resolved.dealerHand.cards;
      for (let i = 2; i < resolvedDealerCards.length; i++) {
        await dealOneCard(resolvedDealerCards[i], "dealer", i, 0, false);
        await sleep(80);
      }
    }

    await sleep(playerHasBlackjack || allBustOrSurrender ? 100 : 300);
    setVisibleBankroll(resolved.bankroll);

    if (playerHasBlackjack || allBustOrSurrender) {
      setVisibleGame((prev) => ({
        ...resolved,
        dealerHand: {
          ...resolved.dealerHand,
          cards: prev.dealerHand.cards,
        },
      }));
    } else {
      setVisibleGame(resolved);
    }
  }, [dealOneCard, addCount, setTrueCount]);

  // ── Stand ─────────────────────────────────────────────────────────────────
  const stand = useCallback(async () => {
    const resolved = engineStand(resolvedGame.current);
    resolvedGame.current = resolved;
    setIsAnimating(true);

    if (resolved.phase === "playerTurn") {
      setVisibleGame((prev) => ({
        ...prev,
        phase: resolved.phase,
        activeHandIndex: resolved.activeHandIndex,
      }));
      resetHint();
      setIsAnimating(false);
      return;
    }

    await runSettlement(resolved);
    resetHint();
    setIsAnimating(false);
  }, [runSettlement, resetHint]);

  // ── Double Down ───────────────────────────────────────────────────────────
  const doubleDown = useCallback(async () => {
    const resolved = engineDouble(resolvedGame.current);
    resolvedGame.current = resolved;
    setIsAnimating(true);

    const handIndex = visibleGame.activeHandIndex;
    const activeBet = visibleGame.playerHands[handIndex].bet;
    setVisibleBankroll((prev) => prev - activeBet);

    const newCardIndex = visibleGame.playerHands[handIndex]?.cards.length ?? 0;
    const newCard = resolved.playerHands[handIndex].cards[newCardIndex];

    await dealOneCard(newCard, "player", newCardIndex, handIndex, false);

    if (resolved.phase === "playerTurn") {
      setVisibleGame((prev) => ({
        ...prev,
        phase: resolved.phase,
        activeHandIndex: resolved.activeHandIndex,
        shoe: resolved.shoe,
        bankroll: resolved.bankroll,
      }));
      resetHint();
      setIsAnimating(false);
      return;
    }

    await runSettlement(resolved);
    resetHint();
    setIsAnimating(false);
  }, [visibleGame, dealOneCard, runSettlement, resetHint]);

  // ── Split ─────────────────────────────────────────────────────────────────
  const split = useCallback(async () => {
    const resolved = engineSplit(resolvedGame.current);
    resolvedGame.current = resolved;
    const activeBet = visibleGame.playerHands[visibleGame.activeHandIndex].bet;
    setVisibleBankroll((prev) => prev - activeBet);

    if (resolved.phase === "roundOver") {
      setVisibleGame((prev) => ({
        ...prev,
        playerHands: resolved.playerHands,
        activeHandIndex: resolved.activeHandIndex,
        shoe: resolved.shoe,
        bankroll: prev.bankroll,
      }));
      setIsAnimating(true);
      await runSettlement(resolved);
      setIsAnimating(false);
    } else {
      setVisibleGame(resolved);
    }

    resetHint();
  }, [visibleGame, runSettlement, resetHint]);

  // ── Surrender ─────────────────────────────────────────────────────────────
  const surrender = useCallback(async () => {
    const resolved = engineSurrender(resolvedGame.current);
    resolvedGame.current = resolved;
    setIsAnimating(true);
    await runSettlement(resolved);
    resetHint();
    setIsAnimating(false);
  }, [runSettlement, resetHint]);

  // ── Insurance ─────────────────────────────────────────────────────────────
  const takeInsurance = useCallback(() => {
    const resolved = engineInsurance(resolvedGame.current);
    resolvedGame.current = resolved;
    setVisibleBankroll(resolved.bankroll);
    setVisibleGame(resolved);
  }, []);

  const declineInsurance = useCallback(() => {
    const resolved = engineDeclineInsurance(resolvedGame.current);
    resolvedGame.current = resolved;
    setVisibleGame(resolved);
  }, []);

  // ── New Round ─────────────────────────────────────────────────────────────
  const newRound = useCallback(() => {
    const resolved = engineNewRound(resolvedGame.current);
    resolvedGame.current = resolved;
    setFlyingCards([]);
    setVisibleGame(resolved);
    setVisibleBankroll(resolved.bankroll);
    resetHint();
  }, [resetHint]);

  // ── Debug ─────────────────────────────────────────────────────────────────
  const debugDeal = useCallback(async (
    targets: { rank: string; suit?: string }[]
  ) => {
    if (isProcessing.current) return;
    const stateWithCards = bringToTop(resolvedGame.current, targets);
    resolvedGame.current = stateWithCards;
    await deal(50);
  }, [deal]);

  const forceReshuffle = useCallback(() => {
    resolvedGame.current = {
      ...resolvedGame.current,
      shoe: resolvedGame.current.shoe.slice(0, 10),
    };
    setVisibleGame((prev) => ({
      ...prev,
      shoe: resolvedGame.current.shoe,
    }));
  }, []);

  return {
    game: { ...visibleGame, bankroll: visibleBankroll },
    isAnimating,
    flyingCards,
    onFlyingCardComplete,
    deal,
    hit,
    stand,
    doubleDown,
    split,
    surrender,
    takeInsurance,
    declineInsurance,
    newRound,
    debugDeal,
    forceReshuffle,
  };
}