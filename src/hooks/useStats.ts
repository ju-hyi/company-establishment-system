import { useCallback, useEffect, useState } from "react";
import { listSessionsSince } from "../services/workSessions";
import { categoryOf, listTasksSince } from "../services/tasks";
import { listActivitiesSince } from "../services/activities";
import { todayKey } from "../utils/helpers";
import type { Activity, ActivityType, Task, TaskCategory, WorkSession } from "../types";

/** 하루 단위 집계 (최근 7일, 오래된 날 → 오늘 순) */
export interface DayStat {
  date: string;
  workSeconds: number;
  completedTasks: number;
  totalTasks: number;
  studySeconds: number;
  exerciseSeconds: number;
  breakSeconds: number;
  personalSeconds: number;
}

/** 오늘 있었던 일 — 원본 기록의 시각으로 만든다. */
export interface TimelineEntry {
  id: string;
  at: string;
  label: string;
  kind: "work" | "task" | "activity";
}

export interface Stats {
  weeklyWorkSeconds: number;
  completedTasks: number;
  totalTasks: number;
  studySeconds: number;
  exerciseSeconds: number;
  breakSeconds: number;
  personalSeconds: number;
  /** 완료한 업무의 실제 소요시간 합 */
  taskSeconds: number;
  /** 위 합계를 업무 구분별로 나눈 값 */
  taskSecondsByCategory: Record<TaskCategory, number>;
  daily: DayStat[];
  timeline: TimelineEntry[];
  sessions: WorkSession[];
  tasks: Task[];
  activities: Activity[];
}

const EMPTY: Stats = {
  weeklyWorkSeconds: 0,
  completedTasks: 0,
  totalTasks: 0,
  studySeconds: 0,
  exerciseSeconds: 0,
  breakSeconds: 0,
  personalSeconds: 0,
  taskSeconds: 0,
  taskSecondsByCategory: { work: 0, personal: 0, mx_instagram: 0 },
  daily: [],
  timeline: [],
  sessions: [],
  tasks: [],
  activities: [],
};

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  study: "공부",
  exercise: "운동",
  break: "휴식",
  personal: "개인일",
};

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return todayKey(d);
  });
}

function buildTimeline(
  today: string,
  sessions: WorkSession[],
  tasks: Task[],
  activities: Activity[]
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  sessions
    .filter((s) => s.work_date === today)
    .forEach((s) => {
      entries.push({ id: `${s.id}-in`, at: s.check_in_at, label: "출근", kind: "work" });
      if (s.check_out_at)
        entries.push({ id: `${s.id}-out`, at: s.check_out_at, label: "퇴근", kind: "work" });
    });

  tasks
    .filter((t) => t.task_date === today)
    .forEach((t) => {
      if (t.started_at)
        entries.push({ id: `${t.id}-s`, at: t.started_at, label: `${t.title} 시작`, kind: "task" });
      if (t.completed_at)
        entries.push({ id: `${t.id}-c`, at: t.completed_at, label: `${t.title} 완료`, kind: "task" });
    });

  activities
    .filter((a) => a.activity_date === today)
    .forEach((a) => {
      const name = ACTIVITY_LABEL[a.type];
      entries.push({ id: `${a.id}-s`, at: a.started_at, label: `${name} 시작`, kind: "activity" });
      if (a.ended_at)
        entries.push({ id: `${a.id}-e`, at: a.ended_at, label: `${name} 종료`, kind: "activity" });
    });

  return entries.sort((a, b) => a.at.localeCompare(b.at));
}

export function useStats(userId: string | null, refreshKey: unknown) {
  const [stats, setStats] = useState<Stats>(EMPTY);

  const load = useCallback(async () => {
    if (!userId) return;
    const days = lastSevenDays();
    const from = days[0];

    const [sessions, tasks, activities] = await Promise.all([
      listSessionsSince(userId, from),
      listTasksSince(userId, from),
      listActivitiesSince(userId, from),
    ]);

    const sumByType = (list: Activity[], type: ActivityType) =>
      list.filter((a) => a.type === type).reduce((acc, a) => acc + (a.duration_seconds ?? 0), 0);

    const daily: DayStat[] = days.map((date) => {
      const dayTasks = tasks.filter((t) => t.task_date === date);
      const dayActs = activities.filter((a) => a.activity_date === date);
      return {
        date,
        workSeconds: sessions
          .filter((s) => s.work_date === date)
          .reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0),
        completedTasks: dayTasks.filter((t) => t.status === "completed").length,
        totalTasks: dayTasks.length,
        studySeconds: sumByType(dayActs, "study"),
        exerciseSeconds: sumByType(dayActs, "exercise"),
        breakSeconds: sumByType(dayActs, "break"),
        personalSeconds: sumByType(dayActs, "personal"),
      };
    });

    setStats({
      weeklyWorkSeconds: sessions.reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0),
      completedTasks: tasks.filter((t) => t.status === "completed").length,
      totalTasks: tasks.length,
      studySeconds: sumByType(activities, "study"),
      exerciseSeconds: sumByType(activities, "exercise"),
      breakSeconds: sumByType(activities, "break"),
      personalSeconds: sumByType(activities, "personal"),
      taskSeconds: tasks
        .filter((t) => t.status === "completed")
        .reduce((acc, t) => acc + (t.duration_seconds ?? 0), 0),
      taskSecondsByCategory: tasks
        .filter((t) => t.status === "completed")
        .reduce(
          (acc, t) => {
            acc[categoryOf(t)] += t.duration_seconds ?? 0;
            return acc;
          },
          { work: 0, personal: 0, mx_instagram: 0 } as Record<TaskCategory, number>
        ),
      daily,
      timeline: buildTimeline(todayKey(), sessions, tasks, activities),
      sessions,
      tasks,
      activities,
    });
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { stats, reload: load };
}
