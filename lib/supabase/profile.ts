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
  const netProfit = endingBankroll - startingBankroll;
  const profitPercent = parseFloat(((netProfit / startingBankroll) * 100).toFixed(2));

  await supabase
    .from("session_stats")
    .update({
      ended_at: new Date().toISOString(),
      ending_bankroll: endingBankroll,
      net_profit: netProfit,
      profit_percent: profitPercent,
    })
    .eq("id", sessionId);
}