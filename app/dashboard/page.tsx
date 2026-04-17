"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import {
  getProfile,
  getLifetimeStats,
  getSessionHistory,
  getTotalNetProfit,
  getRecentSessionsForChart,
} from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/client";
import { useCountStore } from "@/store/countStore";
import FloatingCards from "@/components/ui/FloatingCards";
import StatCard from "@/components/dashboard/StatCard";
import BarChart from "@/components/dashboard/BarChart";
import formatDuration from "@/components/dashboard/formatDuration";

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";

  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [totalNetProfit, setTotalNetProfit] = useState<number>(0);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const LIMIT = 8;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [p, s, h, chart, profit] = await Promise.all([
      getProfile(),
      getLifetimeStats(),
      getSessionHistory(LIMIT, 0),
      getRecentSessionsForChart(10),
      getTotalNetProfit(),
    ]);

    const { data: openSession } = await supabase
      .from("session_stats")
      .select("id, hands_played, hands_won, starting_bankroll, started_at")
      .eq("user_id", user.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    setProfile(p);
    setStats(s);
    setSessions(h);
    setChartData(chart);
    setTotalNetProfit(profit);
    setCurrentSession(openSession ?? null);
    setHasMore(h.length === LIMIT);
    setLoadingData(false);
  }

  const loadMore = async () => {
    setLoadingMore(true);
    const more = await getSessionHistory(LIMIT, sessions.length);
    setSessions((prev) => [...prev, ...more]);
    setHasMore(more.length === LIMIT);
    setLoadingMore(false);
  };

  const handleEndSession = async () => {
  if (!currentSession || !profile) return;
  sessionStorage.removeItem("gameActive");
  router.push("/game?endSession=true");
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("gameActive");
    useCountStore.getState().resetTrainMode();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").delete().eq("user_id", user.id);
    await supabase.auth.signOut();
    sessionStorage.removeItem("gameActive");
    router.push("/");
  };

  const winRate = stats && stats.hands_played > 0
    ? Math.round((stats.hands_won / stats.hands_played) * 100) : 0;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  const formatProfit = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return val >= 0 ? `+$${Math.round(val).toLocaleString()}` : `-$${Math.abs(Math.round(val)).toLocaleString()}`;
  };

  const formatPercent = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return val >= 0 ? `+${val}%` : `${val}%`;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const profitColor = (val: number | null) => {
    if (val === null) return isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
    if (val > 0) return isDark ? "#00f5ff" : "#15803d";
    if (val < 0) return "#ff2d78";
    return isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  };

  const currentSessionProfit = currentSession && profile
    ? profile.bankroll - currentSession.starting_bankroll : null;

  return (
    <div className="felt-texture min-h-screen flex flex-col overflow-hidden relative" style={{ color: "var(--text-primary)" }}>
      <FloatingCards isDark={isDark} count={12} />

      <div className="absolute inset-0 pointer-events-none" style={{
        background: isDark
          ? "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(0,245,255,0.04) 0%, transparent 70%)"
          : "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(184,134,11,0.06) 0%, transparent 70%)",
        zIndex: 1,
      }} />

      {/* Top bar */}
      <div className="relative z-10 flex justify-between items-center px-8 py-6"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(-10px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
        <button onClick={() => {
          sessionStorage.setItem("gameActive", "true");
          router.push("/game")
        }}
          style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", fontWeight: 700, color: isDark ? "rgba(0,245,255,0.7)" : "rgba(107,77,6,0.7)", background: "none", border: "none", cursor: "pointer" }}>
          ♠ Soft17
        </button>
        <button onClick={toggleTheme} className="transition-all hover:scale-110"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", filter: theme === "light" ? "brightness(0)" : "none" }}>
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col flex-1 px-6 pb-12 gap-8" style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>

        {/* Back button */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.8s ease 0.05s, transform 0.8s ease 0.05s" }}>
          <button onClick={() => {
            sessionStorage.setItem("gameActive", "true");
            router.push("/game")
          }}
            style={{ fontFamily: "DM Mono, monospace", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.6)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "color 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? "rgba(0,245,255,1)" : "rgba(107,77,6,1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "rgba(0,245,255,0.6)" : "rgba(107,77,6,0.6)"; }}
          >
            ← Back to Game
          </button>
        </div>

        {/* Profile header */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s" }}>
          {loadingData ? <div style={{ height: "72px" }} /> : (
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-4 flex-wrap">
                <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700, color: isDark ? "#ffffff" : "#1a1200", lineHeight: 1 }}>
                  {profile?.username}
                </h1>
                {currentSession && (
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: isDark ? "#ffd700" : "#8b6508", textShadow: isDark ? "0 0 16px rgba(255,215,0,0.3)" : "none", lineHeight: 1, paddingBottom: "2px" }}>
                    ${profile?.bankroll?.toLocaleString()}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", letterSpacing: "0.08em" }}>
                Member since {memberSince}
              </span>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="flex flex-wrap gap-4" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.3s ease 0.15s" }}>
          {loadingData ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ flex: "1 1 120px", height: "100px", borderRadius: "20px", backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />
            ))
          ) : (
            <>
              <StatCard label="Hands Played" value={stats?.hands_played?.toLocaleString() ?? "0"} isDark={isDark} color={isDark ? "#00f5ff" : "#8b6508"} delay={150} mounted={mounted} />
              <StatCard label="Win Rate" value={`${winRate}%`} sub={`${stats?.hands_won ?? 0}W — ${stats?.hands_lost ?? 0}L`} isDark={isDark} color={isDark ? "#00f5ff" : "#8b6508"} delay={200} mounted={mounted} />
              <StatCard label="Total Profit" value={formatProfit(totalNetProfit)} isDark={isDark}
                color={totalNetProfit > 0 ? isDark ? "#00f5ff" : "#15803d" : totalNetProfit < 0 ? "#ff2d78" : isDark ? "#00f5ff" : "#8b6508"}
                delay={250} mounted={mounted} />
              <StatCard label="Best Session" value={formatPercent(stats?.best_session_profit_percent)} isDark={isDark}
                color={stats?.best_session_profit_percent > 0 ? isDark ? "#00f5ff" : "#15803d" : stats?.best_session_profit_percent < 0 ? "#ff2d78" : isDark ? "#00f5ff" : "#8b6508"}
                delay={300} mounted={mounted} />
              <StatCard label="Avg Session" value={formatPercent(stats?.avg_session_profit_percent)} isDark={isDark}
                color={stats?.avg_session_profit_percent > 0 ? isDark ? "#00f5ff" : "#15803d" : stats?.avg_session_profit_percent < 0 ? "#ff2d78" : isDark ? "#00f5ff" : "#8b6508"}
                delay={350} mounted={mounted} />
            </>
          )}
        </div>

        {/* Bar chart */}
        {!loadingData && chartData.length > 1 && (
          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s" }}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                  Session Profit % — last {chartData.length} sessions
                </span>
                <div style={{ flex: 1, height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }} />
              </div>
              <div style={{ padding: "20px", borderRadius: "20px", backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`, backdropFilter: "blur(12px)" }}>
                <BarChart data={chartData} isDark={isDark} />
              </div>
            </div>
          </div>
        )}

        {/* Current session — stats only, no button */}
        {!loadingData && currentSession && (
          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.8s ease 0.45s, transform 0.8s ease 0.45s" }}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                  Current Session
                </span>
                <div style={{ flex: 1, height: "1px", backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isDark ? "#00f5ff" : "#15803d", boxShadow: isDark ? "0 0 6px rgba(0,245,255,0.8)" : "none", animation: "pulse-dot 2s ease infinite" }} />
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: isDark ? "rgba(0,245,255,0.6)" : "rgba(21,128,61,0.7)" }}>Live</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div style={{ flex: "1 1 120px", padding: "20px", borderRadius: "16px", backgroundColor: isDark ? "rgba(0,245,255,0.04)" : "rgba(107,77,6,0.04)", border: `1px solid ${isDark ? "rgba(0,245,255,0.1)" : "rgba(107,77,6,0.1)"}` }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", display: "block", marginBottom: "6px" }}>Hands</span>
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: "24px", fontWeight: 700, color: isDark ? "#00f5ff" : "#8b6508" }}>{currentSession.hands_played ?? 0}</span>
                </div>
                <div style={{ flex: "1 1 120px", padding: "20px", borderRadius: "16px", backgroundColor: isDark ? "rgba(0,245,255,0.04)" : "rgba(107,77,6,0.04)", border: `1px solid ${isDark ? "rgba(0,245,255,0.1)" : "rgba(107,77,6,0.1)"}` }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", display: "block", marginBottom: "6px" }}>Profit</span>
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: "24px", fontWeight: 700, color: profitColor(currentSessionProfit) }}>
                    {formatProfit(currentSessionProfit)}
                  </span>
                </div>
                <div style={{ flex: "1 1 120px", padding: "20px", borderRadius: "16px", backgroundColor: isDark ? "rgba(0,245,255,0.04)" : "rgba(107,77,6,0.04)", border: `1px solid ${isDark ? "rgba(0,245,255,0.1)" : "rgba(107,77,6,0.1)"}` }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", display: "block", marginBottom: "6px" }}>Started</span>
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: "18px", fontWeight: 700, color: isDark ? "#00f5ff" : "#8b6508" }}>
                    {new Date(currentSession.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session history */}
        <div className="flex flex-col gap-4" style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s" }}>
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
              <div className="flex items-center px-4" style={{ gap: "12px" }}>
                {["Date", "Hands", "Duration", "Profit", "%"].map((h, i) => (
                  <span key={h} style={{ fontFamily: "DM Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", flex: i === 0 ? 2 : 1, textAlign: i > 0 ? "right" : "left" }}>
                    {h}
                  </span>
                ))}
              </div>

              {sessions.map((session, i) => (
                <div key={session.id} className="flex items-center px-4 py-3 rounded-2xl" style={{
                  gap: "12px",
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 0.5s ease ${0.5 + i * 0.05}s, transform 0.5s ease ${0.5 + i * 0.05}s`,
                }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", flex: 2 }}>
                    {formatDate(session.ended_at)}
                  </span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", flex: 1, textAlign: "right" }}>
                    {session.hands_played ?? 0}
                  </span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", flex: 1, textAlign: "right" }}>
                    {session.started_at ? formatDuration(session.started_at, session.ended_at) : "—"}
                  </span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: profitColor(session.net_profit), flex: 1, textAlign: "right", textShadow: isDark && session.net_profit !== null ? `0 0 8px ${profitColor(session.net_profit)}60` : "none" }}>
                    {formatProfit(session.net_profit)}
                  </span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: profitColor(session.profit_percent), flex: 1, textAlign: "right" }}>
                    {formatPercent(session.profit_percent)}
                  </span>
                </div>
              ))}

              {hasMore && (
                <button onClick={loadMore} disabled={loadingMore}
                  style={{
                    marginTop: "8px", padding: "12px", borderRadius: "999px", width: "100%",
                    fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    cursor: loadingMore ? "not-allowed" : "pointer", background: "transparent",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                    color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                    transition: "all 0.2s ease", opacity: loadingMore ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (loadingMore) return;
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

        {/* End Session or Create Session */}
        {!loadingData && (
          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.8s ease 0.52s, transform 0.8s ease 0.52s" }}>
            {currentSession ? (
              <button
                onClick={handleEndSession}
                style={{
                  width: "100%", padding: "12px", borderRadius: "999px",
                  fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  cursor: "pointer", background: "transparent",
                  border: `1px solid ${isDark ? "rgba(255,45,120,0.25)" : "rgba(180,0,60,0.2)"}`,
                  color: isDark ? "rgba(255,45,120,0.5)" : "rgba(180,0,60,0.5)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#ff2d78";
                  e.currentTarget.style.color = "#ff2d78";
                  e.currentTarget.style.boxShadow = isDark ? "0 0 20px rgba(255,45,120,0.15)" : "0 4px 16px rgba(255,45,120,0.1)";
                  e.currentTarget.style.backgroundColor = "rgba(255,45,120,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,45,120,0.25)" : "rgba(180,0,60,0.2)";
                  e.currentTarget.style.color = isDark ? "rgba(255,45,120,0.5)" : "rgba(180,0,60,0.5)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                End Session
              </button>
            ) : (
              <button
                onClick={() => {
                  sessionStorage.removeItem("gameActive");
                  router.push("/game?fromDashboard=true");
                }}
                style={{
                  width: "100%", padding: "12px", borderRadius: "999px",
                  fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  cursor: "pointer", background: "transparent",
                  border: `1px solid ${isDark ? "rgba(0,245,255,0.25)" : "rgba(107,77,6,0.3)"}`,
                  color: isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.5)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "rgba(0,245,255,0.7)" : "rgba(107,77,6,0.7)";
                  e.currentTarget.style.color = isDark ? "#00f5ff" : "rgba(107,77,6,1)";
                  e.currentTarget.style.boxShadow = isDark ? "0 0 20px rgba(0,245,255,0.15)" : "0 4px 16px rgba(107,77,6,0.1)";
                  e.currentTarget.style.backgroundColor = isDark ? "rgba(0,245,255,0.05)" : "rgba(107,77,6,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "rgba(0,245,255,0.25)" : "rgba(107,77,6,0.3)";
                  e.currentTarget.style.color = isDark ? "rgba(0,245,255,0.5)" : "rgba(107,77,6,0.5)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Create Session
              </button>
            )}
          </div>
        )}

        {/* Logout */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.8s ease 0.55s, transform 0.8s ease 0.55s" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", padding: "12px", borderRadius: "999px",
              fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: "pointer", background: "transparent",
              border: `1px solid ${isDark ? "rgba(255,45,120,0.25)" : "rgba(180,0,60,0.2)"}`,
              color: isDark ? "rgba(255,45,120,0.5)" : "rgba(180,0,60,0.5)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ff2d78";
              e.currentTarget.style.color = "#ff2d78";
              e.currentTarget.style.boxShadow = isDark ? "0 0 20px rgba(255,45,120,0.15)" : "0 4px 16px rgba(255,45,120,0.1)";
              e.currentTarget.style.backgroundColor = "rgba(255,45,120,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDark ? "rgba(255,45,120,0.25)" : "rgba(180,0,60,0.2)";
              e.currentTarget.style.color = isDark ? "rgba(255,45,120,0.5)" : "rgba(180,0,60,0.5)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Log Out
          </button>
        </div>

        {/* Danger zone */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s" }}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,45,120,0.4)" : "rgba(180,0,60,0.4)" }}>
                Danger Zone
              </span>
              <div style={{ flex: 1, height: "1px", backgroundColor: isDark ? "rgba(255,45,120,0.1)" : "rgba(180,0,60,0.1)" }} />
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  width: "100%", padding: "12px", borderRadius: "999px",
                  fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  cursor: "pointer", background: "transparent",
                  border: `1px solid ${isDark ? "rgba(255,45,120,0.15)" : "rgba(180,0,60,0.15)"}`,
                  color: isDark ? "rgba(255,45,120,0.35)" : "rgba(180,0,60,0.35)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,45,120,0.4)";
                  e.currentTarget.style.color = "#ff2d78";
                  e.currentTarget.style.backgroundColor = "rgba(255,45,120,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,45,120,0.15)" : "rgba(180,0,60,0.15)";
                  e.currentTarget.style.color = isDark ? "rgba(255,45,120,0.35)" : "rgba(180,0,60,0.35)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Delete Account
              </button>
            ) : (
              <div style={{ padding: "20px", borderRadius: "20px", backgroundColor: isDark ? "rgba(255,45,120,0.05)" : "rgba(255,45,120,0.03)", border: "1px solid rgba(255,45,120,0.2)" }}>
                <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", marginBottom: "16px", lineHeight: 1.6 }}>
                  This will permanently delete your account, all session history, and lifetime stats. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)}
                    style={{ flex: 1, padding: "12px", borderRadius: "999px", fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", background: "transparent", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", transition: "all 0.2s ease" }}>
                    Cancel
                  </button>
                  <button onClick={handleDeleteAccount} disabled={deleting}
                    style={{ flex: 1, padding: "12px", borderRadius: "999px", fontFamily: "DM Mono, monospace", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: deleting ? "not-allowed" : "pointer", background: "rgba(255,45,120,0.15)", border: "1px solid rgba(255,45,120,0.5)", color: "#ff2d78", transition: "all 0.2s ease", opacity: deleting ? 0.6 : 1 }}>
                    {deleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}