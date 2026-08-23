import { supabase } from "../lib/supabase";
import type { Schedule, ScheduleCategory } from "../types";

export async function listSchedulesByDate(
  userId: string,
  date: string
): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("user_id", userId)
    .eq("schedule_date", date)
    .order("start_time", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function createSchedule(
  userId: string,
  input: {
    title: string;
    schedule_date: string;
    start_time?: string | null;
    end_time?: string | null;
    category?: ScheduleCategory;
    memo?: string | null;
  }
): Promise<Schedule> {
  const { data, error } = await supabase
    .from("schedules")
    .insert({
      user_id: userId,
      title: input.title,
      schedule_date: input.schedule_date,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      category: input.category ?? "work",
      memo: input.memo ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSchedule(
  scheduleId: string,
  patch: Partial<Pick<Schedule, "title" | "start_time" | "end_time" | "category" | "memo">>
): Promise<Schedule> {
  const { data, error } = await supabase
    .from("schedules")
    .update(patch)
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase.from("schedules").delete().eq("id", scheduleId);
  if (error) throw error;
}
