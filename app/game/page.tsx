"use client";

import Card from "@/components/game/Card";
import FlyingCard from "@/components/game/FlyingCard";
import DebugPanel from "@/components/game/DebugPanel";
import BetControls from "@/components/game/BetControls";
import { useGameController } from "@/hooks/useGameController";
import { useShoeContext } from "@/context/ShoeContext";
import { decksRemaining } from "@/lib/blackjack/deck";
import { getHandValue, canSplit, canDouble } from "@/lib/blackjack/hand";

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
    forceReshuffle
  } = useGameController();

  const { shoeRef, dealerHandRef, playerHandRefs } = useShoeContext();

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

  return (
    <div className="flex flex-col min-h-screen bg-green-900 text-white">

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

      {/* ── Top Quarter: Two columns ── */}
      <div className="flex justify-center border-b border-green-700">
        <div className="flex w-full max-w-2xl">

          {/* Left — Dealer Hand */}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4 px-6 border-r border-green-700">
            <span className="text-xs uppercase tracking-widest text-green-400">
              Dealer
              {phase !== "idle" && phase !== "playerTurn" && phase !== "insurance"
                ? ` — ${getHandValue(dealerHand.cards)}`
                : ""}
            </span>
            <div ref={dealerHandRef} className="flex gap-3 flex-wrap justify-center min-h-32">
              {dealerHand.cards.map((card, i) => (
                <Card key={i} card={card} />
              ))}
            </div>
          </div>

          {/* Right — Bankroll + Decks + Shoe */}
          <div className="flex flex-col items-center justify-center gap-3 py-4 px-4 w-56 overflow-hidden">

            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-green-400">Bankroll</span>
              <span className="text-xl font-bold">${bankroll}</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-green-400">Decks Left</span>
              <span className="text-lg font-semibold">{decksLeft}</span>
            </div>

            <div className="flex flex-col items-center gap-1 w-full overflow-hidden">
              <span className="text-xs uppercase tracking-widest text-green-400">
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
                  return (
                    <div
                      key={i}
                      className="absolute rounded-sm border transition-all duration-300"
                      style={{
                        width: `${cardWidth}px`,
                        height: `${cardHeight}px`,
                        left: `${i * overlap}px`,
                        top: 0,
                        zIndex: i,
                        backgroundColor: `hsl(220, 55%, ${20 + i * 0.5}%)`,
                        borderColor: "rgba(255,255,255,0.15)",
                      }}
                    />
                  );
                })}
                <div
                  className="absolute top-0 w-px bg-white/30"
                  style={{
                    left: `${(totalSlots - 1) * overlap + cardWidth}px`,
                    height: `${cardHeight}px`,
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom: Player + Controls ── */}
      <div className="flex flex-1 flex-col items-center justify-between py-8 px-4 gap-6">

        <div className="w-full max-w-3xl">
          <div className="flex flex-wrap justify-center gap-6">
            {playerHands.map((hand, handIndex) => (
              <div
                key={handIndex}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-2xl transition-all
                  ${handIndex === activeHandIndex && phase === "playerTurn"
                    ? "ring-2 ring-yellow-400 bg-green-800/40"
                    : ""}
                  ${playerHands.length === 3
                    ? handIndex < 2 ? "basis-[45%]" : "basis-full"
                    : playerHands.length === 4
                    ? "basis-[45%] sm:basis-auto"
                    : ""}
                `}
              >
                <span className="text-xs uppercase tracking-widest text-green-400">
                  {playerHands.length > 1 ? `Hand ${handIndex + 1} — ` : ""}
                  {hand.isSurrendered ? "Surrendered" : getHandValue(hand.cards)}
                </span>
                <div
                  ref={(el) => { playerHandRefs.current[handIndex] = el; }}
                  className="flex gap-2 flex-wrap justify-center min-h-32"
                >
                  {hand.cards.map((card, i) => (
                    <Card key={i} card={card} />
                  ))}
                </div>
                {results[handIndex] && (
                  <span className={`text-base font-bold ${
                    results[handIndex] === "win" || results[handIndex] === "blackjack"
                      ? "text-green-400"
                      : results[handIndex] === "push" || results[handIndex] === "surrender"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}>
                    {results[handIndex] === "blackjack" && "🃏 Blackjack!"}
                    {results[handIndex] === "win" && "✅ Win"}
                    {results[handIndex] === "lose" && "❌ Lose"}
                    {results[handIndex] === "push" && "🤝 Push"}
                    {results[handIndex] === "bust" && "💥 Bust"}
                    {results[handIndex] === "surrender" && "🏳️ Surrender"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-md">

          {phase === "insurance" && !isAnimating && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-yellow-300">
                Dealer shows Ace — Take insurance?
              </span>
              <div className="flex gap-3">
                <button onClick={takeInsurance} className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors">Take Insurance</button>
                <button onClick={declineInsurance} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">Decline</button>
              </div>
            </div>
          )}

          {phase === "playerTurn" && activeHand && !isAnimating && (
            <div className="flex gap-3 flex-wrap justify-center">
              <button onClick={hit} className="px-5 py-2.5 bg-white hover:bg-gray-100 text-black font-bold rounded-xl transition-colors">Hit</button>
              <button onClick={stand} className="px-5 py-2.5 bg-white hover:bg-gray-100 text-black font-bold rounded-xl transition-colors">Stand</button>
              {canDouble(activeHand.cards) && bankroll >= activeHand.bet && !activeHand.isLockedAce && (
                <button onClick={doubleDown} className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors">Double</button>
              )}
              {canSplit(activeHand.cards) && bankroll >= activeHand.bet && playerHands.length < 4 && (
                <button onClick={split} className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl transition-colors">Split</button>
              )}
              {activeHand.cards.length === 2 && !activeHand.isSplit && (
                <button onClick={surrender} className="px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-colors">Surrender</button>
              )}
            </div>
          )}

          {phase === "idle" && !isAnimating && (
            <BetControls
              bankroll={bankroll}
              onDeal={(bet) => deal(bet)}
            />
          )}

          {phase === "roundOver" && !isAnimating && (
            <button onClick={newRound} className="px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl text-lg transition-colors">
              Next Round
            </button>
          )}

        </div>
      </div>

      {/* Dev panel — only renders in development */}
      <DebugPanel onScenario={debugDeal} onForceReshuffle={forceReshuffle} />

    </div>
  );
}