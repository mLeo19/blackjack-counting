"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MenuButton from "./MenuButton";

export default function GuestMenu({ isDark, onNewShoe, showNewShoe }: {
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