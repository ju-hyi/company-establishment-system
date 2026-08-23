import { supabase } from "../lib/supabase";
import { todayKey } from "../utils/helpers";
import type { Task, TaskPriority } from "../types";

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
  priority: TaskPriority = "normal"
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ user_id: userId, title, priority, task_date: todayKey() })
    .select()
    .single();

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

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}
