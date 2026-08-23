import { useCallback, useEffect, useState } from "react";
import * as activityService from "../services/activities";
import { secondsSince } from "../utils/helpers";
import type { Activity, ActivityType } from "../types";

export function useActivities(userId: string | null) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    activityService
      .getOpenActivity(userId)
      .then((open) => {
        if (!cancelled) setActivity(open);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!activity) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () => setElapsedSeconds(secondsSince(activity.started_at));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activity]);

  const start = useCallback(
    async (type: ActivityType) => {
      if (!userId) return;
      setActivity(await activityService.startActivity(userId, type));
    },
    [userId]
  );

  const end = useCallback(async () => {
    if (!activity) return;
    await activityService.endActivity(activity);
    setActivity(null);
    setElapsedSeconds(0);
  }, [activity]);

  return { activity, elapsedSeconds, loading, start, end };
}
