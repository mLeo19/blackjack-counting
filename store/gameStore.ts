import { create } from "zustand";
import { GameState } from "@/types";
import {
  createInitialState,
  deal,
  hit,
  stand,
  doubleDown,
  split,
  surrender,
  takeInsurance,
  declineInsurance,
  newRound,
} from "@/lib/blackjack/engine";

// Store

interface GameStore {
  game: GameState;
  deal: (bet: number) => void;
  hit: () => void;
  stand: () => void;
  doubleDown: () => void;
  split: () => void;
  surrender: () => void;
  takeInsurance: () => void;
  declineInsurance: () => void;
  newRound: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: createInitialState(),

  deal: (bet) => set((state) => ({ game: deal(state.game, bet) })),
  hit: () => set((state) => ({ game: hit(state.game) })),
  stand: () => set((state) => ({ game: stand(state.game) })),
  doubleDown: () => set((state) => ({ game: doubleDown(state.game) })),
  split: () => set((state) => ({ game: split(state.game) })),
  surrender: () => set((state) => ({ game: surrender(state.game) })),
  takeInsurance: () => set((state) => ({ game: takeInsurance(state.game) })),
  declineInsurance: () => set((state) => ({ game: declineInsurance(state.game) })),
  newRound: () => set((state) => ({ game: newRound(state.game) })),
  resetGame: () => set({ game: createInitialState() }),
}));