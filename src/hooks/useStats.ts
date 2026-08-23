import { useCallback, useEffect, useState } from "react";
import { listSessionsSince } from "../services/workSessions";
import { listTasksSince } from "../services/tasks";
import { listActivitiesSince } from "../services/activities";
import { todayKey } from "../utils/helpers";
import type { ActivityType } from "../types";

export interface Stats {
  weeklyWorkSeconds: number;
  completedTasks: number;
  totalTasks: number;
  studySeconds: number;
  exerciseSeconds: number;
  breakSeconds: number;
}

const EMPTY: Stats = {
  weeklyWorkSeconds: 0,
  completedTasks: 0,
  totalTasks: 0,
  studySeconds: 0,
  exerciseSeconds: 0,
  breakSeconds: 0,
};

function weekAgoKey() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return todayKey(d);
}

export function useStats(userId: string | null, refreshKey: unknown) {
  const [stats, setStats] = useState<Stats>(EMPTY);

  const load = useCallback(async () => {
    if (!userId) return;
    const from = weekAgoKey();

    const [sessions, tasks, activities] = await Promise.all([
      listSessionsSince(userId, from),
      listTasksSince(userId, from),
      listActivitiesSince(userId, from),
    ]);

    const sumByType = (type: ActivityType) =>
      activities
        .filter((a) => a.type === type)
        .reduce((acc, a) => acc + (a.duration_seconds ?? 0), 0);

    setStats({
      weeklyWorkSeconds: sessions.reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0),
      completedTasks: tasks.filter((t) => t.status === "completed").length,
      totalTasks: tasks.length,
      studySeconds: sumByType("study"),
      exerciseSeconds: sumByType("exercise"),
      breakSeconds: sumByType("break"),
    });
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { stats, reload: load };
}
