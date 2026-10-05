import { useCallback, useEffect, useState } from "react";
import { listSessionsSince } from "../services/workSessions";
import { categoryOf, listTasksSince, listTasksTouchedBetween } from "../services/tasks";
import { listActivitiesSince } from "../services/activities";
import { listTaskEventsBetween } from "../services/taskEvents";
import { todayKey } from "../utils/helpers";
import { ACTIVITY_LABEL, buildHistory, type TimelineEntry } from "../utils/history";
import { useToday } from "./useToday";
import type { Activity, ActivityType, Task, TaskCategory, WorkSession } from "../types";

export { ACTIVITY_LABEL, type TimelineEntry };

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

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return todayKey(d);
  });
}

export function useStats(userId: string | null, refreshKey: unknown) {
  const [stats, setStats] = useState<Stats>(EMPTY);
  // 자정이 지나면 오늘 기준으로 다시 불러온다
  const today = useToday();

  const load = useCallback(async () => {
    if (!userId) return;
    const days = lastSevenDays();
    const from = days[0];

    const todayStart = new Date(`${today}T00:00:00`);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [sessions, tasks, activities, todayEvents, todayTouched] = await Promise.all([
      listSessionsSince(userId, from),
      listTasksSince(userId, from),
      listActivitiesSince(userId, from),
      listTaskEventsBetween(userId, today, today),
      listTasksTouchedBetween(userId, todayStart.toISOString(), tomorrowStart.toISOString()),
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
      // 업무 히스토리 — 오늘 실제로 한 일 (업무 날짜가 아니라 시작 · 중지 · 완료한 시각 기준)
      timeline:
        buildHistory([today], {
          sessions,
          activities,
          events: todayEvents,
          tasks: todayTouched,
        }).get(today)?.timeline ?? [],
      sessions,
      tasks,
      activities,
    });
  }, [userId, today]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { stats, reload: load };
}
