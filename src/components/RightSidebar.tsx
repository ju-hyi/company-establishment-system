import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { LogIn, LogOut } from "lucide-react";
import CharacterSpeech, { CHARACTER_IMAGES } from "./CharacterSpeech";
import { Card, CardTitle } from "./ui";
import { formatDuration, formatTime } from "../utils/helpers";
import type { Task } from "../types";

/**
 * 라이브 오피스 오른쪽 — 날짜·시각, 근무 시간, 오늘의 진행률(+캐릭터 응원 말풍선).
 * 입력 UI 는 두지 않는다. 출근/퇴근 버튼만 상태 전환용으로 둔다.
 */

interface RightSidebarProps {
  tasks: Task[];
  isCheckedIn: boolean;
  checkInAt: string | null;
  checkOutAt: string | null;
  elapsedSeconds: number;
  workLoading: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

const COLORS = { done: "#34c38f", doing: "#5b9cf5", todo: "#f5b942" };

function Donut({ done, doing, todo }: { done: number; doing: number; todo: number }) {
  const total = done + doing + todo;
  const C = 2 * Math.PI * 38;
  const parts = [
    { value: done, color: COLORS.done },
    { value: doing, color: COLORS.doing },
    { value: todo, color: COLORS.todo },
  ];
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="h-[92px] w-[92px] shrink-0 -rotate-90">
      <circle cx="50" cy="50" r="38" fill="none" stroke="#f1ece8" strokeWidth="15" />
      {total > 0 &&
        parts.map((p, i) => {
          const len = (p.value / total) * C;
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke={p.color}
              strokeWidth="15"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500"
            />
          );
          offset += len;
          return el;
        })}
    </svg>
  );
}

export default function RightSidebar({
  tasks,
  isCheckedIn,
  checkInAt,
  checkOutAt,
  elapsedSeconds,
  workLoading,
  onCheckIn,
  onCheckOut,
}: RightSidebarProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 진행률 — 기존과 같은 계산: 오늘 업무 중 완료 비율
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const doing = tasks.filter((t) => t.status === "in_progress").length;
  const todo = total - done - doing;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const remaining = total - done;
  const cheer =
    total === 0
      ? "오늘 할 일을 등록하고 하루를 시작해볼까요?"
      : remaining === 0
        ? "오늘 할 일을 모두 끝냈어요!\n수고했어요 🎉"
        : `오늘도 잘하고 있어요!\n${remaining}개만 더 힘내봐요 💪`;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 날짜 · 시각 */}
      <Card className="!py-4">
        <p className="text-sm font-medium text-gray-500">
          {format(now, "yyyy.MM.dd (EEE)", { locale: ko })}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[38px] font-extrabold leading-none tracking-tight text-gray-900 tabular-nums">
            {format(now, "HH:mm")}
          </span>
          <span className="ml-auto font-mono text-xs text-gray-300">{format(now, "ss")}s</span>
        </div>
      </Card>

      {/* 근무 시간 */}
      <Card className="!py-4">
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
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">출근 시간</dt>
            <dd className="font-semibold text-gray-900">{checkInAt ? formatTime(checkInAt) : "--:--"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">상태</dt>
            <dd className={`font-semibold ${isCheckedIn ? "text-emerald-600" : "text-gray-500"}`}>
              {isCheckedIn
                ? "근무 중"
                : checkOutAt
                  ? `퇴근 (${formatTime(checkOutAt)})`
                  : "출근 전"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-dashed border-[#efe6df] pt-2">
            <dt className="text-gray-500">경과 시간</dt>
            <dd className="font-mono text-2xl font-bold text-rose-500">{formatDuration(elapsedSeconds)}</dd>
          </div>
        </dl>
      </Card>

      {/* 오늘의 진행률 + 캐릭터 응원 */}
      <Card className="flex min-h-0 flex-1 flex-col !py-4">
        <CardTitle>오늘의 진행률</CardTitle>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[34px] font-extrabold leading-none text-gray-900">
              {percent}
              <span className="ml-0.5 text-lg font-bold text-gray-500">%</span>
            </p>
            <dl className="mt-3 space-y-1 text-xs">
              {[
                { label: "완료", value: done, color: COLORS.done },
                { label: "진행중", value: doing, color: COLORS.doing },
                { label: "예정", value: todo, color: COLORS.todo },
              ].map((row) => (
                <div key={row.label} className="flex w-[88px] items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                  <dt className="flex-1 text-gray-500">{row.label}</dt>
                  <dd className="font-bold text-gray-800">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Donut done={done} doing={doing} todo={todo} />
        </div>

        <div className="mt-auto pt-3">
          <CharacterSpeech src={CHARACTER_IMAGES.cheer} imageHeight={64} compact>
            {cheer}
          </CharacterSpeech>
        </div>
      </Card>
    </div>
  );
}
