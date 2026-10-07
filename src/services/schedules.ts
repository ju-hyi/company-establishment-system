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
    .lte("schedule_date", date)
    .or(`end_date.gte.${date},and(end_date.is.null,schedule_date.eq.${date})`)
    .order("start_time", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function listSchedulesInRange(
  userId: string,
  fromDate: string,
  toDate: string
): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("user_id", userId)
    // 기간이 겹치는 일정: 시작일 <= toDate 이고 (종료일 또는 시작일) >= fromDate
    .lte("schedule_date", toDate)
    .or(`end_date.gte.${fromDate},and(end_date.is.null,schedule_date.gte.${fromDate})`)
    .order("schedule_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function createSchedule(
  userId: string,
  input: {
    title: string;
    schedule_date: string;
    end_date?: string | null;
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
      end_date: input.end_date || null,
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
  patch: Partial<
    Pick<Schedule, "title" | "schedule_date" | "end_date" | "start_time" | "end_time" | "category" | "memo">
  >
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
