import { useCallback, useEffect, useState } from "react";
import * as taskService from "../services/tasks";
import { todayKey } from "../utils/helpers";
import { useToday } from "./useToday";
import type { Task, TaskCategory, TaskPriority, TaskStatus } from "../types";

/** 완료 시각이 그날인지 */
const completedOn = (task: Task, day: string) =>
  task.completed_at !== null && todayKey(new Date(task.completed_at)) === day;

/**
 * 상태 변경 — 시간 기록이 따라가도록 상태마다 전용 서비스를 쓴다.
 *   진행중 → 시작/재시작 · 중지(on_hold) → 지금 구간을 합계에 더함 · 완료 → 합계 확정 · 예정 → 되돌리기
 */
function transition(task: Task, status: TaskStatus): Promise<Task> {
  if (status === "in_progress") return taskService.startTask(task);
  if (status === "completed") return taskService.completeTask(task);
  if (status === "on_hold") return taskService.pauseTask(task);
  return taskService.reopenTask(task);
}

export function useTasks(userId: string | null) {
  const today = useToday();
  const [all, setAll] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningSeconds, setRunningSeconds] = useState(0);

  /**
   * 지금 할 일 — 기간이 시작된 업무 중 끝나지 않은 것 + 오늘 날짜 업무 + 오늘 완료한 업무.
   * 끝나지 않은 업무는 날짜가 지나도 사라지지 않고 계속 여기 남는다.
   */
  const tasks = all.filter((t) => t.task_date <= today || completedOn(t, today));
  /** 기간이 아직 시작되지 않은 업무 */
  const upcoming = all.filter(
    (t) => t.task_date > today && t.status !== "completed" && !completedOn(t, today)
  );

  const activeTask = tasks.find((t) => t.status === "in_progress" && t.started_at) ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    taskService
      .listCurrentTasks(userId, today)
      .then((rows) => {
        if (!cancelled) setAll(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, today]);

  // 진행중 타이머 = 이전 구간 합계 + 지금 구간 (중지 후 재시작해도 이어서 센다)
  useEffect(() => {
    if (!activeTask?.started_at) {
      setRunningSeconds(0);
      return;
    }
    const task = activeTask;
    const tick = () => setRunningSeconds(taskService.workedSeconds(task));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeTask?.id, activeTask?.started_at, activeTask?.duration_seconds]);

  const upsert = (row: Task) =>
    setAll((prev) => {
      const exists = prev.some((t) => t.id === row.id);
      return exists ? prev.map((t) => (t.id === row.id ? row : t)) : [...prev, row];
    });

  const find = useCallback((taskId: string) => all.find((t) => t.id === taskId), [all]);

  const addTask = useCallback(
    async (
      title: string,
      priority?: TaskPriority,
      category?: TaskCategory,
      status: TaskStatus = "pending",
      period?: taskService.TaskPeriod
    ) => {
      if (!userId || !title.trim()) return;
      let created = await taskService.createTask(userId, title.trim(), priority, category, period);
      // 등록할 때 고른 상태도 시간 기록이 맞도록 전용 서비스로 반영한다.
      if (status !== "pending") created = await transition(created, status);
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

  const setStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      const target = find(taskId);
      if (!target || target.status === status) return;
      upsert(await transition(target, status));
    },
    [find]
  );

  /** 수정 폼 저장 — 업무명 · 기간 등을 먼저 저장하고, 상태가 바뀌었으면 시간 기록과 함께 이어서 반영한다. */
  const editTask = useCallback(
    async (taskId: string, patch: Parameters<typeof taskService.updateTask>[1], status: TaskStatus) => {
      const row = await taskService.updateTask(taskId, patch);
      upsert(row.status === status ? row : await transition(row, status));
    },
    []
  );

  const removeTask = useCallback(async (taskId: string) => {
    await taskService.deleteTask(taskId);
    setAll((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return {
    tasks,
    upcoming,
    today,
    activeTask,
    runningSeconds,
    loading,
    completedCount,
    totalCount: tasks.length,
    addTask,
    updateTask,
    editTask,
    setStatus,
    removeTask,
  };
}
