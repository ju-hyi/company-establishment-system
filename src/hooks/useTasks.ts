import { useCallback, useEffect, useState } from "react";
import * as taskService from "../services/tasks";
import { secondsSince, todayKey } from "../utils/helpers";
import type { Task, TaskCategory, TaskPriority, TaskStatus } from "../types";

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
    async (
      title: string,
      priority?: TaskPriority,
      category?: TaskCategory,
      status: TaskStatus = "pending"
    ) => {
      if (!userId || !title.trim()) return;
      let created = await taskService.createTask(userId, title.trim(), priority, category);
      // 등록할 때 고른 상태도 시간 기록이 맞도록 전용 서비스로 반영한다.
      if (status === "in_progress") created = await taskService.startTask(created.id);
      else if (status === "completed") created = await taskService.completeTask(created);
      else if (status === "on_hold") created = await taskService.updateTask(created.id, { status });
      upsert(created);
    },
    [userId]
  );

  const updateTask = useCallback(
    async (taskId: string, patch: Parameters<typeof taskService.updateTask>[1]) => {
      upsert(await taskService.updateTask(taskId, patch));
    },
    []
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

  /** 상태 변경 — 시작/완료/되돌리기는 시간 기록이 따라가도록 전용 서비스를 쓴다. */
  const setStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target || target.status === status) return;
      if (status === "in_progress") upsert(await taskService.startTask(taskId));
      else if (status === "completed") upsert(await taskService.completeTask(target));
      else if (status === "pending") upsert(await taskService.reopenTask(taskId));
      else upsert(await taskService.updateTask(taskId, { status }));
    },
    [tasks]
  );

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
    updateTask,
    setStatus,
    startTask,
    completeTask,
    reopenTask,
    removeTask,
  };
}
