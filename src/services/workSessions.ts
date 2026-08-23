import { supabase } from "../lib/supabase";
import { todayKey } from "../utils/helpers";
import type { WorkSession } from "../types";

export async function getOpenSession(userId: string): Promise<WorkSession | null> {
  const { data, error } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function checkIn(userId: string): Promise<WorkSession> {
  const { data, error } = await supabase
    .from("work_sessions")
    .insert({
      user_id: userId,
      work_date: todayKey(),
      check_in_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function checkOut(session: WorkSession): Promise<WorkSession> {
  const endedAt = new Date();
  const durationSeconds = Math.floor(
    (endedAt.getTime() - new Date(session.check_in_at).getTime()) / 1000
  );

  const { data, error } = await supabase
    .from("work_sessions")
    .update({
      check_out_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", session.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listSessionsSince(
  userId: string,
  fromDate: string
): Promise<WorkSession[]> {
  const { data, error } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("work_date", fromDate)
    .order("work_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
