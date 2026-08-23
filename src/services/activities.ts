import { supabase } from "../lib/supabase";
import { todayKey } from "../utils/helpers";
import type { Activity, ActivityType } from "../types";

export async function getOpenActivity(userId: string): Promise<Activity | null> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function startActivity(
  userId: string,
  type: ActivityType
): Promise<Activity> {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: userId,
      type,
      activity_date: todayKey(),
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endActivity(activity: Activity): Promise<Activity> {
  const endedAt = new Date();
  const durationSeconds = Math.floor(
    (endedAt.getTime() - new Date(activity.started_at).getTime()) / 1000
  );

  const { data, error } = await supabase
    .from("activities")
    .update({ ended_at: endedAt.toISOString(), duration_seconds: durationSeconds })
    .eq("id", activity.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listActivitiesSince(
  userId: string,
  fromDate: string
): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", fromDate)
    .order("started_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
