"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/game/Card";
import FlyingCard from "@/components/game/FlyingCard";
import BetControls from "@/components/game/BetControls";
import CountOverlay from "@/components/game/CountOverlay";
import FloatingCards from "@/components/ui/FloatingCards";
import SessionGate from "@/app/game/SessionGate";
import { useGameController } from "@/hooks/useGameController";
import { useShoeContext } from "@/context/ShoeContext";
import { useTheme } from "@/context/ThemeContext";
import { useCountStore } from "@/store/countStore";
import { useProfile } from "@/hooks/useProfile";
import { saveBankroll, Profile, getOpenSession, updateSessionStats, updateLifetimeStats, closeSession } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/client";
import { decksRemaining } from "@/lib/blackjack/deck";
import { getHandValue, canSplit, canDouble } from "@/lib/blackjack/hand";
import { getBasicStrategy } from "@/lib/counting/basicStrategy";
import { useSearchParams } from "next/navigation";

function darken(hex: string): string {
  const map: Record<string, string> = {
    "#00f5ff": "#004f54",
    "#ff2d78": "#8a0030",
    "#ffd700": "#6b5200",
    "#a855f7": "#5b1a9e",
    "#ff6b35": "#8a2d00",
  };
  return map[hex] ?? hex;
}

function Toast({ message, isDark }: { message: string; isDark: boolean }) {
  return (
    <div style={{
      position: "fixed", top: "20px", right: "16px", zIndex: 100,
      padding: "10px 20px", borderRadius: "999px",
      backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)",
      border: `1px solid ${isDark ? "rgba(0,245,255,0.3)" : "rgba(107,77,6,0.3)"}`,
      backdropFilter: "blur(12px)",
      boxShadow: isDark ? "0 0 24px rgba(0,245,255,0.15)" : "0 8px 32px rgba(0,0,0,0.1)",
      fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700,
      letterSpacing: "0.12em",
      color: isDark ? "#00f5ff" : "#4a3500",
      textShadow: isDark ? "0 0 10px rgba(0,245,255,0.6)" : "none",
      animation: "toast-appear 2.5s ease forwards", whiteSpace: "nowrap",
    }}>
      {message}
    </div>
  );
}

function ActionButton({ label, color, onClick, theme, highlighted }: {
  label: string; color: string; onClick: () => void; theme: string; highlighted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-appear hover:scale-105 active:scale-95"
      style={{
        padding: "10px 24px", borderRadius: "999px",
        backgroundColor: highlighted ? `${color}35` : theme === "light" ? `${color}25` : "transparent",
        border: `1.5px solid ${highlighted ? color : theme === "light" ? darken(color) : color}`,
        color: theme === "light" ? darken(color) : color,
        fontSize: "12px", fontWeight: 700, fontFamily: "DM Mono, monospace",
        letterSpacing: "0.1em", textTransform: "uppercase" as const,
        boxShadow: highlighted
          ? `0 0 20px ${color}80, 0 0 40px ${color}40, inset 0 0 20px ${color}20`
          : theme === "dark" ? `0 0 12px ${color}40, inset 0 0 12px ${color}10` : `0 2px 8px ${color}50`,
        textShadow: highlighted ? `0 0 12px ${color}` : theme === "dark" ? `0 0 8px ${color}80` : "none",
        cursor: "pointer", transition: "all 0.2s ease",
        transform: highlighted ? "scale(1.08)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme === "light" ? `${color}40` : `${color}20`;
        e.currentTarget.style.boxShadow = theme === "dark" ? `0 0 24px ${color}70, inset 0 0 20px ${color}20` : `0 4px 16px ${color}70`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = highlighted ? `${color}35` : theme === "light" ? `${color}25` : "transparent";
        e.currentTarget.style.boxShadow = highlighted
          ? `0 0 20px ${color}80, 0 0 40px ${color}40, inset 0 0 20px ${color}20`
          : theme === "dark" ? `0 0 12px ${color}40, inset 0 0 12px ${color}10` : `0 2px 8px ${color}50`;
      }}
    >
      {label}
    </button>
  );
}

function MenuButton({ label, isDark, onClick, icon, danger, disabled }: {
  label: string; isDark: boolean; onClick: () => void; icon?: React.ReactNode; danger?: boolean; disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const color = danger ? "#ff2d78" : isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)";
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px",
        background: hovered && !disabled ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" : "transparent",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" : color,
        fontFamily: "DM Mono, monospace", fontSize: "12px", fontWeight: 600,
        letterSpacing: "0.05em", textAlign: "left", transition: "background 0.15s ease",
        textShadow: danger && hovered && isDark && !disabled ? "0 0 8px rgba(255,45,120,0.5)" : "none",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {icon}{label}
    </button>
  );
}

