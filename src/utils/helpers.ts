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
