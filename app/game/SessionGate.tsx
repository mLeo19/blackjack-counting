"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { Profile, SessionStats, getOpenSession, closeSession, createNewSession, saveBankroll } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/client";
import { useCountStore } from "@/store/countStore";
import FloatingCards from "@/components/ui/FloatingCards";

interface SessionGateProps {
  profile: Profile;
  onReady: (bankroll: number, sessionId: string) => void;
  startOnNewGame?: boolean;
  currentBankroll?: number;
  fromDashboard?: boolean;
}

export default function SessionGate({ profile, onReady, startOnNewGame = false, currentBankroll, fromDashboard = false }: SessionGateProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";

  const [openSession, setOpenSession] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showNewGame, setShowNewGame] = useState(startOnNewGame);
  const [newBankroll, setNewBankroll] = useState("");
  const [bankrollFocused, setBankrollFocused] = useState(false);
  const [error, setError] = useState("");
  const [startingSession, setStartingSession] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [endingToDashboard, setEndingToDashboard] = useState(false);

  useEffect(() => {
    if (!startOnNewGame) {
      sessionStorage.removeItem("gameActive");
    }

    getOpenSession().then((session) => {
      setOpenSession(session);
      if (!session) {
        setShowNewGame(true);
      }
      setLoading(false);
      setTimeout(() => setMounted(true), 50);
    });
  }, []);

  const handleResume = async () => {
    if (!openSession) return;
    setStartingSession(true);
    sessionStorage.setItem("gameActive", "true");
    onReady(profile.bankroll, openSession.id);
  };

  const handleNewGame = async () => {
    const bankrollNum = parseInt(newBankroll);
    if (!newBankroll || isNaN(bankrollNum) || bankrollNum < 100) {
      return setError("Minimum starting bankroll is $100.");
    }
    setStartingSession(true);

    if (openSession) {
      await closeSession(openSession.id, currentBankroll ?? profile.bankroll, openSession.starting_bankroll);
    }

    await saveBankroll(bankrollNum);

    const sessionId = await createNewSession(bankrollNum);
    if (!sessionId) {
      setError("Failed to create session.");
      setStartingSession(false);
      return;
    }

    sessionStorage.setItem("gameActive", "true");
    onReady(bankrollNum, sessionId);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    sessionStorage.removeItem("gameActive");
    useCountStore.getState().resetTrainMode();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleEndAndLogout = async () => {
    setLoggingOut(true);
    if (openSession) {
      await closeSession(openSession.id, currentBankroll ?? profile.bankroll, openSession.starting_bankroll);
    }
    sessionStorage.removeItem("gameActive");
    useCountStore.getState().resetTrainMode();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleEndAndDashboard = async () => {
    setEndingToDashboard(true);
    if (openSession) {
      await closeSession(openSession.id, currentBankroll ?? profile.bankroll, openSession.starting_bankroll);
    }
    sessionStorage.removeItem("gameActive");
    router.push("/dashboard");
  };

  const isAnyProcessing = startingSession || loggingOut || endingToDashboard;

  const inputStyle = (focused: boolean) => ({
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: `1px solid ${focused
      ? isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.5)"
      : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
    color: isDark ? "#e8f5e8" : "#1a1200",
    fontFamily: "DM Mono, monospace",
    fontSize: "13px",
    outline: "none",
    boxShadow: focused
      ? isDark ? "0 0 12px rgba(0,245,255,0.15)" : "0 0 12px rgba(107,77,6,0.1)"
      : "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    paddingLeft: "28px",
  });

  if (loading) {
    return (
      <div className="felt-texture min-h-screen flex items-center justify-center">
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase" as const, opacity: 0.5 }}>
          Loading...
        </span>
      </div>
    );
  }

  // determine title
  const title = startOnNewGame
    ? "End Current Session"
    : showNewGame && !openSession
    ? "Start New Session"
    : showNewGame
    ? "End Current Session"
    : "Welcome back";

  return (
    <div className="felt-texture min-h-screen flex flex-col overflow-hidden relative" style={{ color: "var(--text-primary)" }}>
      <FloatingCards isDark={isDark} count={12} />

      {/* Top bar */}
      <div
        className="relative z-10 flex justify-between items-center px-8 py-6"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <span style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 700, color: isDark ? "rgba(0,245,255,0.7)" : "rgba(107,77,6,0.7)" }}>
          ♠ Soft17
        </span>
        <button
          onClick={toggleTheme}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", filter: theme === "light" ? "brightness(0)" : "none" }}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-1 items-center justify-center px-6 py-12"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s",
        }}
      >
        <div style={{
          width: "100%",
          maxWidth: "400px",
          padding: "40px",
          borderRadius: "24px",
          backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.6)",
          border: `1px solid ${isDark ? "rgba(0,245,255,0.12)" : "rgba(107,77,6,0.15)"}`,
          backdropFilter: "blur(12px)",
          boxShadow: isDark ? "0 0 60px rgba(0,0,0,0.4)" : "0 20px 60px rgba(0,0,0,0.08)",
        }}>

          {/* Header */}
          <div className="flex flex-col items-center gap-1 mb-8">
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "24px", fontWeight: 700, color: isDark ? "#ffffff" : "#1a1200" }}>
              {title}
            </h1>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: "13px", color: isDark ? "#00f5ff" : "#8b6508", textShadow: isDark ? "0 0 10px rgba(0,245,255,0.4)" : "none" }}>
              {profile.username}
            </span>
          </div>

          {!showNewGame ? (
            <div className="flex flex-col gap-3">
              {openSession && (
                <>
                  <div
                    className="flex flex-col items-center gap-1 py-4 rounded-2xl mb-2"
                    style={{
                      backgroundColor: isDark ? "rgba(0,245,255,0.05)" : "rgba(107,77,6,0.05)",
                      border: `1px solid ${isDark ? "rgba(0,245,255,0.1)" : "rgba(107,77,6,0.1)"}`,
                    }}
                  >
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>
                      Current Bankroll
                    </span>
                    <span style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", fontWeight: 700, color: isDark ? "#ffd700" : "#8b6508", textShadow: isDark ? "0 0 10px rgba(255,215,0,0.3)" : "none" }}>
                      ${profile.bankroll.toLocaleString()}
                    </span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", color: "var(--text-muted)" }}>
                      Started with ${openSession.starting_bankroll.toLocaleString()}
                    </span>
                  </div>
                  <SessionButton label="Resume Session" onClick={handleResume} isDark={isDark} disabled={isAnyProcessing} variant="primary" />
                  <SessionButton label="End Session" onClick={() => setShowNewGame(true)} isDark={isDark} disabled={isAnyProcessing} variant="secondary" />
                </>
              )}
              <SessionButton label="Visit Dashboard" onClick={() => router.push("/dashboard")} isDark={isDark} disabled={isAnyProcessing} variant="ghost" />
              <SessionButton label="Log Out" onClick={handleLogout} isDark={isDark} disabled={isAnyProcessing} variant="ghost" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" as const, color: isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.6)", marginBottom: "6px", display: "block" }}>
                  Starting Bankroll
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontFamily: "DM Mono, monospace", fontSize: "13px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", pointerEvents: "none" }}>$</span>
                  <input
                    type="number"
                    value={newBankroll}
                    onChange={(e) => setNewBankroll(e.target.value)}
                    onFocus={() => setBankrollFocused(true)}
                    onBlur={() => setBankrollFocused(false)}
                    placeholder="1000"
                    min={100}
                    style={inputStyle(bankrollFocused)}
                  />
                </div>
                <p style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", marginTop: "4px" }}>
                  Minimum $100
                </p>
              </div>

              {error && (
                <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#ff2d78" }}>✦ {error}</p>
              )}

              {/* Back + Start */}
              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <SessionButton
                    label="← Back"
                    onClick={() => {
                      if (startOnNewGame && fromDashboard) {
                        router.push("/dashboard");
                      } else if (startOnNewGame) {
                        // came from mid-game End Session — go back to game
                        sessionStorage.setItem("gameActive", "true");
                        onReady(currentBankroll ?? profile.bankroll, openSession?.id ?? "");
                      } else if (openSession) {
                        setShowNewGame(false);
                        setError("");
                      } else if (fromDashboard) {
                        router.push("/dashboard");
                        //router.back();
                      } else {
                        handleLogout();
                      }
                    }}
                    isDark={isDark}
                    disabled={isAnyProcessing}
                    variant="ghost"
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <SessionButton
                    label={startingSession ? "Starting..." : "Start Session"}
                    onClick={handleNewGame}
                    isDark={isDark}
                    disabled={isAnyProcessing}
                    variant="primary"
                  />
                </div>
              </div>

              {/* End & Visit Dashboard — only when there's a session to end */}
              {(openSession || startOnNewGame) && (
                <SessionButton
                  label={endingToDashboard ? "Redirecting..." : "End & Visit Dashboard"}
                  onClick={handleEndAndDashboard}
                  isDark={isDark}
                  disabled={isAnyProcessing}
                  variant="ghost"
                />
              )}

              {/* End & Log Out — only when there's a session to end */}
              {(openSession || startOnNewGame) && (
                <SessionButton
                  label={loggingOut ? "Logging out..." : "End & Log Out"}
                  onClick={handleEndAndLogout}
                  isDark={isDark}
                  disabled={isAnyProcessing}
                  variant="ghost"
                />
              )}

              {/* Visit Dashboard — when no session to end */}
              {!openSession && !startOnNewGame && (
                <SessionButton
                  label="Visit Dashboard"
                  onClick={() => router.push("/dashboard")}
                  isDark={isDark}
                  disabled={isAnyProcessing}
                  variant="ghost"
                />
              )}

              {/* Plain Log Out — when no session to end */}
              {!openSession && !startOnNewGame && (
                <SessionButton
                  label="Log Out"
                  onClick={handleLogout}
                  isDark={isDark}
                  disabled={isAnyProcessing}
                  variant="ghost"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionButton({
  label,
  onClick,
  isDark,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  isDark: boolean;
  disabled?: boolean;
  variant: "primary" | "secondary" | "ghost";
}) {
  const [hovered, setHovered] = useState(false);

  const styles = {
    primary: {
      border: isDark ? "1.5px solid rgba(0,245,255,0.5)" : "1.5px solid rgba(107,77,6,0.6)",
      backgroundColor: hovered
        ? isDark ? "rgba(0,245,255,0.2)" : "rgba(107,77,6,0.12)"
        : isDark ? "rgba(0,245,255,0.1)" : "rgba(107,77,6,0.06)",
      color: isDark ? "#00f5ff" : "#4a3500",
      boxShadow: hovered
        ? isDark ? "0 0 30px rgba(0,245,255,0.3)" : "0 6px 24px rgba(107,77,6,0.2)"
        : isDark ? "0 0 12px rgba(0,245,255,0.1)" : "none",
      textShadow: hovered && isDark ? "0 0 10px rgba(0,245,255,0.8)" : "none",
    },
    secondary: {
      border: isDark ? "1.5px solid rgba(255,45,120,0.4)" : "1.5px solid rgba(107,77,6,0.3)",
      backgroundColor: hovered
        ? isDark ? "rgba(255,45,120,0.12)" : "rgba(107,77,6,0.08)"
        : "transparent",
      color: isDark ? "#ff2d78" : "#6b4d06",
      boxShadow: hovered
        ? isDark ? "0 0 24px rgba(255,45,120,0.2)" : "0 4px 16px rgba(107,77,6,0.15)"
        : "none",
      textShadow: "none",
    },
    ghost: {
      border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
      backgroundColor: "transparent",
      color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
      boxShadow: "none",
      textShadow: "none",
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: "999px",
        fontFamily: "DM Mono, monospace",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transform: hovered && !disabled ? "scale(1.02) translateY(-1px)" : "scale(1)",
        transition: "all 0.25s ease",
        ...styles,
      }}
    >
      {label}
    </button>
  );
}