"use client";

import { createContext, useContext, useRef, useCallback, ReactNode } from "react";

interface Position { x: number; y: number }

interface ShoeContextType {
  shoeRef: React.RefObject<HTMLDivElement | null>;
  dealerHandRef: React.RefObject<HTMLDivElement | null>;
  playerHandRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  getShoePosition: () => Position | null;
  getDealerPosition: () => Position | null;
  getPlayerPosition: (handIndex: number) => Position | null;
}

const ShoeContext = createContext<ShoeContextType | null>(null);

export function ShoeProvider({ children }: { children: ReactNode }) {
  const shoeRef = useRef<HTMLDivElement>(null);
  const dealerHandRef = useRef<HTMLDivElement>(null);
  const playerHandRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const getShoePosition = useCallback((): Position | null => {
    if (!shoeRef.current) return null;
    const r = shoeRef.current.getBoundingClientRect();
    return { x: r.right, y: r.top + r.height / 2 };
  }, []);

  const getDealerPosition = useCallback((): Position | null => {
    if (!dealerHandRef.current) return null;
    const r = dealerHandRef.current.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, []);

  const getPlayerPosition = useCallback((handIndex: number): Position | null => {
    const el = playerHandRefs.current[handIndex];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, []);

  return (
    <ShoeContext.Provider value={{
      shoeRef,
      dealerHandRef,
      playerHandRefs,
      getShoePosition,
      getDealerPosition,
      getPlayerPosition,
    }}>
      {children}
    </ShoeContext.Provider>
  );
}

export function useShoeContext() {
  const ctx = useContext(ShoeContext);
  if (!ctx) throw new Error("useShoeContext must be used inside ShoeProvider");
  return ctx;
}