function AvatarMenu({ profile, bankroll, isDark, onDashboard, onNewShoe, showNewShoe, onNewSession }: {
  profile: Profile; bankroll: number; isDark: boolean; onDashboard: () => void;
  onNewShoe: () => void; showNewShoe: boolean; onNewSession: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    sessionStorage.removeItem("gameActive");
    useCountStore.getState().resetTrainMode();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-14 right-0 z-40 rounded-2xl overflow-hidden" style={{
            minWidth: "200px",
            backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${isDark ? "rgba(0,245,255,0.15)" : "rgba(107,77,6,0.15)"}`,
            backdropFilter: "blur(16px)",
            boxShadow: isDark ? "0 0 40px rgba(0,0,0,0.6)" : "0 20px 60px rgba(0,0,0,0.12)",
            animation: "menu-appear 0.15s ease forwards",
          }}>
            <div className="px-4 py-3 flex flex-col gap-0.5" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
              <span style={{ fontFamily: "Playfair Display, serif", fontSize: "15px", fontWeight: 700, color: isDark ? "#ffffff" : "#1a1200" }}>{profile.username}</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "#ffd700" : "#8b6508", textShadow: isDark ? "0 0 8px rgba(255,215,0,0.3)" : "none" }}>${bankroll.toLocaleString()}</span>
            </div>
            <div className="py-1">
              <MenuButton label="Dashboard" isDark={isDark} onClick={() => { setOpen(false); onDashboard(); }}
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>}
              />
              <MenuButton label="End Session" isDark={isDark} onClick={() => { setOpen(false); onNewSession(); }}
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>}
              />
              {showNewShoe && (
                <MenuButton label="New Shoe" isDark={isDark} onClick={() => { setOpen(false); onNewShoe(); }}
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>}
                />
              )}
              <div style={{ height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", margin: "4px 0" }} />
              <MenuButton label="Log Out" isDark={isDark} onClick={handleLogout} danger
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>}
              />
            </div>
          </div>
        </>
      )}
      <button onClick={() => setOpen((prev) => !prev)} className="transition-all duration-200 hover:scale-110"
        style={{
          width: "44px", height: "44px", borderRadius: "50%",
          border: `1.5px solid ${open ? isDark ? "rgba(0,245,255,0.7)" : "rgba(107,77,6,0.7)" : isDark ? "rgba(0,245,255,0.4)" : "rgba(107,77,6,0.4)"}`,
          backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)",
          backdropFilter: "blur(8px)",
          boxShadow: open ? isDark ? "0 0 24px rgba(0,245,255,0.4)" : "0 6px 24px rgba(107,77,6,0.3)" : isDark ? "0 0 16px rgba(0,245,255,0.2)" : "0 4px 16px rgba(107,77,6,0.15)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 40,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(0,245,255,0.8)" : "rgba(107,77,6,0.8)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>
    </div>
  );
}

function GuestMenu({ isDark, onNewShoe, showNewShoe }: {
  isDark: boolean; onNewShoe: () => void; showNewShoe: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-14 right-0 z-40 rounded-2xl overflow-hidden" style={{
            minWidth: "180px",
            backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${isDark ? "rgba(0,245,255,0.15)" : "rgba(107,77,6,0.15)"}`,
            backdropFilter: "blur(16px)",
            boxShadow: isDark ? "0 0 40px rgba(0,0,0,0.6)" : "0 20px 60px rgba(0,0,0,0.12)",
            animation: "menu-appear 0.15s ease forwards",
          }}>
            <div className="py-1">
              <MenuButton label="Log In" isDark={isDark} onClick={() => router.push("/login")}
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>}
              />
              <MenuButton label="Sign Up" isDark={isDark} onClick={() => router.push("/signup")}
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>}
              />
              {showNewShoe && (
                <MenuButton label="New Shoe" isDark={isDark} onClick={() => { setOpen(false); onNewShoe(); }}
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>}
                />
              )}
              <div style={{ height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", margin: "4px 0" }} />
              <MenuButton label="Exit Game" isDark={isDark} onClick={() => router.push("/")} danger
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>}
              />
            </div>
          </div>
        </>
      )}
      <button onClick={() => setOpen((prev) => !prev)} className="transition-all duration-200 hover:scale-110"
        style={{
          width: "44px", height: "44px", borderRadius: "50%",
          border: `1.5px solid ${open ? isDark ? "rgba(0,245,255,0.7)" : "rgba(107,77,6,0.7)" : isDark ? "rgba(0,245,255,0.4)" : "rgba(107,77,6,0.4)"}`,
          backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)",
          backdropFilter: "blur(8px)",
          boxShadow: open ? isDark ? "0 0 24px rgba(0,245,255,0.4)" : "0 6px 24px rgba(107,77,6,0.3)" : isDark ? "0 0 16px rgba(0,245,255,0.2)" : "0 4px 16px rgba(107,77,6,0.15)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 40,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(0,245,255,0.8)" : "rgba(107,77,6,0.8)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>
    </div>
  );
}

