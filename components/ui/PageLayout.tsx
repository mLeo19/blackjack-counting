"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import FloatingCards from "./FloatingCards";

interface PageLayoutProps {
  children: ReactNode;
  showTopBar?: boolean;
}

export default function PageLayout({ children, showTopBar = true }: PageLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="felt-texture min-h-screen flex flex-col overflow-hidden relative"
      style={{ color: "var(--text-primary)" }}
    >
      {/* Floating background cards */}
      <FloatingCards isDark={isDark} count={12} />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,245,255,0.04) 0%, transparent 70%)"
            : "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(184,134,11,0.06) 0%, transparent 70%)",
          zIndex: 1,
        }}
      />

      {/* Top bar */}
      {showTopBar && (
        <div
          className="relative z-10 flex justify-between items-center px-8 py-6"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-10px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          <button
            onClick={() => router.push("/")}
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "20px",
              fontWeight: 700,
              color: isDark ? "rgba(0,245,255,0.7)" : "rgba(107,77,6,0.7)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ♠ Soft17
          </button>
          <button
            onClick={toggleTheme}
            className="transition-all hover:scale-110"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "24px",
              filter: theme === "light" ? "brightness(0)" : "none",
            }}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      )}

      {/* Page content */}
      <div
        className="relative z-10 flex flex-col flex-1"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s",
        }}
      >
        {children}
      </div>
    </div>
  );
}