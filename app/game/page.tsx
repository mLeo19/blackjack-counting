"use client";

import { useState, useEffect } from "react";
import Card from "@/components/game/Card";
import FlyingCard from "@/components/game/FlyingCard";
import DebugPanel from "@/components/game/DebugPanel";
import BetControls from "@/components/game/BetControls";
import CountOverlay from "@/components/game/CountOverlay";
import { useGameController } from "@/hooks/useGameController";
import { useShoeContext } from "@/context/ShoeContext";
import { useTheme } from "@/context/ThemeContext";
import { useCountStore } from "@/store/countStore";
import { decksRemaining } from "@/lib/blackjack/deck";
import { getHandValue, canSplit, canDouble } from "@/lib/blackjack/hand";
import { getBasicStrategy } from "@/lib/counting/basicStrategy";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7"];

interface FloatingCard {
  id: number;
  suit: string;
  rank: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  duration: number;
  delay: number;
  isRed: boolean;
}

function generateCards(count: number): FloatingCard[] {
  return Array.from({ length: count }, (_, i) => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    return {
      id: i,
      suit,
      rank,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 60 - 30,
      scale: 0.6 + Math.random() * 0.8,
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 8,
      isRed: suit === "♥" || suit === "♦",
    };
  });
}

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

function ActionButton({
  label,
  color,
  onClick,
  theme,
  highlighted,
}: {
  label: string;
  color: string;
  onClick: () => void;
  theme: string;
  highlighted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-appear hover:scale-105 active:scale-95"
      style={{
        padding: "10px 24px",
        borderRadius: "999px",
        backgroundColor: highlighted
          ? `${color}35`
          : theme === "light" ? `${color}25` : "transparent",
        border: highlighted
          ? `2px solid ${color}`
          : theme === "light" ? `2px solid ${darken(color)}` : `1.5px solid ${color}`,
        color: theme === "light" ? darken(color) : color,
        fontSize: "12px",
        fontWeight: 700,
        fontFamily: "DM Mono, monospace",
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        boxShadow: highlighted
          ? `0 0 20px ${color}80, 0 0 40px ${color}40, inset 0 0 20px ${color}20`
          : theme === "dark"
          ? `0 0 12px ${color}40, inset 0 0 12px ${color}10`
          : `0 2px 8px ${color}50`,
        textShadow: highlighted
          ? `0 0 12px ${color}`
          : theme === "dark" ? `0 0 8px ${color}80` : "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: highlighted ? "scale(1.08)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        const btn = e.currentTarget;
        btn.style.backgroundColor = theme === "light" ? `${color}40` : `${color}20`;
        btn.style.boxShadow = theme === "dark"
          ? `0 0 24px ${color}70, inset 0 0 20px ${color}20`
          : `0 4px 16px ${color}70`;
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget;
        btn.style.backgroundColor = highlighted
          ? `${color}35`
          : theme === "light" ? `${color}25` : "transparent";
        btn.style.boxShadow = highlighted
          ? `0 0 20px ${color}80, 0 0 40px ${color}40, inset 0 0 20px ${color}20`
          : theme === "dark"
          ? `0 0 12px ${color}40, inset 0 0 12px ${color}10`
          : `0 2px 8px ${color}50`;
      }}
    >
      {label}
    </button>
  );
}

