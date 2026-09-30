import { Check } from "lucide-react";
import OfficeCharacter from "./OfficeCharacter";
import { ME_LOOK } from "./OfficeScene";
import { Card, CardTitle, Empty, TASK_STATUS } from "./ui";
import { formatDuration } from "../utils/helpers";
import type { Task, TaskStatus } from "../types";

/**
 * 라이브 오피스 왼쪽 — 오늘 할 일(확인용)과 오늘의 진행률.
 * 여기서는 업무를 만들거나 바꾸지 않는다. 관리는 "오늘 할 일" 페이지에서 한다.
 */

interface LeftSidebarProps {
  tasks: Task[];
  activeTaskId: string | null;
  runningSeconds: number;
  onOpenTasks: () => void;
}

/** 지금 할 일이 위로 오도록: 진행중 → 예정 → 보류 → 완료 */
const STATUS_ORDER: Record<TaskStatus, number> = {
  in_progress: 0,
  pending: 1,
  on_hold: 2,
  completed: 3,
};

function Donut({ done, doing, todo }: { done: number; doing: number; todo: number }) {
  const total = done + doing + todo;
  const C = 2 * Math.PI * 38;
  const parts = [
    { value: done, color: "#34c38f" },
    { value: doing, color: "#5b9cf5" },
    { value: todo, color: "#f5b942" },
  ];
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="h-[108px] w-[108px] -rotate-90">
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

export default function LeftSidebar({
  tasks,
  activeTaskId,
  runningSeconds,
  onOpenTasks,
}: LeftSidebarProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const doing = tasks.filter((t) => t.status === "in_progress").length;
  const todo = total - done - doing;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const sorted = [...tasks].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  const remaining = total - done;
  const cheer =
    total === 0
      ? "오늘 할 일을 등록하고 하루를 시작해볼까요?"
      : remaining === 0
        ? "오늘 할 일을 모두 끝냈어요! 수고했어요 🎉"
        : `오늘 할 일 중 ${remaining}개 남았어요! 끝까지 화이팅!`;

  return (
    <div className="flex h-full flex-col gap-5">
      {/* 오늘 할 일 */}
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardTitle right={<span className="text-sm font-semibold text-gray-400">{done}/{total}</span>}>
          오늘 할 일
        </CardTitle>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#f3ede8]">
          <div
            className="h-full rounded-full bg-rose-400 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {total === 0 ? (
          <Empty>등록된 업무가 없습니다</Empty>
        ) : (
          <ul className="-mr-2 min-h-0 space-y-0.5 overflow-y-auto pr-2">
            {sorted.map((task) => {
              const status = TASK_STATUS[task.status];
              const isDone = task.status === "completed";
              const isActive = task.id === activeTaskId;
              return (
                <li key={task.id} className="flex items-center gap-2.5 rounded-lg px-1 py-[7px]">
                  <span
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] ${
                      isDone
                        ? "bg-rose-400 text-white"
                        : isActive
                          ? "ring-2 ring-blue-300"
                          : "ring-1 ring-gray-300"
                    }`}
                  >
                    {isDone && <Check size={12} strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        isDone ? "text-gray-400 line-through" : "font-medium text-gray-800"
                      }`}
                    >
                      {task.title}
                    </p>
                    {isActive && (
                      <p className="font-mono text-[11px] text-blue-500">⏱ {formatDuration(runningSeconds)}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${status.badge}`}>
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <button
          onClick={onOpenTasks}
          className="mt-auto shrink-0 pt-3 text-left text-xs font-semibold text-gray-400 transition hover:text-rose-500"
        >
          오늘 할 일 관리 →
        </button>
      </Card>

      {/* 오늘의 진행률 */}
      <Card>
        <CardTitle>오늘의 진행률</CardTitle>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[34px] font-extrabold leading-none text-gray-900">
              {percent}
              <span className="ml-0.5 text-lg font-bold text-gray-500">%</span>
            </p>
            <dl className="mt-4 space-y-1.5 text-xs">
              {[
                { label: "완료", value: done, dot: "bg-[#34c38f]" },
                { label: "진행중", value: doing, dot: "bg-[#5b9cf5]" },
                { label: "예정", value: todo, dot: "bg-[#f5b942]" },
              ].map((row) => (
                <div key={row.label} className="flex w-24 items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                  <dt className="flex-1 text-gray-500">{row.label}</dt>
                  <dd className="font-bold text-gray-800">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Donut done={done} doing={doing} todo={todo} />
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#fdf6f3] px-3 py-2.5">
          <div className="h-10 shrink-0">
            <OfficeCharacter look={ME_LOOK} pose="stand" height="100%" label="내 캐릭터" />
          </div>
          <p className="text-xs leading-relaxed text-gray-600">{cheer}</p>
        </div>
      </Card>
    </div>
  );
}
