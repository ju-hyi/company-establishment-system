import { supabase } from "../lib/supabase";
import { todayKey } from "../utils/helpers";
import { workSecondsBetween, type Lunch } from "../utils/lunch";
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

/** 퇴근 — 근무 시간은 출근~퇴근에서 점심시간과 겹친 만큼을 뺀 값으로 저장한다. */
export async function checkOut(session: WorkSession, lunch: Lunch | null): Promise<WorkSession> {
  const endedAt = new Date();
  const durationSeconds = workSecondsBetween(session.check_in_at, endedAt.getTime(), lunch);

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

/** fromDate ~ toDate (둘 다 포함) 사이의 근무 기록 */
export async function listSessionsBetween(
  userId: string,
  fromDate: string,
  toDate: string
): Promise<WorkSession[]> {
  const { data, error } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("work_date", fromDate)
    .lte("work_date", toDate)
    .order("check_in_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
