import { useEffect, useState } from "react";
import { todayKey } from "../utils/helpers";

/**
 * 오늘 날짜(yyyy-MM-dd). 화면을 켜 둔 채 자정이 지나면 값이 바뀌어
 * 오늘 할 일 · 히스토리가 새 날짜 기준으로 다시 불러와진다.
 */
export function useToday() {
  const [today, setToday] = useState(todayKey);

  useEffect(() => {
    const timer = setInterval(() => setToday(todayKey()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return today;
}
