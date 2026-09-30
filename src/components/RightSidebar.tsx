import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { LogIn, LogOut } from "lucide-react";
import { Card, CardTitle, Empty, SCHEDULE_CATEGORY } from "./ui";
import { formatDuration, formatTime } from "../utils/helpers";
import type { Schedule } from "../types";

/**
 * 라이브 오피스 오른쪽 — 날짜·시각, 오늘의 일정(확인용), 근무 시간.
 * 일정은 캘린더 페이지에서 등록한 것을 읽어서 보여주기만 한다.
 */

interface RightSidebarProps {
  schedules: Schedule[];
  isCheckedIn: boolean;
  checkInAt: string | null;
  checkOutAt: string | null;
  elapsedSeconds: number;
  workLoading: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onOpenCalendar: () => void;
}

type ScheduleState = "done" | "now" | "next" | "later" | "allday";

const STATE_LABEL: Record<ScheduleState, string> = {
  done: "완료",
  now: "진행 중",
  next: "다음 일정",
  later: "예정",
  allday: "종일",
};

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** 시각으로 일정 상태를 정한다. 끝 시각이 없으면 1시간짜리로 본다. */
function scheduleStates(schedules: Schedule[], now: Date): ScheduleState[] {
  const current = now.getHours() * 60 + now.getMinutes();
  let nextMarked = false;
  return schedules.map((s) => {
    if (!s.start_time) return "allday";
    const start = toMinutes(s.start_time);
    const end = s.end_time ? toMinutes(s.end_time) : start + 60;
    if (current >= end) return "done";
    if (current >= start) return "now";
    if (!nextMarked) {
      nextMarked = true;
      return "next";
    }
    return "later";
  });
}

export default function RightSidebar({
  schedules,
  isCheckedIn,
  checkInAt,
  checkOutAt,
  elapsedSeconds,
  workLoading,
  onCheckIn,
  onCheckOut,
  onOpenCalendar,
}: RightSidebarProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const states = scheduleStates(schedules, now);
  const hour12 = now.getHours() % 12 || 12;

  return (
    <div className="flex h-full flex-col gap-5">
      {/* 날짜 · 시각 */}
      <Card>
        <p className="text-sm font-medium text-gray-500">
          {format(now, "yyyy.MM.dd (EEE)", { locale: ko })}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[40px] font-extrabold leading-none tracking-tight text-gray-900 tabular-nums">
            {String(hour12).padStart(2, "0")}:{format(now, "mm")}
          </span>
          <span className="text-base font-bold text-gray-500">{now.getHours() < 12 ? "AM" : "PM"}</span>
          <span className="ml-auto font-mono text-xs text-gray-300">{format(now, "ss")}s</span>
        </div>
      </Card>

      {/* 오늘의 일정 */}
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardTitle link={{ label: "캘린더", onClick: onOpenCalendar }}>오늘의 일정</CardTitle>

        {schedules.length === 0 ? (
          <Empty>오늘 등록된 일정이 없습니다</Empty>
        ) : (
          <ul className="-mr-2 min-h-0 space-y-2 overflow-y-auto pr-2">
            {schedules.map((s, i) => {
              const cat = SCHEDULE_CATEGORY[s.category];
              const state = states[i];
              return (
                <li
                  key={s.id}
                  className={`flex gap-3 rounded-xl border-l-[3px] px-3 py-2.5 ${cat.tile} ${cat.bar} ${
                    state === "done" ? "opacity-55" : ""
                  }`}
                >
                  <span className="w-11 shrink-0 pt-px font-mono text-sm font-semibold text-gray-700">
                    {s.start_time ? s.start_time.slice(0, 5) : "종일"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{s.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">
                      <span className={state === "now" ? "font-bold text-rose-500" : ""}>
                        {STATE_LABEL[state]}
                      </span>
                      {s.memo ? ` · ${s.memo}` : ` · ${cat.label}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* 근무 시간 */}
      <Card>
        <CardTitle
          right={
            <button
              onClick={isCheckedIn ? onCheckOut : onCheckIn}
              disabled={workLoading}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition disabled:opacity-50 ${
                isCheckedIn
                  ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
            >
              {isCheckedIn ? <LogOut size={13} /> : <LogIn size={13} />}
              {isCheckedIn ? "퇴근하기" : "출근하기"}
            </button>
          }
        >
          근무 시간
        </CardTitle>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">출근 시간</dt>
            <dd className="font-semibold text-gray-900">{checkInAt ? formatTime(checkInAt) : "--:--"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">퇴근 시간</dt>
            <dd className="font-semibold text-gray-900">
              {!isCheckedIn && checkOutAt ? formatTime(checkOutAt) : "--:--"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">상태</dt>
            <dd className={`font-semibold ${isCheckedIn ? "text-emerald-600" : "text-gray-500"}`}>
              {isCheckedIn ? "근무 중" : checkOutAt ? "퇴근" : "출근 전"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-dashed border-[#efe6df] pt-2.5">
            <dt className="text-gray-500">근무 시간</dt>
            <dd className="font-mono text-2xl font-bold text-rose-500">{formatDuration(elapsedSeconds)}</dd>
          </div>
        </dl>
      </Card>

    </div>
  );
}
