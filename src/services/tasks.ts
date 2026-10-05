import { supabase } from "../lib/supabase";
import { todayKey } from "../utils/helpers";
import { recordTaskEvent } from "./taskEvents";
import type { Task, TaskCategory, TaskPriority } from "../types";

/** 0003 마이그레이션 전이라 category 컬럼이 없을 때 PostgREST 가 돌려주는 오류 */
const isMissingCategory = (error: { code?: string; message?: string }) =>
  error.code === "PGRST204" || /category/.test(error.message ?? "");

export const MIGRATION_NEEDED =
  "업무 구분을 저장하려면 DB 업데이트(0003 마이그레이션)가 필요해요. 회사 업무로는 계속 등록할 수 있어요.";

/** category 가 없는 예전 행은 회사 업무로 본다. */
export const categoryOf = (task: Task): TaskCategory => task.category ?? "work";

export async function listTasksByDate(userId: string, date: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("task_date", date)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * 지금 할 일 목록에 필요한 업무 — 오늘(또는 이후) 날짜의 업무, 끝나지 않은 업무(날짜와 상관없이),
 * 오늘 완료한 업무. 날짜가 바뀌어도 끝나지 않은 업무는 계속 불러온다.
 */
export async function listCurrentTasks(userId: string, today: string): Promise<Task[]> {
  const startOfToday = new Date(`${today}T00:00:00`).toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .or(`task_date.gte.${today},status.neq.completed,completed_at.gte.${startOfToday}`)
    .order("task_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** 시작 또는 완료 시각이 [fromIso, toIso) 안에 있는 업무 — 진행 기록이 없는 예전 업무의 히스토리용 */
export async function listTasksTouchedBetween(
  userId: string,
  fromIso: string,
  toIso: string
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .or(
      `and(started_at.gte.${fromIso},started_at.lt.${toIso}),and(completed_at.gte.${fromIso},completed_at.lt.${toIso})`
    );

  if (error) throw error;
  return data ?? [];
}

/** 지금까지 실제로 일한 시간(초) — 이전 구간 합계 + 진행중이면 지금 구간 */
export function workedSeconds(task: Task, now: number = Date.now()): number {
  const base = task.duration_seconds ?? 0;
  if (task.status !== "in_progress" || !task.started_at) return base;
  return base + Math.max(0, Math.floor((now - new Date(task.started_at).getTime()) / 1000));
}

export async function listTasksSince(userId: string, fromDate: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .gte("task_date", fromDate)
    .order("task_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** 기간 — 시작일(task_date) ~ 종료일(due_date). 종료일이 없으면 하루짜리 업무. */
export interface TaskPeriod {
  task_date: string;
  due_date: string | null;
}

export async function createTask(
  userId: string,
  title: string,
  priority: TaskPriority = "normal",
  category: TaskCategory = "work",
  period?: TaskPeriod
): Promise<Task> {
  const row = {
    user_id: userId,
    title,
    priority,
    task_date: period?.task_date ?? todayKey(),
    due_date: period?.due_date ?? null,
  };
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...row, category })
    .select()
    .single();

  if (error && isMissingCategory(error)) {
    // 마이그레이션 전: 회사 업무는 예전 방식 그대로 저장한다.
    if (category !== "work") throw new Error(MIGRATION_NEEDED);
    const retry = await supabase.from("tasks").insert(row).select().single();
    if (retry.error) throw retry.error;
    return retry.data;
  }
  if (error) throw error;
  return data;
}

async function saveTask(taskId: string, patch: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase.from("tasks").update(patch).eq("id", taskId).select().single();
  if (error) throw error;
  return data;
}

/**
 * 시작 / 재시작. 이전에 일한 시간(duration_seconds)은 그대로 두고 지금 구간을 started_at 부터 잰다.
 * 처음 시작이면 "시작", 중지했거나 되돌렸던 업무면 "재시작" 으로 기록한다.
 */
export async function startTask(task: Task): Promise<Task> {
  const now = new Date().toISOString();
  const wasCompleted = task.status === "completed";
  const resumed = wasCompleted || task.started_at !== null || (task.duration_seconds ?? 0) > 0;
  const saved = await saveTask(task.id, {
    status: "in_progress",
    started_at: now,
    completed_at: null,
    duration_seconds: task.duration_seconds ?? 0,
  });
  if (wasCompleted) await recordTaskEvent(saved, "reopen", now);
  await recordTaskEvent(saved, resumed ? "resume" : "start", now);
  return saved;
}

/** 중지 — 완료가 아니다. 지금 구간의 시간을 합계에 더하고 상태를 '중지(on_hold)' 로 둔다. */
export async function pauseTask(task: Task): Promise<Task> {
  if (task.status !== "in_progress") return saveTask(task.id, { status: "on_hold" });
  const now = new Date();
  const saved = await saveTask(task.id, {
    status: "on_hold",
    duration_seconds: workedSeconds(task, now.getTime()),
  });
  await recordTaskEvent(saved, "pause", now.toISOString());
  return saved;
}

/** 완료 — 실제 업무시간 = 이전 구간 합계 + (진행중이었다면) 지금 구간 */
export async function completeTask(task: Task): Promise<Task> {
  const completedAt = new Date();
  const durationSeconds =
    task.status === "in_progress" || task.duration_seconds !== null
      ? workedSeconds(task, completedAt.getTime())
      : null;

  const saved = await saveTask(task.id, {
    status: "completed",
    completed_at: completedAt.toISOString(),
    duration_seconds: durationSeconds,
  });
  await recordTaskEvent(saved, "complete", completedAt.toISOString());
  return saved;
}

/**
 * 되돌리기(예정으로) — 완료 시각만 지운다. 이미 일한 시간과 진행 기록은 남겨둔다.
 * (이전에는 시작 시각 · 소요시간까지 지워서 그날 기록이 사라졌다)
 */
export async function reopenTask(task: Task): Promise<Task> {
  const now = new Date();
  const saved = await saveTask(task.id, {
    status: "pending",
    completed_at: null,
    duration_seconds:
      task.status === "in_progress" ? workedSeconds(task, now.getTime()) : task.duration_seconds,
  });
  if (task.status === "completed") await recordTaskEvent(saved, "reopen", now.toISOString());
  else if (task.status === "in_progress") await recordTaskEvent(saved, "pause", now.toISOString());
  return saved;
}

export async function updateTask(
  taskId: string,
  patch: Partial<
    Pick<Task, "title" | "description" | "priority" | "status" | "category" | "task_date" | "due_date">
  >
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .select()
    .single();

  if (error && patch.category !== undefined && isMissingCategory(error)) {
    if (patch.category !== "work") throw new Error(MIGRATION_NEEDED);
    const { category: _omit, ...rest } = patch;
    return updateTask(taskId, rest);
  }
  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}
