import { useCallback, useEffect, useState } from "react";
import { endOfMonth, startOfMonth } from "date-fns";
import * as scheduleService from "../services/schedules";
import { todayKey } from "../utils/helpers";
import type { Schedule, ScheduleCategory } from "../types";

export interface ScheduleInput {
  title: string;
  schedule_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  category: ScheduleCategory;
  memo: string | null;
}

const byDateTime = (a: Schedule, b: Schedule) =>
  a.schedule_date.localeCompare(b.schedule_date) ||
  (a.start_time ?? "99").localeCompare(b.start_time ?? "99");

// 여러 날 일정은 기간이 이 달과 조금이라도 겹치면 포함한다.
const inRange = (s: Schedule, from: string, to: string) =>
  s.schedule_date <= to && (s.end_date ?? s.schedule_date) >= from;

/** 캘린더 페이지용 — 한 달치 일정을 읽고 추가/수정/삭제한다. */
export function useMonthSchedules(userId: string | null, month: Date) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const from = todayKey(startOfMonth(month));
  const to = todayKey(endOfMonth(month));

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);

    scheduleService
      .listSchedulesInRange(userId, from, to)
      .then((rows) => {
        if (!cancelled) setSchedules(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, from, to]);

  const add = useCallback(
    async (input: ScheduleInput) => {
      if (!userId || !input.title.trim()) return;
      const created = await scheduleService.createSchedule(userId, {
        ...input,
        title: input.title.trim(),
      });
      if (inRange(created, from, to)) setSchedules((prev) => [...prev, created].sort(byDateTime));
    },
    [userId, from, to]
  );

  const update = useCallback(
    async (id: string, input: ScheduleInput) => {
      const updated = await scheduleService.updateSchedule(id, {
        ...input,
        title: input.title.trim(),
      });
      setSchedules((prev) =>
        (inRange(updated, from, to)
          ? prev.map((s) => (s.id === id ? updated : s))
          : prev.filter((s) => s.id !== id)
        ).sort(byDateTime)
      );
    },
    [from, to]
  );

  const remove = useCallback(async (id: string) => {
    await scheduleService.deleteSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { schedules, loading, add, update, remove };
}
