import { useCallback, useEffect, useState } from "react";
import * as scheduleService from "../services/schedules";
import { todayKey } from "../utils/helpers";
import type { Schedule } from "../types";

export function useSchedules(userId: string | null, date: string = todayKey()) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    scheduleService
      .listSchedulesByDate(userId, date)
      .then((rows) => {
        if (!cancelled) setSchedules(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, date, reloadKey]);

  /** 캘린더 페이지에서 일정을 바꾼 뒤 오늘 일정을 다시 읽는다. */
  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  const addSchedule = useCallback(
    async (title: string, startTime?: string) => {
      if (!userId || !title.trim()) return;
      const created = await scheduleService.createSchedule(userId, {
        title: title.trim(),
        schedule_date: date,
        start_time: startTime || null,
      });
      setSchedules((prev) =>
        [...prev, created].sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""))
      );
    },
    [userId, date]
  );

  const renameSchedule = useCallback(async (id: string, title: string) => {
    const updated = await scheduleService.updateSchedule(id, { title });
    setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }, []);

  const removeSchedule = useCallback(async (id: string) => {
    await scheduleService.deleteSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { schedules, loading, reload, addSchedule, renameSchedule, removeSchedule };
}
