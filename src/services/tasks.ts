import { supabase } from "../lib/supabase";
import { todayKey } from "../utils/helpers";
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

export async function createTask(
  userId: string,
  title: string,
  priority: TaskPriority = "normal",
  category: TaskCategory = "work"
): Promise<Task> {
  const row = { user_id: userId, title, priority, task_date: todayKey() };
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

export async function startTask(taskId: string): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeTask(task: Task): Promise<Task> {
  const completedAt = new Date();
  const durationSeconds = task.started_at
    ? Math.floor((completedAt.getTime() - new Date(task.started_at).getTime()) / 1000)
    : task.duration_seconds;

  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      completed_at: completedAt.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", task.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function reopenTask(taskId: string): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "pending", started_at: null, completed_at: null, duration_seconds: null })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(
  taskId: string,
  patch: Partial<Pick<Task, "title" | "description" | "priority" | "status" | "category">>
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
