import { useCallback, useEffect, useState } from "react";
import { addDays, eachDayOfInterval } from "date-fns";
import { listSessionsBetween } from "../services/workSessions";
import { listActivitiesBetween } from "../services/activities";
import { listTasksTouchedBetween } from "../services/tasks";
import { listTaskEventsBetween, taskEventsAvailable } from "../services/taskEvents";
import { buildHistory, type DayHistory } from "../utils/history";
import { todayKey } from "../utils/helpers";

/**
 * fromDate ~ toDate (둘 다 포함) 의 날짜별 업무 히스토리.
 * 지난 날짜도 원본 기록에서 그대로 다시 만들기 때문에, 날짜가 바뀌어도 사라지지 않는다.
 */
export function useHistory(userId: string | null, fromDate: string, toDate: string, refreshKey?: unknown) {
  const [days, setDays] = useState<Map<string, DayHistory>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const fromIso = new Date(`${fromDate}T00:00:00`).toISOString();
      const toIso = addDays(new Date(`${toDate}T00:00:00`), 1).toISOString();
      const [sessions, activities, events, tasks] = await Promise.all([
        listSessionsBetween(userId, fromDate, toDate),
        listActivitiesBetween(userId, fromDate, toDate),
        listTaskEventsBetween(userId, fromDate, toDate),
        listTasksTouchedBetween(userId, fromIso, toIso),
      ]);
      const keys = eachDayOfInterval({
        start: new Date(`${fromDate}T00:00:00`),
        end: new Date(`${toDate}T00:00:00`),
      }).map((d) => todayKey(d));
      setDays(buildHistory(keys, { sessions, activities, events, tasks }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "기록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [userId, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { days, loading, error, reload: load, eventsAvailable: taskEventsAvailable() };
}
