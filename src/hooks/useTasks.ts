import { useCallback, useEffect, useState } from "react";
import * as taskService from "../services/tasks";
import { secondsSince, todayKey } from "../utils/helpers";
import type { Task } from "../types";

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningSeconds, setRunningSeconds] = useState(0);

  const activeTask = tasks.find((t) => t.status === "in_progress" && t.started_at) ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    taskService
      .listTasksByDate(userId, todayKey())
      .then((rows) => {
        if (!cancelled) setTasks(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!activeTask?.started_at) {
      setRunningSeconds(0);
      return;
    }
    const startedAt = activeTask.started_at;
    const tick = () => setRunningSeconds(secondsSince(startedAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeTask?.id, activeTask?.started_at]);

  const upsert = (row: Task) =>
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === row.id);
      return exists ? prev.map((t) => (t.id === row.id ? row : t)) : [...prev, row];
    });

  const addTask = useCallback(
    async (title: string) => {
      if (!userId || !title.trim()) return;
      upsert(await taskService.createTask(userId, title.trim()));
    },
    [userId]
  );

  const startTask = useCallback(async (taskId: string) => {
    upsert(await taskService.startTask(taskId));
  }, []);

  const completeTask = useCallback(
    async (taskId: string) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return;
      upsert(await taskService.completeTask(target));
    },
    [tasks]
  );

  const reopenTask = useCallback(async (taskId: string) => {
    upsert(await taskService.reopenTask(taskId));
  }, []);

  const removeTask = useCallback(async (taskId: string) => {
    await taskService.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return {
    tasks,
    activeTask,
    runningSeconds,
    loading,
    completedCount,
    totalCount: tasks.length,
    addTask,
    startTask,
    completeTask,
    reopenTask,
    removeTask,
  };
}