function GameContent({
  profile, bankroll: initialBankroll, sessionId, onNewSession, onBankrollChange,
}: {
  profile: Profile | null; bankroll: number; sessionId: string | null;
  onNewSession: () => void; onBankrollChange: (b: number) => void;
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const {
    game, isAnimating, flyingCards, onFlyingCardComplete,
    deal, hit, stand, doubleDown, split, surrender,
    takeInsurance, declineInsurance, newRound, newShoe,
  } = useGameController(initialBankroll);

  const { shoeRef, dealerHandRef, playerHandRefs } = useShoeContext();
  const { hintVisible, trainMode, toggleTrainMode } = useCountStore();
  const [mounted, setMounted] = useState(false);
  const [shoeAnimating, setShoeAnimating] = useState(false);
  const [shoePhase, setShoePhase] = useState<"out" | "in" | null>(null);
  const [animatingSlots, setAnimatingSlots] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    if (!profile) useCountStore.getState().resetTrainMode();
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

  // notify parent of bankroll changes
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

  const recommendedAction = hintVisible && activeHand && dealerHand.cards[0] && !dealerHand.cards[0].faceDown
    ? getBasicStrategy(activeHand, dealerHand.cards[0].rank)
    : null;

  const handValueStyle = {
    fontFamily: "Playfair Display, serif", fontWeight: 700,
    color: isDark ? "#00f5ff" : "#6b4d06",
    textShadow: isDark ? "0 0 10px rgba(0,245,255,0.5)" : "none",
    fontSize: "15px",
  };

  useEffect(() => {
    if (phase === "roundOver" && profile && sessionId) {
      const handsPlayed = results.length;
      const handsWon = results.filter((r) => r === "win" || r === "blackjack").length;
      const handsLost = results.filter((r) => r === "lose" || r === "bust").length;
      saveBankroll(bankroll);
      updateSessionStats(sessionId, handsPlayed, handsWon);
      updateLifetimeStats(handsPlayed, handsWon, handsLost);
    }
  }, [phase, bankroll, profile, sessionId]);

  const togglesJSX = (
    <>
      <button onClick={toggleTrainMode} title="Train Mode" style={{
        width: "36px", height: "20px", borderRadius: "999px", border: "none", cursor: "pointer", position: "relative",
        backgroundColor: trainMode ? isDark ? "#00f5ff" : "#8b6508" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
        boxShadow: trainMode && isDark ? "0 0 10px rgba(0,245,255,0.4)" : "none",
        transition: "background-color 0.3s ease, box-shadow 0.3s ease", flexShrink: 0,
      }}>
        <div style={{ position: "absolute", top: "2px", left: trainMode ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", transition: "left 0.3s ease" }} />
      </button>
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
      {toast && <Toast key={toastKey} message={toast} isDark={isDark} />}

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

          <div className="flex flex-col items-center justify-center gap-3 py-4 px-4 w-56">
            <div className="flex items-center justify-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Bankroll</span>
                <span className="text-xl font-bold neon-gold-text" style={{ fontFamily: "Playfair Display, serif" }}>${bankroll.toLocaleString()}</span>
              </div>
              <div className="small-toggles items-center gap-2">{togglesJSX}</div>
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
              <ActionButton theme={theme} color="#00f5ff" label="Hit" onClick={hit} highlighted={recommendedAction === "hit"} />
              <ActionButton theme={theme} color="#ff2d78" label="Stand" onClick={stand} highlighted={recommendedAction === "stand"} />
              {showDouble && <ActionButton theme={theme} color="#ffd700" label="Double" onClick={doubleDown} highlighted={recommendedAction === "double"} />}
              {showSplit && <ActionButton theme={theme} color="#a855f7" label="Split" onClick={split} highlighted={recommendedAction === "split"} />}
              {showSurrender && <ActionButton theme={theme} color="#ff6b35" label="Surrender" onClick={surrender} highlighted={recommendedAction === "surrender"} />}
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
          .small-toggles { display: flex !important; }
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

export default function GamePage() {
  const { profile, loading } = useProfile();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [gameReady, setGameReady] = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem("gameActive") === "true"
  );
  const [gameBankroll, setGameBankroll] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showNewSessionGate, setShowNewSessionGate] = useState(false);
  const [liveBankroll, setLiveBankroll] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const endSessionParam = searchParams.get("endSession") === "true";
  const fromDashboardParam = searchParams.get("fromDashboard") === "true";

  useEffect(() => {
    if (gameReady && profile && gameBankroll === null) {
      getOpenSession().then((session) => {
        if (session) {
          setGameBankroll(profile.bankroll);
          setSessionId(session.id);
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
    return <GameContent profile={null} bankroll={1000} sessionId={null} onNewSession={() => {}} onBankrollChange={() => {}} />;
  }

  if (showNewSessionGate) {
    return (
      <SessionGate
        profile={profile}
        startOnNewGame={true}
        currentBankroll={liveBankroll ?? gameBankroll ?? profile.bankroll}
        onReady={(bankroll, sid) => {
          sessionStorage.setItem("gameActive", "true");
          setGameBankroll(bankroll);
          setSessionId(sid);
          setGameReady(true);
          setShowNewSessionGate(false);
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
      onReady={(bankroll, sid) => {
        sessionStorage.setItem("gameActive", "true");
        setGameBankroll(bankroll);
        setSessionId(sid);
        setGameReady(true);
      }}
      />
    );
  }

  return (
    <GameContent
      profile={profile}
      bankroll={gameBankroll}
      sessionId={sessionId}
      onNewSession={handleNewSession}
      onBankrollChange={setLiveBankroll}
    />
  );
}