import { useEffect } from "react";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Empty, TASK_CATEGORY, formatHours } from "./ui";
import { useHistory } from "../hooks/useHistory";
import { formatTime, todayKey } from "../utils/helpers";
import { ACTIVITY_LABEL, type TimelineEntry } from "../utils/history";
import type { ActivityType } from "../types";

/**
 * 날짜별 업무 히스토리 팝업 — 그날 실제로 한 일을 시간순으로 보여준다.
 * 업무명이 길어도 자르지 않고 줄바꿈한다. 이전/다음 날 · 날짜 선택으로 지난 기록을 넘겨볼 수 있다.
 */

interface HistoryDayModalProps {
  userId: string;
  date: string;
  onDateChange: (date: string) => void;
  onClose: () => void;
  refreshKey?: unknown;
}

const KIND_DOT: Record<TimelineEntry["kind"], string> = {
  work: "bg-blue-400",
  task: "bg-amber-400",
  activity: "bg-violet-400",
};

export function timelineDot(entry: TimelineEntry) {
  if (entry.tone === "done") return "bg-emerald-400";
  if (entry.tone === "paused") return "bg-gray-300";
  return KIND_DOT[entry.kind];
}

const shift = (date: string, n: number) => todayKey(addDays(new Date(`${date}T00:00:00`), n));

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#faf7f4] px-3 py-2">
      <p className="text-[11px] font-semibold text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function HistoryDayModal({ userId, date, onDateChange, onClose, refreshKey }: HistoryDayModalProps) {
  const today = todayKey();
  const monthStart = startOfMonth(new Date(`${date}T00:00:00`));
  const { days, loading, error } = useHistory(
    userId,
    todayKey(monthStart),
    todayKey(endOfMonth(monthStart)),
    refreshKey
  );
  const day = days.get(date);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const activities = day
    ? (Object.keys(day.activitySeconds) as ActivityType[]).filter((t) => day.activitySeconds[t] > 0)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="날짜별 업무 히스토리"
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl ring-1 ring-[#f0e8e2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 머리글 — 날짜 이동 */}
        <div className="flex items-center gap-1 border-b border-[#f3ede8] px-4 py-3">
          <button
            onClick={() => onDateChange(shift(date, -1))}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="이전 날"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-base font-bold text-gray-900">
              {format(new Date(`${date}T00:00:00`), "yyyy년 M월 d일 (EEE)", { locale: ko })}
              {date === today && (
                <span className="ml-1.5 rounded-md bg-rose-50 px-1.5 py-0.5 align-middle text-[10px] font-bold text-rose-500">
                  오늘
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => onDateChange(shift(date, 1))}
            disabled={date >= today}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            aria-label="다음 날"
          >
            <ChevronRight size={18} />
          </button>
          <button onClick={onClose} className="ml-1 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <label className="flex items-center justify-end gap-2 text-xs text-gray-500">
            날짜 선택
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="rounded-lg bg-[#faf7f4] px-2 py-1 text-xs text-gray-700 ring-1 ring-[#eee4dc] focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </label>

          {error ? (
            <Empty>{error}</Empty>
          ) : loading && !day ? (
            <Empty>불러오는 중...</Empty>
          ) : !day || (day.timeline.length === 0 && day.workSeconds === 0) ? (
            <Empty>이 날은 기록이 없어요</Empty>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Chip label="근무 시간" value={day.workSeconds ? formatHours(day.workSeconds) : "-"} />
                <Chip label="진행한 업무" value={`${day.tasks.length}개`} />
                <Chip
                  label="완료 / 미완료"
                  value={`${day.completedCount} / ${day.tasks.length - day.completedCount}`}
                />
              </div>

              <section>
                <h4 className="mb-2 text-xs font-bold text-gray-500">시간순 기록</h4>
                {day.timeline.length === 0 ? (
                  <Empty>기록이 없어요</Empty>
                ) : (
                  <ol className="relative space-y-2">
                    <span className="absolute bottom-2 left-[3.5px] top-2 w-px bg-[#efe6df]" aria-hidden />
                    {day.timeline.map((entry) => (
                      <li key={entry.id} className="relative flex items-start gap-3 text-sm">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ring-2 ring-white ${timelineDot(entry)}`} />
                        <span className="w-11 shrink-0 pt-px font-mono text-xs text-gray-400">{formatTime(entry.at)}</span>
                        <span className="min-w-0 flex-1 break-words text-gray-700">{entry.label}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {day.tasks.length > 0 && (
                <section>
                  <h4 className="mb-2 text-xs font-bold text-gray-500">업무별 실제 업무시간</h4>
                  <ul className="space-y-1">
                    {day.tasks.map((t) => (
                      <li key={t.key} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[#faf7f4]">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${t.completed ? "bg-emerald-400" : "bg-amber-400"}`}
                        />
                        <span className="min-w-0 flex-1 break-words text-gray-700">
                          {t.title}
                          {t.category && (
                            <span className={`ml-1.5 rounded px-1 py-0.5 text-[10px] font-bold ${TASK_CATEGORY[t.category].badge}`}>
                              {TASK_CATEGORY[t.category].label}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-gray-500">
                          {t.completed ? "완료" : "미완료"}
                        </span>
                        <span className="w-16 shrink-0 text-right text-xs font-semibold text-gray-800">
                          {t.seconds > 0 ? formatHours(t.seconds) : "-"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {activities.length > 0 && (
                <section>
                  <h4 className="mb-2 text-xs font-bold text-gray-500">개인 활동</h4>
                  <div className="flex flex-wrap gap-2">
                    {activities.map((t) => (
                      <span key={t} className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">
                        {ACTIVITY_LABEL[t]} {formatHours(day.activitySeconds[t])}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
