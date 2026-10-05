import { supabase } from "../lib/supabase";
import { todayKey } from "../utils/helpers";
import type { Task, TaskEvent, TaskEventType } from "../types";

/**
 * 업무 진행 기록(task_events) — 0005 마이그레이션.
 *
 * 기록은 추가만 하고 고치지 않는다. 업무 상태 저장(tasks)이 먼저이고, 기록 저장은 그 다음이다.
 * 마이그레이션 전이라 테이블이 없으면 기록 없이 동작하고, 히스토리는 tasks 의 시각으로 보여준다.
 */

/** 테이블이 없을 때 PostgREST / Postgres 가 돌려주는 오류 */
const isMissingTable = (error: { code?: string; message?: string }) =>
  error.code === "PGRST205" || error.code === "42P01" || /task_events/.test(error.message ?? "");

let available: boolean | null = null;

/** 0005 마이그레이션이 적용되어 있는지 (한 번이라도 조회/저장해본 뒤에 알 수 있다) */
export const taskEventsAvailable = () => available;

export async function recordTaskEvent(task: Task, type: TaskEventType, at: string): Promise<void> {
  if (available === false) return;
  const { error } = await supabase.from("task_events").insert({
    user_id: task.user_id,
    task_id: task.id,
    task_title: task.title,
    task_category: task.category ?? "work",
    event_type: type,
    event_date: todayKey(new Date(at)),
    occurred_at: at,
  });
  if (error) {
    if (isMissingTable(error)) {
      available = false;
      return;
    }
    // 상태는 이미 저장됐다. 기록 실패로 화면 동작을 막지 않는다.
    console.warn("업무 진행 기록을 저장하지 못했어요", error);
    return;
  }
  available = true;
}

/** fromDate ~ toDate (둘 다 포함) 사이의 기록, 시간순 */
export async function listTaskEventsBetween(
  userId: string,
  fromDate: string,
  toDate: string
): Promise<TaskEvent[]> {
  if (available === false) return [];
  const { data, error } = await supabase
    .from("task_events")
    .select("*")
    .eq("user_id", userId)
    .gte("event_date", fromDate)
    .lte("event_date", toDate)
    .order("occurred_at", { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      available = false;
      return [];
    }
    throw error;
  }
  available = true;
  return data ?? [];
}
