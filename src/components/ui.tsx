import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { ScheduleCategory, TaskPriority, TaskStatus } from "../types";

/**
 * 대시보드와 관리 페이지가 같이 쓰는 카드 · 라벨 · 색 정의.
 */

export type PageId = "office" | "tasks" | "calendar" | "stats" | "settings";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#f0e8e2] ${className}`}>
      {children}
    </section>
  );
}

/** 카드 머리글. link 를 주면 오른쪽에 관리 페이지로 가는 작은 링크가 붙는다. */
export function CardTitle({
  children,
  right,
  link,
}: {
  children: ReactNode;
  right?: ReactNode;
  link?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-gray-900">{children}</h3>
      <div className="flex items-center gap-2">
        {right}
        {link && (
          <button
            onClick={link.onClick}
            className="flex items-center text-xs font-semibold text-gray-400 transition hover:text-rose-500"
          >
            {link.label}
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-[#faf7f4] px-3 py-5 text-center text-sm text-gray-400">{children}</p>
  );
}

export const TASK_STATUS: Record<TaskStatus, { label: string; badge: string; dot: string }> = {
  completed: { label: "완료", badge: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
  in_progress: { label: "진행중", badge: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
  pending: { label: "예정", badge: "bg-amber-50 text-amber-600", dot: "bg-amber-400" },
  on_hold: { label: "보류", badge: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
};

export const TASK_PRIORITY: Record<TaskPriority, { label: string; badge: string }> = {
  urgent: { label: "긴급", badge: "bg-rose-50 text-rose-600" },
  high: { label: "높음", badge: "bg-orange-50 text-orange-600" },
  normal: { label: "보통", badge: "bg-gray-100 text-gray-500" },
  low: { label: "낮음", badge: "bg-sky-50 text-sky-600" },
};

export const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal", "low"];

export const SCHEDULE_CATEGORY: Record<
  ScheduleCategory,
  { label: string; tile: string; bar: string; text: string; dot: string }
> = {
  work: { label: "업무", tile: "bg-rose-50/80", bar: "border-rose-400", text: "text-rose-600", dot: "bg-rose-400" },
  personal: { label: "개인", tile: "bg-amber-50/80", bar: "border-amber-400", text: "text-amber-600", dot: "bg-amber-400" },
  study: { label: "공부", tile: "bg-violet-50/80", bar: "border-violet-400", text: "text-violet-600", dot: "bg-violet-400" },
  exercise: { label: "운동", tile: "bg-emerald-50/80", bar: "border-emerald-400", text: "text-emerald-600", dot: "bg-emerald-400" },
  etc: { label: "기타", tile: "bg-sky-50/80", bar: "border-sky-400", text: "text-sky-600", dot: "bg-sky-400" },
};

export const inputClass =
  "w-full rounded-xl bg-[#faf7f4] px-3 py-2.5 text-sm text-gray-800 ring-1 ring-[#eee4dc] transition placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300";

/** 초 → "3시간 20분" */
export function formatHours(totalSeconds: number) {
  const minutes = Math.round(Math.max(0, totalSeconds) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** 관리 페이지 머리글 */
export function PageHeader({
  title,
  description,
  right,
}: {
  title: string;
  description: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      {right}
    </div>
  );
}
