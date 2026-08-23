import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export const formatDate = (date: string | Date) => {
  return format(new Date(date), "yyyy.MM.dd", { locale: ko });
};

export const formatTime = (date: string | Date) => {
  return format(new Date(date), "HH:mm", { locale: ko });
};

export const formatRelativeTime = (date: string | Date) => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ko,
  });
};

export const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "오전";
  if (hour < 18) return "오후";
  return "저녁";
};

// DB의 date 컬럼은 Asia/Seoul 기준이므로 UTC 변환 없이 로컬 날짜를 그대로 쓴다.
export const todayKey = (date: Date = new Date()) => format(date, "yyyy-MM-dd");

export const formatDuration = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

export const secondsSince = (isoTime: string) =>
  Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000);
