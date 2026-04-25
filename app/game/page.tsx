"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/game/Card";
import FlyingCard from "@/components/game/FlyingCard";
import BetControls from "@/components/game/BetControls";
import CountOverlay from "@/components/game/CountOverlay";
import FloatingCards from "@/components/ui/FloatingCards";
import SessionGate from "@/app/game/SessionGate";
import GuestGate from "@/components/game/GuestGate";
import AvatarMenu from "@/components/game/AvatarMenu";
import GuestMenu from "@/components/game/GuestMenu";
import ActionButton from "@/components/game/ActionButton";
import TrainToggle from "@/components/game/TrainToggle";
import GameToast from "@/components/game/GameToast";
import { useGameController } from "@/hooks/useGameController";
import { useShoeContext } from "@/context/ShoeContext";
import { useTheme } from "@/context/ThemeContext";
import { useCountStore } from "@/store/countStore";
import { useProfile } from "@/hooks/useProfile";
import { saveBankroll, Profile, getOpenSession, updateSessionStats, updateLifetimeStats, updateStrategyStats, saveShoeAndCount } from "@/lib/supabase/profile";
import { decksRemaining } from "@/lib/blackjack/deck";
import { getHandValue, canSplit, canDouble } from "@/lib/blackjack/hand";
import { getBasicStrategy } from "@/lib/counting/basicStrategy";
import DebugPanel from "@/components/game/DebugPanel";
import { Card as CardType } from "@/types";
import { calculateTrueCount } from "@/lib/counting/hiLo";
import { createInitialState } from "@/lib/blackjack/engine";


