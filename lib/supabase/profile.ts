import { createClient } from "@/lib/supabase/client";

export interface Profile {
  user_id: string;
  username: string;
  bankroll: number;
}

export interface SessionStats {
  id: string;
  user_id: string;
  starting_bankroll: number;
  ending_bankroll: number | null;
  net_profit: number | null;
  profit_percent: number | null;
  hands_played: number;
  hands_won: number;
  started_at: string;
  ended_at: string | null;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function saveBankroll(bankroll: number): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ bankroll })
    .eq("user_id", user.id);
}

export async function getOpenSession(): Promise<SessionStats | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("session_stats")
    .select("*")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as SessionStats;
}

export async function createNewSession(startingBankroll: number): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("session_stats")
    .insert({
      user_id: user.id,
      starting_bankroll: startingBankroll,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function closeSession(
  sessionId: string,
  endingBankroll: number,
  startingBankroll: number,
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const netProfit = endingBankroll - startingBankroll;
  const profitPercent = parseFloat(((netProfit / startingBankroll) * 100).toFixed(2));

  // close the session
  await supabase
    .from("session_stats")
    .update({
      ended_at: new Date().toISOString(),
      ending_bankroll: endingBankroll,
      net_profit: netProfit,
      profit_percent: profitPercent,
    })
    .eq("id", sessionId);

  // fetch all closed sessions including the one we just closed
  const { data: allSessions } = await supabase
    .from("session_stats")
    .select("profit_percent")
    .eq("user_id", user.id)
    .not("profit_percent", "is", null);

  if (!allSessions || allSessions.length === 0) return;

  const percents = allSessions.map((s) => parseFloat(s.profit_percent));
  const best = Math.max(...percents);
  const avg = parseFloat((percents.reduce((a, b) => a + b, 0) / percents.length).toFixed(2));

  await supabase
    .from("lifetime_stats")
    .update({
      best_session_profit_percent: best,
      avg_session_profit_percent: avg,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
}

export async function updateSessionStats(
  sessionId: string,
  handsPlayed: number,
  handsWon: number,
): Promise<void> {
  const supabase = createClient();
  const { data: current } = await supabase
    .from("session_stats")
    .select("hands_played, hands_won")
    .eq("id", sessionId)
    .single();

  if (!current) return;

  await supabase
    .from("session_stats")
    .update({
      hands_played: (current.hands_played ?? 0) + handsPlayed,
      hands_won: (current.hands_won ?? 0) + handsWon,
    })
    .eq("id", sessionId);
}

export async function updateLifetimeStats(
  handsPlayed: number,
  handsWon: number,
  handsLost: number,
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: current } = await supabase
    .from("lifetime_stats")
    .select("hands_played, hands_won, hands_lost")
    .eq("user_id", user.id)
    .single();

  if (!current) return;

  await supabase
    .from("lifetime_stats")
    .update({
      hands_played: (current.hands_played ?? 0) + handsPlayed,
      hands_won: (current.hands_won ?? 0) + handsWon,
      hands_lost: (current.hands_lost ?? 0) + handsLost,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
}