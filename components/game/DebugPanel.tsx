"use client";

interface DebugPanelProps {
  onScenario: (targets: { rank: string; suit?: string }[]) => void;
  onForceReshuffle: () => void;
}

const SCENARIOS: {
  label: string;
  targets: { rank: string; suit?: string }[];
}[] = [
  {
    label: "Player Blackjack",
    // p1=A, d1=5, p2=K, d2=8
    targets: [
      { rank: "A" },
      { rank: "5" },
      { rank: "K" },
      { rank: "8" },
    ],
  },
  {
    label: "Dealer Blackjack",
    // p1=7, d1=A, p2=8, d2=K
    targets: [
      { rank: "7" },
      { rank: "A" },
      { rank: "8" },
      { rank: "K" },
    ],
  },
  {
    label: "Both Blackjack",
    // p1=A, d1=A, p2=K, d2=K
    targets: [
      { rank: "A" },
      { rank: "A" },
      { rank: "K" },
      { rank: "K" },
    ],
  },
  {
    label: "Player Pair (8s)",
    // p1=8, d1=5, p2=8, d2=7
    targets: [
      { rank: "8" },
      { rank: "5" },
      { rank: "8" },
      { rank: "7" },
    ],
  },
  {
    label: "Player Pair (As)",
    // p1=A, d1=5, p2=A, d2=7
    targets: [
      { rank: "A" },
      { rank: "5" },
      { rank: "A" },
      { rank: "7" },
    ],
  },
  {
    label: "Soft 17",
    // p1=A, d1=5, p2=6, d2=7
    targets: [
      { rank: "A" },
      { rank: "5" },
      { rank: "6" },
      { rank: "7" },
    ],
  },
  {
    label: "Player Bust Setup",
    // p1=10, d1=5, p2=6, d2=7 — hit to bust
    targets: [
      { rank: "10" },
      { rank: "5" },
      { rank: "6" },
      { rank: "7" },
    ],
  },
  {
    label: "Dealer Busts",
    // p1=10, d1=10, p2=9, d2=6 — dealer draw → 10+6+10 = 26, bust
    targets: [
      { rank: "10" },
      { rank: "10" },
      { rank: "9" },
      { rank: "6" },
      { rank: "10" }, 
    ],
  },
  {
    label: "Insurance Setup",
    // d1=A so insurance is offered
    targets: [
      { rank: "7" },
      { rank: "A" },
      { rank: "9" },
      { rank: "8" },
    ],
  },
  {
    label: "Surrender Setup",
    // p1=10, d1=A, p2=6, d2=K — bad hand against dealer ace, good surrender candidate
    targets: [
      { rank: "10" },
      { rank: "A" },
      { rank: "6" },
      { rank: "K" },
    ],
  },
  {
    label: "Insurance Win",
    // p1=7, d1=A, p2=8, d2=K — dealer has blackjack, insurance pays
    targets: [
      { rank: "7" },
      { rank: "A" },
      { rank: "8" },
      { rank: "K" },
    ],
  },
  {
    label: "Insurance Lose",
    // p1=7, d1=A, p2=8, d2=6 — dealer does NOT have blackjack, insurance loses
    targets: [
      { rank: "7" },
      { rank: "A" },
      { rank: "8" },
      { rank: "6" },
    ],
  },
  {
    label: "Double Down Bust",
    // p1=10, d1=5, p2=6, d2=7 — player has 16, next card in shoe should be a 10
    targets: [
      { rank: "10" },  // p1
      { rank: "5" },   // d1
      { rank: "6" },   // p2
      { rank: "7" },   // d2
      { rank: "10" },  // player draw after double → 10+6+10 = 26, bust
    ],
  },
  {
  label: "Double Down Win",
  // player gets 10+9=19, doubles, gets A = 20. Dealer has 5+7=12, draws and busts
  targets: [
    { rank: "10" },  // p1
    { rank: "5" },   // d1
    { rank: "9" },   // p2
    { rank: "7" },   // d2
    { rank: "A" },   // player double draw → 10+9+A = 20
    { rank: "10" },  // dealer draw → 5+7+10 = 22, bust
  ],
},
{
  label: "Triple Split",
  // player gets two 8s, splits, gets another 8 on first hand, splits again
  targets: [
    { rank: "8" },   // p1
    { rank: "5" },   // d1
    { rank: "8" },   // p2
    { rank: "7" },   // d2
    { rank: "8" },   // first card on hand 1 after split → another 8, can split again
    { rank: "2" },   // first card on hand 2 after split
  ],
},
{
  label: "Quad Split",
  // player gets two 8s, splits twice more to reach 4 hands
  targets: [
    { rank: "8" },   // p1
    { rank: "5" },   // d1
    { rank: "8" },   // p2
    { rank: "7" },   // d2
    { rank: "8" },   // hand 1 after first split → another 8, split again
    { rank: "2" },   // hand 2 after first split
    { rank: "8" },   // hand 1 after second split → another 8, split again
    { rank: "3" },   // hand 3 after second split
    { rank: "4" },   // hand 1 after third split
    { rank: "6" },   // hand 4 after third split
  ],
},
];

export default function DebugPanel({ onScenario, onForceReshuffle }: DebugPanelProps) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 bg-black/80 border border-white/20 rounded-xl p-3 flex flex-col gap-2"
      style={{ maxWidth: "180px" }}
    >
      <span className="text-xs uppercase tracking-widest text-yellow-400 font-bold">
        Dev Panel
      </span>
      {SCENARIOS.map((scenario) => (
        <button
          key={scenario.label}
          onClick={() => onScenario(scenario.targets)}
          className="text-left text-xs text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-2 py-1.5 transition-colors"
        >
          {scenario.label}
        </button>
      ))}
      <div className="border-t border-white/10 mt-1 pt-1">
        <button
          onClick={onForceReshuffle}
          className="text-left text-xs text-yellow-300 hover:text-yellow-200 bg-white/5 hover:bg-white/10 rounded-lg px-2 py-1.5 transition-colors w-full"
        >
          Force Reshuffle
        </button>
      </div>
    </div>
  );
}