function GameContent({
  profile, bankroll: initialBankroll, sessionId, onNewSession, onBankrollChange, shoe: initialShoe, runningCount: initialRunningCount,
}: {
  profile: Profile | null; bankroll: number; sessionId: string | null;
  onNewSession: () => void; onBankrollChange: (b: number) => void;
  shoe?: CardType[] | null;
  runningCount?: number;
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const {
    game, isAnimating, flyingCards, onFlyingCardComplete,
    deal, hit, stand, doubleDown, split, surrender,
    takeInsurance, declineInsurance, newRound, newShoe,
    debugDeal, forceReshuffle
  } = useGameController(initialBankroll, initialShoe as CardType[] ?? null);

  const { shoeRef, dealerHandRef, playerHandRefs } = useShoeContext();
  const { hintVisible, trainMode, toggleTrainMode, resetCount, clearHistory } = useCountStore();
  const [mounted, setMounted] = useState(false);
  const [shoeAnimating, setShoeAnimating] = useState(false);
  const [shoePhase, setShoePhase] = useState<"out" | "in" | null>(null);
  const [animatingSlots, setAnimatingSlots] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    if (!profile) useCountStore.getState().resetTrainMode();
    if (initialRunningCount !== undefined && initialRunningCount !== null) {
      useCountStore.getState().setRunningCount(initialRunningCount);
      const decksLeft = decksRemaining(initialShoe ?? []);
      const trueCount = calculateTrueCount(initialRunningCount, decksLeft);
      useCountStore.getState().setTrueCount(trueCount);
    } else {
      resetCount();
    }
    clearHistory();
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const { phase, playerHands, dealerHand, bankroll, results, activeHandIndex, shoe } = game;
  const activeHand = playerHands[activeHandIndex];
  const decksLeft = decksRemaining(shoe);
  const totalCards = 312;
  const totalSlots = 30;
  const cardWidth = 28;
  const cardHeight = 40;
  const maxFanWidth = 160;
  const overlap = Math.floor((maxFanWidth - cardWidth) / (totalSlots - 1));
  const fanWidth = cardWidth + (totalSlots - 1) * overlap;

  const filledSlots = shoeAnimating ? animatingSlots : Math.round((shoe.length / totalCards) * totalSlots);
  const showNewShoe = phase === "idle" && !isAnimating && !shoeAnimating;

  useEffect(() => {
    onBankrollChange(bankroll);
  }, [bankroll]);

  const handleNewShoe = useCallback(async () => {
    if (!showNewShoe) return;
    setShoeAnimating(true);
    const currentSlots = Math.round((shoe.length / totalCards) * totalSlots);
    setAnimatingSlots(currentSlots);
    setShoePhase("out");
    await new Promise((res) => setTimeout(res, currentSlots * 18 + 500));
    newShoe();
    if (sessionId) saveShoeAndCount(sessionId, createInitialState().shoe, 0);
    setAnimatingSlots(totalSlots);
    setShoePhase("in");
    await new Promise((res) => setTimeout(res, totalSlots * 18 + 500));
    setShoeAnimating(false);
    setShoePhase(null);
    setAnimatingSlots(0);
    setToast("✦ Shoe reshuffled — count reset");
    setToastKey((k) => k + 1);
    setTimeout(() => setToast(null), 2500);
  }, [showNewShoe, newShoe, shoe.length, totalCards, totalSlots]);

  const showHit = phase === "playerTurn" && activeHand && !isAnimating;
  const showDouble = !!(showHit && canDouble(activeHand.cards) && bankroll >= activeHand.bet && !activeHand.isLockedAce);
  const showSplit = !!(showHit && canSplit(activeHand.cards) && bankroll >= activeHand.bet && playerHands.length < 4);
  const showSurrender = !!(showHit && activeHand.cards.length === 2 && !activeHand.isSplit);

  const recommendedAction = activeHand && dealerHand.cards[0] && !dealerHand.cards[0].faceDown
    ? getBasicStrategy(activeHand, dealerHand.cards[0].rank)
    : null;

  const resolvedAction = (() => {
    if (!recommendedAction) return null;
    if (recommendedAction === "double" && !showDouble) return "hit";
    if (recommendedAction === "split" && !showSplit) return "hit";
    return recommendedAction;
  })();

  const highlightedAction = hintVisible ? resolvedAction : null;

  const handValueStyle = {
    fontFamily: "Playfair Display, serif", fontWeight: 700,
    color: isDark ? "#00f5ff" : "#6b4d06",
    textShadow: isDark ? "0 0 10px rgba(0,245,255,0.5)" : "none",
    fontSize: "15px",
  };

  const [hintOffDecisions, setHintOffDecisions] = useState(0);
  const [hintOffCorrect, setHintOffCorrect] = useState(0);

  const trackAndAct = (action: string, fn: () => void) => {
    const hintUsed = useCountStore.getState().hintUsed;
    if (!hintUsed && recommendedAction && profile && sessionId) {
      setHintOffDecisions((prev) => prev + 1);
      if (action === recommendedAction) {
        setHintOffCorrect((prev) => prev + 1);
      }
    }
    fn();
  };

  useEffect(() => {
    if (phase === "roundOver" && profile && sessionId && results.length > 0) {
      const handsWon = results.filter((r) => r === "win" || r === "blackjack").length;
      const handsLost = results.filter((r) => r === "lose" || r === "bust").length;
      saveBankroll(bankroll);
      saveShoeAndCount(sessionId, shoe, useCountStore.getState().runningCount);
      updateSessionStats(sessionId, 1, handsWon);
      updateLifetimeStats(1, handsWon, handsLost);
      if (hintOffDecisions > 0) {
        updateStrategyStats(hintOffDecisions, hintOffCorrect);
        setHintOffDecisions(0);
        setHintOffCorrect(0);
      }
    }
  }, [phase, bankroll, profile, sessionId, results]);

  const togglesJSX = (
    <>
      <TrainToggle trainMode={trainMode} isDark={isDark} onToggle={toggleTrainMode} />
      <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <button onClick={toggleTheme} title={isDark ? "Switch to Light" : "Switch to Dark"}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", filter: theme === "light" ? "brightness(0)" : "none", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", padding: 0 }}>
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>
    </>
  );

  const glowColor = isDark ? "rgba(0,245,255,0.8)" : "rgba(107,77,6,0.6)";

  return (
    <div className="felt-texture flex flex-col min-h-screen overflow-hidden relative" style={{ color: "var(--text-primary)" }}>
      <FloatingCards isDark={isDark} count={12} />
      {flyingCards.map((fc) => (
        <FlyingCard key={fc.id} id={fc.id} from={fc.from} to={fc.to} faceDown={fc.faceDown} rank={fc.rank} suit={fc.suit} onComplete={onFlyingCardComplete} />
      ))}
      {toast && <GameToast key={toastKey} message={toast} isDark={isDark} />}

      <div className="large-toggles fixed top-4 right-3 z-50 items-center gap-3" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.8s ease 0.1s" }}>
        {togglesJSX}
      </div>

      {/* Top bar */}
      <div className="flex justify-center relative" style={{ borderBottom: "1px solid var(--border)", zIndex: 10, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(-10px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
        <div className="flex w-full max-w-2xl">
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4 px-6" style={{ borderRight: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>Dealer</span>
              {phase !== "idle" && phase !== "playerTurn" && phase !== "insurance" && (
                <span style={handValueStyle}>— {getHandValue(dealerHand.cards)}</span>
              )}
            </div>
            <div ref={dealerHandRef} className="flex gap-3 flex-wrap justify-center min-h-32">
              {dealerHand.cards.map((card, i) => <Card key={i} card={card} />)}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 py-4 px-4 w-56 stats-panel">
            <div className="flex flex-col items-center gap-2">
              <div className="small-toggles items-center gap-3 mb-2">{togglesJSX}</div>
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Bankroll</span>
                <span className="text-xl font-bold neon-gold-text" style={{ fontFamily: "Playfair Display, serif" }}>${bankroll.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Decks Left</span>
              <span className="text-lg font-semibold neon-text">{decksLeft}</span>
            </div>
            <div className="flex flex-col items-center gap-1 w-full overflow-hidden">
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Shoe — {shoe.length}/{totalCards}</span>
              <div ref={shoeRef} className="relative" style={{ width: `${fanWidth}px`, height: `${cardHeight}px`, maxWidth: "100%" }}>
                {Array.from({ length: totalSlots }).map((_, i) => {
                  if (i >= filledSlots) return null;
                  const lightness = theme === "light" ? 55 + i * 0.6 : 20 + i * 0.6;
                  const hue = theme === "light" ? 40 : 160;
                  return (
                    <div key={`${shoePhase}-${i}`} className="absolute rounded-sm" style={{
                      width: `${cardWidth}px`, height: `${cardHeight}px`,
                      left: `${i * overlap}px`, top: 0, zIndex: i,
                      backgroundColor: `hsl(${hue}, 55%, ${lightness}%)`,
                      border: "1px solid var(--shoe-border)",
                      boxShadow: isDark ? "inset 0 0 4px rgba(0,245,255,0.1)" : "none",
                      animation: shoePhase ? `${shoePhase === "out" ? "shoe-wave-out" : "shoe-wave-in"} 0.4s ease ${i * 18}ms forwards` : "none",
                      transition: shoeAnimating ? "none" : "all 0.3s ease",
                      opacity: shoePhase === "in" ? 0 : 1,
                    }} />
                  );
                })}
                <div className="absolute top-0 w-px" style={{ left: `${(totalSlots - 1) * overlap + cardWidth}px`, height: `${cardHeight}px`, backgroundColor: "var(--shoe-marker)", boxShadow: isDark ? "0 0 4px rgba(0,245,255,0.4)" : "none" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main table */}
      <div className="flex flex-1 flex-col items-center justify-between py-8 px-4 gap-6 relative" style={{ zIndex: 10, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s" }}>
        <div className="w-full max-w-3xl">
          <div className="flex flex-wrap justify-center gap-6">
            {playerHands.map((hand, handIndex) => (
              <div key={handIndex}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${handIndex === activeHandIndex && phase === "playerTurn" ? "neon-pulse" : ""} ${playerHands.length === 3 ? handIndex < 2 ? "basis-[45%]" : "basis-full" : playerHands.length === 4 ? "basis-[45%] sm:basis-auto" : ""}`}
                style={{
                  border: handIndex === activeHandIndex && phase === "playerTurn" ? "1px solid var(--active-hand-border)" : "1px solid transparent",
                  backgroundColor: handIndex === activeHandIndex && phase === "playerTurn" ? "var(--active-hand-bg)" : "transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  {playerHands.length > 1 && <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>Hand {handIndex + 1}</span>}
                  {hand.isSurrendered
                    ? <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>Surrendered</span>
                    : <span style={handValueStyle}>{playerHands.length > 1 ? `— ${getHandValue(hand.cards)}` : getHandValue(hand.cards)}</span>
                  }
                </div>
                <div ref={(el) => { playerHandRefs.current[handIndex] = el; }} className="flex gap-2 flex-wrap justify-center min-h-32">
                  {hand.cards.map((card, i) => <Card key={i} card={card} />)}
                </div>
                {results[handIndex] && (
                  <span className="text-base font-bold tracking-wide" style={{
                    fontFamily: "Playfair Display, serif",
                    color: results[handIndex] === "win" || results[handIndex] === "blackjack" ? "var(--text-result-win)" : results[handIndex] === "push" || results[handIndex] === "surrender" ? "var(--text-result-push)" : "var(--text-result-lose)",
                    textShadow: isDark ? results[handIndex] === "win" || results[handIndex] === "blackjack" ? "0 0 12px rgba(0,245,255,0.6)" : results[handIndex] === "push" || results[handIndex] === "surrender" ? "0 0 12px rgba(255,215,0,0.6)" : "0 0 12px rgba(255,45,120,0.6)" : "none",
                  }}>
                    {results[handIndex] === "blackjack" && "✦ Blackjack"}
                    {results[handIndex] === "win" && "✦ Win"}
                    {results[handIndex] === "lose" && "✦ Lose"}
                    {results[handIndex] === "push" && "✦ Push"}
                    {results[handIndex] === "bust" && "✦ Bust"}
                    {results[handIndex] === "surrender" && "✦ Surrender"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 w-full max-w-lg">
          {phase === "insurance" && !isAnimating && (
            <div className="flex flex-col items-center gap-3">
              <span className="text-sm tracking-widest uppercase" style={{ color: "var(--insurance-color)", fontFamily: "DM Mono, monospace", textShadow: isDark ? "0 0 10px rgba(255,215,0,0.5)" : "none" }}>
                Dealer shows Ace — Insurance?
              </span>
              <div className="flex gap-4">
                <button onClick={takeInsurance} className="px-6 py-2.5 font-bold rounded-xl transition-all hover:scale-105" style={{ backgroundColor: "var(--insurance-color)", color: "#1a1100", fontFamily: "DM Mono, monospace", boxShadow: isDark ? "0 0 12px rgba(255,215,0,0.4)" : "none" }}>Take Insurance</button>
                <button onClick={declineInsurance} className="px-6 py-2.5 font-bold rounded-xl transition-all hover:scale-105" style={{ backgroundColor: "var(--clear-btn-bg)", border: "1px solid var(--clear-btn-border)", color: "var(--clear-btn-color)", fontFamily: "DM Mono, monospace" }}>Decline</button>
              </div>
            </div>
          )}

          {phase === "playerTurn" && activeHand && !isAnimating && (
            <div className="flex gap-3 flex-wrap justify-center">
              <ActionButton theme={theme} color="#00f5ff" label="Hit" onClick={() => trackAndAct("hit", hit)} highlighted={highlightedAction === "hit"} />
              <ActionButton theme={theme} color="#ff2d78" label="Stand" onClick={() => trackAndAct("stand", stand)} highlighted={highlightedAction === "stand"} />
              {showDouble && <ActionButton theme={theme} color="#ffd700" label="Double" onClick={() => trackAndAct("double", doubleDown)} highlighted={highlightedAction === "double"} />}
              {showSplit && <ActionButton theme={theme} color="#a855f7" label="Split" onClick={() => trackAndAct("split", split)} highlighted={highlightedAction === "split"} />}
              {showSurrender && <ActionButton theme={theme} color="#ff6b35" label="Surrender" onClick={() => trackAndAct("surrender", surrender)} highlighted={highlightedAction === "surrender"} />}
            </div>
          )}

          {phase === "idle" && !isAnimating && (
            <BetControls bankroll={bankroll} onDeal={(bet) => deal(bet)} />
          )}

          {phase === "roundOver" && !isAnimating && (
            <button onClick={newRound} className="btn-appear hover:scale-105 active:scale-95 tracking-widest uppercase font-bold"
              style={{
                padding: "14px 48px", borderRadius: "999px", fontFamily: "DM Mono, monospace",
                fontSize: "13px", letterSpacing: "0.15em", cursor: "pointer",
                transition: "all 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
                ...(isDark ? {
                  background: "linear-gradient(135deg, rgba(0,245,255,0.15), rgba(0,245,255,0.05))",
                  border: "1.5px solid rgba(0,245,255,0.6)", color: "#00f5ff",
                  boxShadow: "0 0 24px rgba(0,245,255,0.2), inset 0 0 24px rgba(0,245,255,0.05)",
                  textShadow: "0 0 10px rgba(0,245,255,0.7)",
                } : {
                  background: "linear-gradient(135deg, rgba(107,77,6,0.12), rgba(107,77,6,0.06))",
                  border: "1.5px solid rgba(107,77,6,0.7)", color: "#4a3500",
                  boxShadow: "0 4px 16px rgba(107,77,6,0.2)", textShadow: "none",
                }),
              }}
              onMouseEnter={(e) => {
                if (isDark) { e.currentTarget.style.background = "linear-gradient(135deg, rgba(0,245,255,0.25), rgba(0,245,255,0.1))"; e.currentTarget.style.boxShadow = "0 0 40px rgba(0,245,255,0.35), inset 0 0 30px rgba(0,245,255,0.1)"; }
                else { e.currentTarget.style.background = "linear-gradient(135deg, rgba(107,77,6,0.22), rgba(107,77,6,0.12))"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(107,77,6,0.35)"; }
              }}
              onMouseLeave={(e) => {
                if (isDark) { e.currentTarget.style.background = "linear-gradient(135deg, rgba(0,245,255,0.15), rgba(0,245,255,0.05))"; e.currentTarget.style.boxShadow = "0 0 24px rgba(0,245,255,0.2), inset 0 0 24px rgba(0,245,255,0.05)"; }
                else { e.currentTarget.style.background = "linear-gradient(135deg, rgba(107,77,6,0.12), rgba(107,77,6,0.06))"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(107,77,6,0.2)"; }
              }}
            >
              ✦ Next Round ✦
            </button>
          )}
        </div>
      </div>

      {/* <DebugPanel onScenario={debugDeal} onForceReshuffle={forceReshuffle}/> */}
      <CountOverlay phase={phase} playerHand={activeHand ?? null} dealerUpCard={dealerHand.cards[0]?.rank ?? null} />

      <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.8s ease 0.1s" }}>
        {!profile && <GuestMenu isDark={isDark} onNewShoe={handleNewShoe} showNewShoe={showNewShoe} />}
        {profile && <AvatarMenu profile={profile} bankroll={bankroll} isDark={isDark} onDashboard={() => router.push("/dashboard")} onNewShoe={handleNewShoe} showNewShoe={showNewShoe} onNewSession={onNewSession} />}
      </div>

      <style>{`
        .large-toggles { display: flex; }
        .small-toggles { display: none; }
        @media (max-width: 640px) {
          .large-toggles { display: none !important; }
          .small-toggles { display: flex !important; flex-direction: row; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .stats-panel { padding-top: 56px !important; }
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .btn-appear { animation: fade-in 0.3s ease forwards; }
        @keyframes menu-appear { from { opacity: 0; transform: translateY(8px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shoe-wave-out {
          0% { transform: translateY(0) scaleY(1); opacity: 1; filter: brightness(1); }
          40% { transform: translateY(-8px) scaleY(1.12); opacity: 1; filter: brightness(2) drop-shadow(0 0 8px ${glowColor}); }
          100% { transform: translateY(8px) scaleY(0.7); opacity: 0; filter: brightness(0.3); }
        }
        @keyframes shoe-wave-in {
          0% { transform: translateY(-10px) scaleY(0.7); opacity: 0; filter: brightness(0.3); }
          60% { transform: translateY(2px) scaleY(1.08); opacity: 1; filter: brightness(1.6) drop-shadow(0 0 6px ${glowColor}); }
          100% { transform: translateY(0) scaleY(1); opacity: 1; filter: brightness(1); }
        }
        @keyframes toast-appear {
          0% { opacity: 0; transform: translateY(-6px); }
          12% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

function GamePageInner() {
  const { profile, loading } = useProfile();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const searchParams = useSearchParams();
  const endSessionParam = searchParams.get("endSession") === "true";
  const fromDashboardParam = searchParams.get("fromDashboard") === "true";

  const [gameReady, setGameReady] = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem("gameActive") === "true"
  );
  const [gameBankroll, setGameBankroll] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showNewSessionGate, setShowNewSessionGate] = useState(false);
  const [liveBankroll, setLiveBankroll] = useState<number | null>(null);
  const [guestBankroll, setGuestBankroll] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("guestBankroll");
      return saved ? parseInt(saved) : null;
    } catch { return null; }
  });

  const [gameShoe, setGameShoe] = useState<CardType[] | null>(null);
  const [gameRunningCount, setGameRunningCount] = useState<number>(0);

  useEffect(() => {
    if (gameReady && profile && gameBankroll === null) {
      getOpenSession().then((session) => {
        if (session) {
          setGameBankroll(profile.bankroll);
          setSessionId(session.id);
          setGameShoe(session.shoe as CardType[] ?? null);
          setGameRunningCount(session.running_count ?? 0);
        } else {
          setGameReady(false);
        }
      });
    }
  }, [gameReady, profile, gameBankroll]);

  const handleNewSession = useCallback(() => {
    setShowNewSessionGate(true);
  }, []);

  if (loading) {
    return (
      <div className="felt-texture min-h-screen flex items-center justify-center">
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.5)" }}>
          Loading...
        </span>
      </div>
    );
  }

  if (!profile) {
    if (guestBankroll === null) {
      return <GuestGate onReady={(bankroll) => setGuestBankroll(bankroll)} />;
    }
    return (
      <GameContent
        profile={null}
        bankroll={guestBankroll}
        sessionId={null}
        onNewSession={() => {}}
        onBankrollChange={(b) => {
          setGuestBankroll(b);
          try { localStorage.setItem("guestBankroll", b.toString()); } catch {}
        }}
      />
    );
  }

  if (showNewSessionGate) {
    return (
      <SessionGate
        profile={profile}
        startOnNewGame={true}
        currentBankroll={liveBankroll ?? gameBankroll ?? profile.bankroll}
        onReady={(bankroll, sid, shoe, runningCount) => {
          sessionStorage.setItem("gameActive", "true");
          setGameBankroll(bankroll);
          setSessionId(sid);
          setGameReady(true);
          setShowNewSessionGate(false);
          setGameShoe(shoe ?? null);
          setGameRunningCount(runningCount ?? 0);
          setLiveBankroll(null);
        }}
      />
    );
  }

  if (gameReady && (gameBankroll === null || sessionId === null)) {
    return (
      <div className="felt-texture min-h-screen flex items-center justify-center">
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.5)" }}>
          Loading...
        </span>
      </div>
    );
  }

  if (!gameReady || gameBankroll === null || sessionId === null) {
    return (
      <SessionGate
        profile={profile}
        fromDashboard={endSessionParam || fromDashboardParam}
        startOnNewGame={endSessionParam}
        onReady={(bankroll, sid, shoe, runningCount) => {
          sessionStorage.setItem("gameActive", "true");
          setGameBankroll(bankroll);
          setSessionId(sid);
          setGameReady(true);
          setGameShoe(shoe ?? null);
          setGameRunningCount(runningCount ?? 0);
        }}
      />
    );
  }

  return (
    <GameContent
      profile={profile}
      bankroll={gameBankroll}
      sessionId={sessionId}
      shoe={gameShoe}
      runningCount={gameRunningCount}
      onNewSession={handleNewSession}
      onBankrollChange={setLiveBankroll}
    />
  );
}

export default function GamePage() {
  return (
    <Suspense>
      <GamePageInner />
    </Suspense>
  );
}