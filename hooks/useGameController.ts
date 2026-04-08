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
  bringToTop
} from "@/lib/blackjack/engine";
import { createHand, isBlackjack, isBust } from "@/lib/blackjack/hand";
import { useShoeContext } from "@/context/ShoeContext";

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

  const [visibleGame, setVisibleGame] = useState<GameState>(createInitialState());
  const [isAnimating, setIsAnimating] = useState(false);
  const [visibleBankroll, setVisibleBankroll] = useState(createInitialState().bankroll); // for smooth bankroll animation
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

  // ── Reveal card in hand state ──
  const revealInHand = useCallback((
    target: "player" | "dealer",
    cardIndex: number,
    handIndex: number,
    card: Card,
    faceDown: boolean,
  ) => {
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
  }, []);

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
    if (isProcessing.current) return; // ← block immediately
    isProcessing.current = true;
    setIsAnimating(true);
    const resolved = engineDeal(resolvedGame.current, bet);
    resolvedGame.current = resolved;
    console.log("resolved.bankroll after deal:", resolved.bankroll);
    console.log("resolved.phase:", resolved.phase);
    

    const p1 = resolved.playerHands[0].cards[0];
    const d1 = resolved.dealerHand.cards[0];
    const p2 = resolved.playerHands[0].cards[1];
    const d2 = resolved.dealerHand.cards[1];

    //setVisibleBankroll(visibleBankroll - bet); // ← show deduction immediately
    setVisibleBankroll((prev) => prev - bet);

    setVisibleGame((prev) => ({
      ...prev,
      phase: "dealing" as any, // ← new phase that hides the deal button
      //bankroll: resolved.bankroll,
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
    isProcessing.current = false; // ← unblock at the end
  }, [dealOneCard]);

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

    setIsAnimating(false);
  }, [visibleGame, dealOneCard]);

  // ── Stand ─────────────────────────────────────────────────────────────────
  const stand = useCallback(async () => {
    const resolved = engineStand(resolvedGame.current);
    resolvedGame.current = resolved;
    setIsAnimating(true);

    // if still playerTurn, more split hands remain — just advance
    if (resolved.phase === "playerTurn") {
      setVisibleGame((prev) => ({
        ...prev,
        phase: resolved.phase,
        activeHandIndex: resolved.activeHandIndex,
      }));
      setIsAnimating(false);
      return;
    }

    // all hands done — run settlement
    await runSettlement(resolved);
    setIsAnimating(false);
  }, []);

  // ── Double Down ───────────────────────────────────────────────────────────
  const doubleDown = useCallback(async () => {
    const resolved = engineDouble(resolvedGame.current);
    resolvedGame.current = resolved;
    setIsAnimating(true);

    const handIndex = visibleGame.activeHandIndex;

    // deduct the extra bet immediately
    const activeBet = visibleGame.playerHands[handIndex].bet;
    setVisibleBankroll((prev) => prev - activeBet);

    const newCardIndex = visibleGame.playerHands[handIndex]?.cards.length ?? 0;
    const newCard = resolved.playerHands[handIndex].cards[newCardIndex];

    await dealOneCard(newCard, "player", newCardIndex, handIndex, false);

    // if still playerTurn, more split hands remain — just advance
    if (resolved.phase === "playerTurn") {
      setVisibleGame((prev) => ({
        ...prev,
        phase: resolved.phase,
        activeHandIndex: resolved.activeHandIndex,
        shoe: resolved.shoe,
        bankroll: resolved.bankroll,
      }));
      setIsAnimating(false);
      return;
    }

    await runSettlement(resolved);
    setIsAnimating(false);
  }, [visibleGame, dealOneCard]);

  // ── Insurance ─────────────────────────────────────────────────────────────
  const takeInsurance = useCallback(() => {
    const resolved = engineInsurance(resolvedGame.current);
    resolvedGame.current = resolved;
    setVisibleBankroll(resolved.bankroll); // ← deduct insurance bet immediately
    setVisibleGame(resolved);
  }, []);

  const declineInsurance = useCallback(() => {
    const resolved = engineDeclineInsurance(resolvedGame.current);
    resolvedGame.current = resolved;
    setVisibleGame(resolved);
  }, []);

  // ── Settlement ────────────────────────────────────────────────────────────
  const runSettlement = useCallback(async (resolved: GameState) => {
  const playerHasBlackjack = resolved.playerHands.some(
    (h) => isBlackjack(h.cards) && !h.isSplit
  );
  const allBustOrSurrender = resolved.playerHands.every(
    (h) => isBust(h.cards) || h.isSurrendered
  );

  // flip hole card
  setVisibleGame((prev) => ({
    ...prev,
    dealerHand: {
      ...prev.dealerHand,
      cards: prev.dealerHand.cards.map((c) => ({ ...c, faceDown: false })),
    },
  }));

  // shorter wait when no dealer draw needed
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
}, [dealOneCard]);

  // ── Split ─────────────────────────────────────────────────────────────────
  const split = useCallback(async () => {
    const resolved = engineSplit(resolvedGame.current);
    resolvedGame.current = resolved;
    const activeBet = visibleGame.playerHands[visibleGame.activeHandIndex].bet;
    setVisibleBankroll((prev) => prev - activeBet);
    //setVisibleGame(resolved);

    // if splitting Aces auto-resolved to roundOver, run settlement
    if (resolved.phase === "roundOver") {
      // don't dump resolved state yet — let runSettlement handle the reveal
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
  }, [visibleGame, runSettlement]);

  // ── Surrender ─────────────────────────────────────────────────────────────
  const surrender = useCallback(async () => {
    const resolved = engineSurrender(resolvedGame.current);
    resolvedGame.current = resolved;
    setIsAnimating(true);
    await runSettlement(resolved);
    setIsAnimating(false);
  }, [runSettlement]);

  // ── New Round ─────────────────────────────────────────────────────────────
  const newRound = useCallback(() => {
    const resolved = engineNewRound(resolvedGame.current);
    resolvedGame.current = resolved;
    setFlyingCards([]);
    setVisibleGame(resolved);
    setVisibleBankroll(resolved.bankroll);
  }, []);

  const debugDeal = useCallback(async (
    targets: { rank: string; suit?: string }[]
  ) => {
    if (isProcessing.current) return;
    // targets = [p1, d1, p2, d2]
    const stateWithCards = bringToTop(resolvedGame.current, targets);
    resolvedGame.current = stateWithCards;
    // now deal normally with the reordered shoe
    await deal(50);
  }, [deal]);

  const forceReshuffle = useCallback(() => {
    resolvedGame.current = {
      ...resolvedGame.current,
      shoe: resolvedGame.current.shoe.slice(0, 10), // keep only 10 cards
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