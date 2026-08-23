import { useCallback, useEffect, useState } from "react";
import * as workSessions from "../services/workSessions";
import { secondsSince } from "../utils/helpers";
import type { WorkSession } from "../types";

export function useWorkSession(userId: string | null) {
  const [session, setSession] = useState<WorkSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    workSessions
      .getOpenSession(userId)
      .then((open) => {
        if (cancelled) return;
        setSession(open);
        setElapsedSeconds(open ? secondsSince(open.check_in_at) : 0);
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
    const tick = () => setElapsedSeconds(secondsSince(session.check_in_at));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session]);

  const checkIn = useCallback(async () => {
    if (!userId) return;
    const created = await workSessions.checkIn(userId);
    setSession(created);
  }, [userId]);

  const checkOut = useCallback(async () => {
    if (!session) return;
    await workSessions.checkOut(session);
    setSession(null);
    setElapsedSeconds(0);
  }, [session]);

  return {
    session,
    isCheckedIn: session !== null,
    elapsedSeconds,
    loading,
    checkIn,
    checkOut,
  };
}