export default function GamePage() {
  const {
    game,
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
  } = useGameController();

  const { shoeRef, dealerHandRef, playerHandRefs } = useShoeContext();
  const { theme, toggleTheme } = useTheme();
  const { hintVisible, trainMode, toggleTrainMode } = useCountStore();

  const [bgCards] = useState(() => generateCards(12));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { phase, playerHands, dealerHand, bankroll, results, activeHandIndex, shoe } = game;
  const activeHand = playerHands[activeHandIndex];
  const decksLeft = decksRemaining(shoe);
  const totalCards = 312;
  const totalSlots = 30;
  const filledSlots = Math.round((shoe.length / totalCards) * totalSlots);
  const cardWidth = 28;
  const cardHeight = 40;
  const maxFanWidth = 160;
  const overlap = Math.floor((maxFanWidth - cardWidth) / (totalSlots - 1));
  const fanWidth = cardWidth + (totalSlots - 1) * overlap;

  const showHit = phase === "playerTurn" && activeHand && !isAnimating;
  const showDouble = !!(showHit && canDouble(activeHand.cards) && bankroll >= activeHand.bet && !activeHand.isLockedAce);
  const showSplit = !!(showHit && canSplit(activeHand.cards) && bankroll >= activeHand.bet && playerHands.length < 4);
  const showSurrender = !!(showHit && activeHand.cards.length === 2 && !activeHand.isSplit);

  const recommendedAction = hintVisible && activeHand && dealerHand.cards[0] && !dealerHand.cards[0].faceDown
    ? getBasicStrategy(activeHand, dealerHand.cards[0].rank)
    : null;

  const isDark = theme === "dark";

  const handValueStyle = {
    fontFamily: "Playfair Display, serif",
    fontWeight: 700,
    color: isDark ? "#00f5ff" : "#6b4d06",
    textShadow: isDark ? "0 0 10px rgba(0,245,255,0.5)" : "none",
    fontSize: "15px",
  };

  return (
    <div
      className="felt-texture flex flex-col min-h-screen overflow-hidden relative"
      style={{ color: "var(--text-primary)" }}
    >

      {/* ── Floating background cards ── */}
      {mounted && bgCards.map((card) => (
        <div
          key={card.id}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${card.x}%`,
            top: `${card.y}%`,
            zIndex: 0,
            opacity: 0,
            animation: `float-card-${card.id % 4} ${card.duration}s ease-in-out ${card.delay}s infinite alternate`,
          }}
        >
          <div
            style={{
              width: "70px",
              height: "100px",
              borderRadius: "10px",
              transform: `rotate(${card.rotation}deg) scale(${card.scale})`,
              background: isDark
                ? "linear-gradient(145deg, #fdfaf4, #f5ede0)"
                : "linear-gradient(145deg, #1a2a1a, #0d1a0d)",
              border: "1px solid rgba(180,160,120,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.4)"
                : "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <span style={{
              fontSize: "24px",
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              color: card.isRed
                ? isDark ? "#b91c1c" : "#ff4444"
                : isDark ? "#1c1917" : "#e8f5e8",
              lineHeight: 1,
            }}>
              {card.rank}
            </span>
            <span style={{
              fontSize: "20px",
              color: card.isRed
                ? isDark ? "#b91c1c" : "#ff4444"
                : isDark ? "#1c1917" : "#e8f5e8",
              lineHeight: 1,
            }}>
              {card.suit}
            </span>
          </div>
        </div>
      ))}

      {/* Flying cards overlay */}
      {flyingCards.map((fc) => (
        <FlyingCard
          key={fc.id}
          id={fc.id}
          from={fc.from}
          to={fc.to}
          faceDown={fc.faceDown}
          rank={fc.rank}
          suit={fc.suit}
          onComplete={onFlyingCardComplete}
        />
      ))}

      {/* Top right controls */}
      <div
        className="fixed top-4 right-4 z-50 flex items-end gap-5"
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.8s ease 0.1s",
        }}
      >
        {/* Train toggle */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-xs uppercase tracking-widest"
            style={{
              color: isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.7)",
              fontFamily: "DM Mono, monospace",
              fontSize: "10px",
            }}
          >
            Train
          </span>
          <button
            onClick={toggleTrainMode}
            className="relative transition-all duration-300 hover:scale-105"
            style={{
              width: "44px",
              height: "24px",
              borderRadius: "999px",
              backgroundColor: trainMode
                ? isDark ? "#00f5ff" : "#8b6508"
                : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)",
              border: "none",
              cursor: "pointer",
              boxShadow: trainMode && isDark ? "0 0 12px rgba(0,245,255,0.4)" : "none",
              transition: "background-color 0.3s ease, box-shadow 0.3s ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "3px",
                left: trainMode ? "23px" : "3px",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                backgroundColor: "white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                transition: "left 0.3s ease",
              }}
            />
          </button>
        </div>

        {/* Theme toggle */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-xs uppercase tracking-widest"
            style={{
              color: isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.7)",
              fontFamily: "DM Mono, monospace",
              fontSize: "10px",
            }}
          >
            {isDark ? "Light" : "Dark"}
          </span>
          <div style={{ width: "44px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button
              onClick={toggleTheme}
              className="transition-all hover:scale-110"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "26px",
                filter: theme === "light" ? "brightness(0)" : "none",
                lineHeight: 1,
                display: "block",
                width: "26px",
                height: "26px",
                textAlign: "center",
              }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Top bar ── */}
      <div
        className="flex justify-center relative"
        style={{
          borderBottom: "1px solid var(--border)",
          zIndex: 10,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <div className="flex w-full max-w-2xl">

          {/* Left — Dealer */}
          <div
            className="flex flex-1 flex-col items-center justify-center gap-3 py-4 px-6"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-xs uppercase tracking-widest"
                style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}
              >
                Dealer
              </span>
              {phase !== "idle" && phase !== "playerTurn" && phase !== "insurance" && (
                <span style={handValueStyle}>— {getHandValue(dealerHand.cards)}</span>
              )}
            </div>
            <div ref={dealerHandRef} className="flex gap-3 flex-wrap justify-center min-h-32">
              {dealerHand.cards.map((card, i) => (
                <Card key={i} card={card} />
              ))}
            </div>
          </div>

          {/* Right — Stats + Shoe */}
          <div className="flex flex-col items-center justify-center gap-3 py-4 px-4 w-56">

            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Bankroll
              </span>
              <span className="text-xl font-bold neon-gold-text" style={{ fontFamily: "Playfair Display, serif" }}>
                ${bankroll.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Decks Left
              </span>
              <span className="text-lg font-semibold neon-text">{decksLeft}</span>
            </div>

            <div className="flex flex-col items-center gap-1 w-full overflow-hidden">
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Shoe — {shoe.length}/{totalCards}
              </span>
              <div
                ref={shoeRef}
                className="relative"
                style={{ width: `${fanWidth}px`, height: `${cardHeight}px`, maxWidth: "100%" }}
              >
                {Array.from({ length: totalSlots }).map((_, i) => {
                  const filled = i < filledSlots;
                  if (!filled) return null;
                  const lightness = theme === "light" ? 55 + i * 0.6 : 20 + i * 0.6;
                  const hue = theme === "light" ? 40 : 160;
                  return (
                    <div
                      key={i}
                      className="absolute rounded-sm transition-all duration-300"
                      style={{
                        width: `${cardWidth}px`,
                        height: `${cardHeight}px`,
                        left: `${i * overlap}px`,
                        top: 0,
                        zIndex: i,
                        backgroundColor: `hsl(${hue}, 55%, ${lightness}%)`,
                        border: "1px solid var(--shoe-border)",
                        boxShadow: isDark ? "inset 0 0 4px rgba(0,245,255,0.1)" : "none",
                      }}
                    />
                  );
                })}
                <div
                  className="absolute top-0 w-px"
                  style={{
                    left: `${(totalSlots - 1) * overlap + cardWidth}px`,
                    height: `${cardHeight}px`,
                    backgroundColor: "var(--shoe-marker)",
                    boxShadow: isDark ? "0 0 4px rgba(0,245,255,0.4)" : "none",
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Main table ── */}
      <div
        className="flex flex-1 flex-col items-center justify-between py-8 px-4 gap-6 relative"
        style={{
          zIndex: 10,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s",
        }}
      >

        {/* Player hands */}
        <div className="w-full max-w-3xl">
          <div className="flex flex-wrap justify-center gap-6">
            {playerHands.map((hand, handIndex) => (
              <div
                key={handIndex}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-2xl transition-all
                  ${handIndex === activeHandIndex && phase === "playerTurn" ? "neon-pulse" : ""}
                  ${playerHands.length === 3
                    ? handIndex < 2 ? "basis-[45%]" : "basis-full"
                    : playerHands.length === 4
                    ? "basis-[45%] sm:basis-auto"
                    : ""}
                `}
                style={{
                  border: handIndex === activeHandIndex && phase === "playerTurn"
                    ? "1px solid var(--active-hand-border)"
                    : "1px solid transparent",
                  backgroundColor: handIndex === activeHandIndex && phase === "playerTurn"
                    ? "var(--active-hand-bg)"
                    : "transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  {playerHands.length > 1 && (
                    <span
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}
                    >
                      Hand {handIndex + 1}
                    </span>
                  )}
                  {hand.isSurrendered ? (
                    <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>
                      Surrendered
                    </span>
                  ) : (
                    <span style={handValueStyle}>
                      {playerHands.length > 1 ? `— ${getHandValue(hand.cards)}` : getHandValue(hand.cards)}
                    </span>
                  )}
                </div>
                <div
                  ref={(el) => { playerHandRefs.current[handIndex] = el; }}
                  className="flex gap-2 flex-wrap justify-center min-h-32"
                >
                  {hand.cards.map((card, i) => (
                    <Card key={i} card={card} />
                  ))}
                </div>
                {results[handIndex] && (
                  <span
                    className="text-base font-bold tracking-wide"
                    style={{
                      fontFamily: "Playfair Display, serif",
                      color: results[handIndex] === "win" || results[handIndex] === "blackjack"
                        ? "var(--text-result-win)"
                        : results[handIndex] === "push" || results[handIndex] === "surrender"
                        ? "var(--text-result-push)"
                        : "var(--text-result-lose)",
                      textShadow: isDark
                        ? results[handIndex] === "win" || results[handIndex] === "blackjack"
                          ? "0 0 12px rgba(0,245,255,0.6)"
                          : results[handIndex] === "push" || results[handIndex] === "surrender"
                          ? "0 0 12px rgba(255,215,0,0.6)"
                          : "0 0 12px rgba(255,45,120,0.6)"
                        : "none",
                    }}
                  >
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

        {/* Controls */}
        <div className="flex flex-col items-center gap-5 w-full max-w-lg">

          {/* Insurance */}
          {phase === "insurance" && !isAnimating && (
            <div className="flex flex-col items-center gap-3">
              <span
                className="text-sm tracking-widest uppercase"
                style={{
                  color: "var(--insurance-color)",
                  fontFamily: "DM Mono, monospace",
                  textShadow: isDark ? "0 0 10px rgba(255,215,0,0.5)" : "none",
                }}
              >
                Dealer shows Ace — Insurance?
              </span>
              <div className="flex gap-4">
                <button
                  onClick={takeInsurance}
                  className="px-6 py-2.5 font-bold rounded-xl transition-all hover:scale-105"
                  style={{
                    backgroundColor: "var(--insurance-color)",
                    color: "#1a1100",
                    fontFamily: "DM Mono, monospace",
                    boxShadow: isDark ? "0 0 12px rgba(255,215,0,0.4)" : "none",
                  }}
                >
                  Take Insurance
                </button>
                <button
                  onClick={declineInsurance}
                  className="px-6 py-2.5 font-bold rounded-xl transition-all hover:scale-105"
                  style={{
                    backgroundColor: "var(--clear-btn-bg)",
                    border: "1px solid var(--clear-btn-border)",
                    color: "var(--clear-btn-color)",
                    fontFamily: "DM Mono, monospace",
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {phase === "playerTurn" && activeHand && !isAnimating && (
            <div className="flex gap-3 flex-wrap justify-center">
              <ActionButton theme={theme} color="#00f5ff" label="Hit" onClick={hit}
                highlighted={recommendedAction === "hit"} />
              <ActionButton theme={theme} color="#ff2d78" label="Stand" onClick={stand}
                highlighted={recommendedAction === "stand"} />
              {showDouble && (
                <ActionButton theme={theme} color="#ffd700" label="Double" onClick={doubleDown}
                  highlighted={recommendedAction === "double"} />
              )}
              {showSplit && (
                <ActionButton theme={theme} color="#a855f7" label="Split" onClick={split}
                  highlighted={recommendedAction === "split"} />
              )}
              {showSurrender && (
                <ActionButton theme={theme} color="#ff6b35" label="Surrender" onClick={surrender}
                  highlighted={recommendedAction === "surrender"} />
              )}
            </div>
          )}

          {/* Bet controls */}
          {phase === "idle" && !isAnimating && (
            <BetControls
              bankroll={bankroll}
              onDeal={(bet) => deal(bet)}
            />
          )}

          {/* Next Round */}
          {phase === "roundOver" && !isAnimating && (
            <button
              onClick={newRound}
              className="btn-appear hover:scale-105 active:scale-95 tracking-widest uppercase font-bold"
              style={{
                padding: "14px 48px",
                borderRadius: "999px",
                fontFamily: "DM Mono, monospace",
                fontSize: "13px",
                letterSpacing: "0.15em",
                cursor: "pointer",
                transition: "all 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
                ...(isDark ? {
                  background: "linear-gradient(135deg, rgba(0,245,255,0.15), rgba(0,245,255,0.05))",
                  border: "1.5px solid rgba(0,245,255,0.6)",
                  color: "#00f5ff",
                  boxShadow: "0 0 24px rgba(0,245,255,0.2), inset 0 0 24px rgba(0,245,255,0.05)",
                  textShadow: "0 0 10px rgba(0,245,255,0.7)",
                } : {
                  background: "linear-gradient(135deg, rgba(107,77,6,0.12), rgba(107,77,6,0.06))",
                  border: "2px solid rgba(107,77,6,0.7)",
                  color: "#4a3500",
                  boxShadow: "0 4px 16px rgba(107,77,6,0.2)",
                  textShadow: "none",
                }),
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget;
                if (isDark) {
                  btn.style.background = "linear-gradient(135deg, rgba(0,245,255,0.25), rgba(0,245,255,0.1))";
                  btn.style.boxShadow = "0 0 40px rgba(0,245,255,0.35), inset 0 0 30px rgba(0,245,255,0.1)";
                } else {
                  btn.style.background = "linear-gradient(135deg, rgba(107,77,6,0.22), rgba(107,77,6,0.12))";
                  btn.style.boxShadow = "0 6px 24px rgba(107,77,6,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget;
                if (isDark) {
                  btn.style.background = "linear-gradient(135deg, rgba(0,245,255,0.15), rgba(0,245,255,0.05))";
                  btn.style.boxShadow = "0 0 24px rgba(0,245,255,0.2), inset 0 0 24px rgba(0,245,255,0.05)";
                } else {
                  btn.style.background = "linear-gradient(135deg, rgba(107,77,6,0.12), rgba(107,77,6,0.06))";
                  btn.style.boxShadow = "0 4px 16px rgba(107,77,6,0.2)";
                }
              }}
            >
              ✦ Next Round ✦
            </button>
          )}

        </div>
      </div>

      {/* Count overlay */}
      <CountOverlay
        phase={phase}
        playerHand={activeHand ?? null}
        dealerUpCard={dealerHand.cards[0]?.rank ?? null}
      />

      <DebugPanel onScenario={debugDeal} onForceReshuffle={forceReshuffle} />

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes float-card-0 {
          0%   { transform: translateY(0px); opacity: 0; }
          15%  { opacity: 0.07; }
          85%  { opacity: 0.07; }
          100% { transform: translateY(-18px); opacity: 0; }
        }
        @keyframes float-card-1 {
          0%   { transform: translateY(0px); opacity: 0; }
          15%  { opacity: 0.06; }
          85%  { opacity: 0.06; }
          100% { transform: translateY(-24px); opacity: 0; }
        }
        @keyframes float-card-2 {
          0%   { transform: translateY(0px); opacity: 0; }
          15%  { opacity: 0.08; }
          85%  { opacity: 0.08; }
          100% { transform: translateY(-14px); opacity: 0; }
        }
        @keyframes float-card-3 {
          0%   { transform: translateY(0px); opacity: 0; }
          15%  { opacity: 0.05; }
          85%  { opacity: 0.05; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .btn-appear {
          animation: fade-in 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
}