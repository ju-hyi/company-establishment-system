import { useCallback, useEffect, useState } from "react";
import * as workSessions from "../services/workSessions";
import { isLunchTime, workSecondsBetween, type Lunch } from "../utils/lunch";
import type { WorkSession } from "../types";

/**
 * 출퇴근 세션. 경과 시간은 점심시간을 뺀 근무 시간이고, 점심시간 동안은 멈춰 있다.
 * lunch 가 null 이면 점심시간을 쓰지 않는다.
 */
export function useWorkSession(userId: string | null, lunch: Lunch | null) {
  const [session, setSession] = useState<WorkSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [onLunch, setOnLunch] = useState(false);
  // 점심시간 설정이 바뀌어도 타이머를 새로 만들지 않도록 문자열로 비교한다.
  const lunchKey = lunch ? `${lunch.start}-${lunch.end}` : "";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    workSessions
      .getOpenSession(userId)
      .then((open) => {
        if (cancelled) return;
        setSession(open);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!session) return;
    const current: Lunch | null = lunchKey ? { start: lunchKey.slice(0, 5), end: lunchKey.slice(6) } : null;
    const tick = () => {
      const now = new Date();
      setElapsedSeconds(workSecondsBetween(session.check_in_at, now.getTime(), current));
      setOnLunch(isLunchTime(now, current));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session, lunchKey]);

  const checkIn = useCallback(async () => {
    if (!userId) return;
    const created = await workSessions.checkIn(userId);
    setSession(created);
  }, [userId]);

  const checkOut = useCallback(async () => {
    if (!session) return;
    await workSessions.checkOut(session, lunch);
    setSession(null);
    setElapsedSeconds(0);
    setOnLunch(false);
  }, [session, lunch]);

  return {
    session,
    isCheckedIn: session !== null,
    /** 출근한 상태에서 지금이 점심시간인지 */
    onLunch: session !== null && onLunch,
    lunch,
    elapsedSeconds,
    loading,
    checkIn,
    checkOut,
  };
}
