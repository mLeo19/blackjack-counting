import { create } from "zustand";

interface CountEntry {
  value: number;
  rank: string;
}

interface CountStore {
  runningCount: number;
  trueCount: number;
  trainMode: boolean;
  hintVisible: boolean;
  hintUsed: boolean;
  countHistory: CountEntry[];
  addCount: (value: number, rank: string) => void;
  setTrueCount: (value: number) => void;
  resetCount: () => void;
  toggleTrainMode: () => void;
  resetTrainMode: () => void;
  showHint: () => void;
  hideHint: () => void;
  resetHint: () => void;
  clearHistory: () => void;
}

export const useCountStore = create<CountStore>((set) => ({
  runningCount: 0,
  trueCount: 0,
  trainMode: false,
  hintVisible: false,
  hintUsed: false,
  countHistory: [],
  addCount: (value, rank) => set((state) => ({
    runningCount: state.runningCount + value,
    countHistory: [...state.countHistory, { value, rank }],
  })),
  setTrueCount: (value) => set({ trueCount: value }),
  resetCount: () => set({ runningCount: 0, trueCount: 0, countHistory: [] }),
  toggleTrainMode: () => set((state) => ({
    trainMode: !state.trainMode,
    hintVisible: false,
    //hintUsed: false,
  })),
  resetTrainMode: () => set({ trainMode: false, hintVisible: false, hintUsed: false }),
  showHint: () => set({ hintVisible: true, hintUsed: true }),
  hideHint: () => set({ hintVisible: false }),
  resetHint: () => set({ hintVisible: false, hintUsed: false }),
  clearHistory: () => set({ countHistory: [] }),
}));