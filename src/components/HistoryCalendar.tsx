import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardTitle, formatHours } from "./ui";
import { useHistory } from "../hooks/useHistory";
import { todayKey } from "../utils/helpers";

/**
 * 일별 기록 달력 — 날짜 칸마다 그날 근무 시간 막대를 보여주고, 누르면 그날의 업무 히스토리 팝업을 연다.
 * 달 이동으로 지난 달 기록도 그대로 볼 수 있다. (캘린더 페이지와 같은 칸 모양)
 */

interface HistoryCalendarProps {
  userId: string;
  refreshKey?: unknown;
  onOpenDay: (date: string) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function HistoryCalendar({ userId, refreshKey, onOpenDay }: HistoryCalendarProps) {
  const today = todayKey();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const { days: history, loading, error, eventsAvailable } = useHistory(
    userId,
    todayKey(month),
    todayKey(endOfMonth(month)),
    refreshKey
  );

  const cells = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });
  const maxWork = Math.max(3600, ...[...history.values()].map((d) => d.workSeconds));
  const isCurrentMonth = isSameMonth(month, new Date());

  return (
    <Card className="mb-5">
      <CardTitle
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              aria-label="이전 달"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="w-24 text-center text-sm font-bold text-gray-800">
              {format(month, "yyyy년 M월", { locale: ko })}
            </span>
            <button
              onClick={() => setMonth((m) => addMonths(m, 1))}
              disabled={isCurrentMonth}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              aria-label="다음 달"
            >
              <ChevronRight size={16} />
            </button>
            {!isCurrentMonth && (
              <button
                onClick={() => setMonth(startOfMonth(new Date()))}
                className="ml-1 rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              >
                이번 달
              </button>
            )}
          </div>
        }
      >
        일별 기록
      </CardTitle>
      <p className="-mt-2 mb-3 text-xs text-gray-400">날짜를 누르면 그날 실제로 한 업무를 시간순으로 볼 수 있어요.</p>

      <div className="grid grid-cols-7 text-center text-xs font-semibold">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`pb-2 ${i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>
            {d}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 ${loading ? "opacity-60" : ""}`}>
        {cells.map((day) => {
          const key = todayKey(day);
          const inMonth = isSameMonth(day, month);
          const future = key > today;
          const d = inMonth ? history.get(key) : undefined;
          const work = d?.workSeconds ?? 0;
          const taskCount = d?.tasks.length ?? 0;
          const hasRecord = !!d && (work > 0 || d.timeline.length > 0);
          const dow = day.getDay();
          return (
            <button
              key={key}
              onClick={() => onOpenDay(key)}
              disabled={!inMonth || future}
              title={
                hasRecord
                  ? `${format(day, "M/d (EEE)", { locale: ko })} · 근무 ${formatHours(work)} · 업무 ${taskCount}개 · 완료 ${d!.completedCount}개`
                  : undefined
              }
              className={`flex min-h-[64px] flex-col items-stretch rounded-xl p-1.5 text-left transition sm:min-h-[78px] ${
                key === today ? "bg-rose-50/60 ring-1 ring-rose-200" : "hover:bg-[#faf7f4]"
              } ${inMonth ? "" : "invisible"} ${future ? "cursor-default opacity-40 hover:bg-transparent" : ""}`}
            >
              <span
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  key === today
                    ? "bg-rose-500 text-white"
                    : dow === 0
                      ? "text-rose-400"
                      : dow === 6
                        ? "text-blue-400"
                        : "text-gray-700"
                }`}
              >
                {day.getDate()}
              </span>
              {hasRecord && (
                <span className="mt-auto block space-y-1">
                  {/* 근무 시간 막대 — 그 달에서 가장 많이 일한 날 기준 */}
                  <span className="block h-1.5 overflow-hidden rounded-full bg-[#f3ede8]">
                    <span
                      className="block h-full rounded-full bg-rose-300"
                      style={{ width: `${work ? Math.max(6, (work / maxWork) * 100) : 0}%` }}
                    />
                  </span>
                  <span className="hidden truncate text-[10px] font-semibold text-gray-600 sm:block">
                    {work ? formatHours(work) : "근무 기록 없음"}
                  </span>
                  {taskCount > 0 && (
                    <span className="hidden truncate text-[10px] text-gray-400 md:block">
                      업무 {taskCount} · 완료 {d!.completedCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
      {eventsAvailable === false && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          업무 중지 · 재시작 기록을 남기려면 DB 업데이트(0005 마이그레이션)가 필요해요. 지금은 업무 시작 · 완료 시각으로만 보여줘요.
        </p>
      )}
    </Card>
  );
}
