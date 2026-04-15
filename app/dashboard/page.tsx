"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, getLifetimeStats, getSessionHistory } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/client";
import { useCountStore } from "@/store/countStore";
import FloatingCards from "@/components/ui/FloatingCards";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  isDark: boolean;
  color?: string;
  delay?: number;
  mounted: boolean;
}

function StatCard({ label, value, sub, isDark, color, delay = 0, mounted }: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  const accentColor = color ?? (isDark ? "#00f5ff" : "#8b6508");

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 140px",
        padding: "24px 20px",
        borderRadius: "20px",
        backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)",
        border: `1px solid ${hovered
          ? isDark ? `${accentColor}40` : "rgba(107,77,6,0.3)"
          : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
        backdropFilter: "blur(12px)",
        boxShadow: hovered
          ? isDark ? `0 0 30px ${accentColor}15` : "0 8px 32px rgba(0,0,0,0.08)"
          : "none",
        transition: "all 0.3s ease",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transitionDelay: `${delay}ms`,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <span style={{
        fontFamily: "DM Mono, monospace",
        fontSize: "9px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "Playfair Display, serif",
        fontSize: "28px",
        fontWeight: 700,
        color: accentColor,
        textShadow: isDark ? `0 0 20px ${accentColor}40` : "none",
        lineHeight: 1,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{
          fontFamily: "DM Mono, monospace",
          fontSize: "10px",
          color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)",
        }}>
          {sub}
        </span>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";

  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 8;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function load() {
      const [p, s, h] = await Promise.all([
        getProfile(),
        getLifetimeStats(),
        getSessionHistory(LIMIT, 0),
      ]);
      setProfile(p);
      setStats(s);
      setSessions(h);
      setHasMore(h.length === LIMIT);
      setLoadingData(false);
    }
    load();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const more = await getSessionHistory(LIMIT, sessions.length);
    setSessions((prev) => [...prev, ...more]);
    setHasMore(more.length === LIMIT);
    setLoadingMore(false);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("gameActive");
    useCountStore.getState().resetTrainMode();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const winRate = stats && stats.hands_played > 0
    ? Math.round((stats.hands_won / stats.hands_played) * 100)
    : 0;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const formatProfit = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return val >= 0 ? `+$${val.toLocaleString()}` : `-$${Math.abs(val).toLocaleString()}`;
  };

  const formatPercent = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return val >= 0 ? `+${val}%` : `${val}%`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const profitColor = (val: number | null) => {
    if (val === null) return isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
    if (val > 0) return isDark ? "#00f5ff" : "#15803d";
    if (val < 0) return "#ff2d78";
    return isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  };

  return (
    <div className="felt-texture min-h-screen flex flex-col overflow-hidden relative" style={{ color: "var(--text-primary)" }}>
      <FloatingCards isDark={isDark} count={12} />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: isDark
          ? "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(0,245,255,0.04) 0%, transparent 70%)"
          : "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(184,134,11,0.06) 0%, transparent 70%)",
        zIndex: 1,
      }} />

      {/* Top bar */}
      <div
        className="relative z-10 flex justify-between items-center px-8 py-6"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <button
          onClick={() => router.push("/game")}
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

      {/* Main content */}
      <div className="relative z-10 flex flex-col flex-1 px-6 pb-12 gap-8" style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>

        {/* Back button */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.8s ease 0.05s, transform 0.8s ease 0.05s",
          }}
        >
          <button
            onClick={() => router.push("/game")}
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.6)",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? "rgba(0,245,255,1)" : "rgba(107,77,6,1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.6)"; }}
          >
            ← Back to Game
          </button>
        </div>

        {/* Profile header */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s",
          }}
        >
          {loadingData ? (
            <div style={{ height: "60px" }} />
          ) : (
            <div className="flex flex-col gap-1">
              <h1 style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(28px, 5vw, 40px)",
                fontWeight: 700,
                color: isDark ? "#ffffff" : "#1a1200",
                lineHeight: 1,
              }}>
                {profile?.username}
              </h1>
              <span style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "11px",
                color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                letterSpacing: "0.08em",
              }}>
                Member since {memberSince}
              </span>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div
          className="flex flex-wrap gap-4"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.3s ease 0.15s",
          }}
        >
          {loadingData ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ flex: "1 1 140px", height: "100px", borderRadius: "20px", backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />
            ))
          ) : (
            <>
              <StatCard
                label="Hands Played"
                value={stats?.hands_played?.toLocaleString() ?? "0"}
                isDark={isDark}
                color={isDark ? "#00f5ff" : "#8b6508"}
                delay={150}
                mounted={mounted}
              />
              <StatCard
                label="Win Rate"
                value={`${winRate}%`}
                sub={`${stats?.hands_won ?? 0}W — ${stats?.hands_lost ?? 0}L`}
                isDark={isDark}
                color={isDark ? "#00f5ff" : "#8b6508"}
                delay={200}
                mounted={mounted}
              />
              <StatCard
                label="Best Session"
                value={formatPercent(stats?.best_session_profit_percent)}
                isDark={isDark}
                color={
                  stats?.best_session_profit_percent > 0
                    ? isDark ? "#00f5ff" : "#15803d"
                    : stats?.best_session_profit_percent < 0
                    ? "#ff2d78"
                    : isDark ? "#00f5ff" : "#8b6508"
                }
                delay={250}
                mounted={mounted}
              />
              <StatCard
                label="Avg Session"
                value={formatPercent(stats?.avg_session_profit_percent)}
                isDark={isDark}
                color={
                  stats?.avg_session_profit_percent > 0
                    ? isDark ? "#00f5ff" : "#15803d"
                    : stats?.avg_session_profit_percent < 0
                    ? "#ff2d78"
                    : isDark ? "#00f5ff" : "#8b6508"
                }
                delay={300}
                mounted={mounted}
              />
            </>
          )}
        </div>

        {/* Session history */}
        <div
          className="flex flex-col gap-4"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.8s ease 0.35s, transform 0.8s ease 0.35s",
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
              Session History
            </span>
            <div style={{ flex: 1, height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }} />
          </div>

          {loadingData ? (
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", textAlign: "center", padding: "32px 0" }}>
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", textAlign: "center", padding: "32px 0", letterSpacing: "0.08em" }}>
              No completed sessions yet
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Header row */}
              <div className="flex items-center px-4" style={{ gap: "12px" }}>
                {["Date", "Hands", "Profit", "%"].map((h, i) => (
                  <span
                    key={h}
                    style={{
                      fontFamily: "DM Mono, monospace",
                      fontSize: "9px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
                      flex: i === 0 ? 2 : 1,
                      textAlign: i > 0 ? "right" : "left",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Session rows */}
              {sessions.map((session, i) => (
                <div
                  key={session.id}
                  className="flex items-center px-4 py-3 rounded-2xl"
                  style={{
                    gap: "12px",
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(8px)",
                    transition: `opacity 0.5s ease ${0.4 + i * 0.05}s, transform 0.5s ease ${0.4 + i * 0.05}s`,
                  }}
                >
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", flex: 2 }}>
                    {formatDate(session.ended_at)}
                  </span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", flex: 1, textAlign: "right" }}>
                    {session.hands_played ?? 0}
                  </span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: profitColor(session.net_profit), flex: 1, textAlign: "right", textShadow: isDark && session.net_profit !== null ? `0 0 8px ${profitColor(session.net_profit)}60` : "none" }}>
                    {formatProfit(session.net_profit)}
                  </span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: profitColor(session.profit_percent), flex: 1, textAlign: "right" }}>
                    {formatPercent(session.profit_percent)}
                  </span>
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    marginTop: "8px",
                    padding: "12px",
                    borderRadius: "999px",
                    fontFamily: "DM Mono, monospace",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: loadingMore ? "not-allowed" : "pointer",
                    background: "transparent",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                    color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                    transition: "all 0.2s ease",
                    opacity: loadingMore ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark ? "rgba(0,245,255,0.3)" : "rgba(107,77,6,0.3)";
                    e.currentTarget.style.color = isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
                    e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
                  }}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: isDark ? "rgba(255,45,120,0.5)" : "rgba(180,0,60,0.5)",
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "color 0.2s ease",
              padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ff2d78"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "rgba(255,45,120,0.5)" : "rgba(180,0,60,0.5)"; }}
          >
            Log Out
          </button>
        </div>

      </div>
    </div>
  );
}