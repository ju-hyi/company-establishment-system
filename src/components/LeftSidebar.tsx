import { useState } from "react";
import { Check } from "lucide-react";
import { CATEGORY_ORDER, Card, CardTitle, Empty, TASK_CATEGORY, TASK_STATUS } from "./ui";
import { categoryOf } from "../services/tasks";
import { formatDuration } from "../utils/helpers";
import type { Task, TaskCategory, TaskStatus } from "../types";

/**
 * 라이브 오피스 왼쪽 — 회사 업무 / 공부 및 개인 활동 / MX 인스타 / 오늘의 진행률 (확인용).
 * 세 블럭은 같은 컴포넌트(TaskBlock)를 쓰고, 업무의 구분(category)으로 나눠 보여준다.
 * 여기서는 완료 체크만 할 수 있다. 업무 추가 · 수정 · 삭제는 "오늘 할 일" 페이지에서 한다.
 */

interface LeftSidebarProps {
  tasks: Task[];
  activeTaskId: string | null;
  runningSeconds: number;
  onOpenTasks: () => void;
  /** 체크박스 — 완료 ↔ 되돌리기 */
  onToggle: (task: Task) => Promise<void>;
}

/**
 * 왼쪽 네 블럭(회사 업무 · 공부 및 개인 활동 · MX 인스타 · 오늘의 진행률)은 항상 같은 높이다.
 * 넓은 화면은 맵 높이를 4등분하고, 작은 화면은 210px 로 고정한다. 목록이 넘치면 블럭 안에서 스크롤.
 */
const EQUAL_BLOCK = "h-[210px] min-h-0 xl:h-auto xl:flex-1 xl:basis-0";

/**
 * 지금 할 일이 위로 오도록: 진행중 → 예정 → 보류 → 완료 (완료하면 아래로 내려간다).
 * 목록이 길면 블럭 안에서 스크롤 (블럭 높이는 EQUAL_BLOCK 으로 고정).
 */
const STATUS_ORDER: Record<TaskStatus, number> = {
  in_progress: 0,
  pending: 1,
  on_hold: 2,
  completed: 3,
};

function TaskBlock({
  category,
  tasks,
  activeTaskId,
  runningSeconds,
  onOpenTasks,
  onToggle,
}: {
  category: TaskCategory;
  tasks: Task[];
  activeTaskId: string | null;
  runningSeconds: number;
  onOpenTasks: () => void;
  /** 체크박스 — 완료 ↔ 되돌리기 */
  onToggle: (task: Task) => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const toggle = async (task: Task) => {
    setBusyId(task.id);
    try {
      await onToggle(task);
    } finally {
      setBusyId(null);
    }
  };

  const meta = TASK_CATEGORY[category];
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const sorted = [...tasks].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  return (
    <Card className={`${EQUAL_BLOCK} flex flex-col !py-4`}>
      <CardTitle
        right={<span className="text-sm font-semibold text-gray-400">{done}/{total}</span>}
      >
        <span className="text-base leading-none">{meta.icon}</span>
        {meta.label}
      </CardTitle>

      <div className="mb-2.5 h-1.5 shrink-0 overflow-hidden rounded-full bg-[#f3ede8]">
        <div
          className="h-full rounded-full bg-rose-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {total === 0 ? (
        <button onClick={onOpenTasks} className="block w-full text-left">
          <Empty>등록된 업무가 없습니다</Empty>
        </button>
      ) : (
        <ul className="-mr-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-2">
          {sorted.map((task) => {
            const status = TASK_STATUS[task.status];
            const isDone = task.status === "completed";
            const isActive = task.id === activeTaskId;
            return (
              <li key={task.id} className="flex items-center gap-2.5 rounded-lg px-1 py-[6px]">
                <button
                  type="button"
                  onClick={() => toggle(task)}
                  disabled={busyId === task.id}
                  aria-label={isDone ? `${task.title} 완료 취소` : `${task.title} 완료`}
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] transition disabled:opacity-50 ${
                    isDone
                      ? "bg-rose-400 text-white hover:bg-rose-500"
                      : isActive
                        ? "ring-2 ring-blue-300 hover:ring-rose-300"
                        : "ring-1 ring-gray-300 hover:ring-2 hover:ring-rose-300"
                  }`}
                >
                  {isDone && <Check size={12} strokeWidth={3} />}
                </button>
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
    </Card>
  );
}

/** ④ 오늘의 진행률 — 전체 완료율과 구분별 완료율 (계산 방식은 기존과 동일: 완료 / 전체) */
function ProgressSummary({ tasks }: { tasks: Task[] }) {
  const rate = (list: Task[]) =>
    list.length === 0 ? 0 : Math.round((list.filter((t) => t.status === "completed").length / list.length) * 100);
  const percent = rate(tasks);

  return (
    <Card className={`${EQUAL_BLOCK} flex flex-col !py-4`}>
      <CardTitle
        right={
          <span className="text-xl font-extrabold text-gray-900">
            {percent}
            <span className="text-sm font-bold text-gray-500">%</span>
          </span>
        }
      >
        오늘의 진행률
      </CardTitle>
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {CATEGORY_ORDER.map((category) => {
          const list = tasks.filter((t) => categoryOf(t) === category);
          const value = rate(list);
          return (
            <li key={category} className="flex items-center gap-2 text-xs">
              <span className="w-[74px] shrink-0 truncate text-gray-500">{TASK_CATEGORY[category].label}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f3ede8]">
                <span
                  className="block h-full rounded-full bg-rose-400 transition-all duration-500"
                  style={{ width: `${value}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right font-semibold text-gray-700">
                {list.length === 0 ? "-" : `${value}%`}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default function LeftSidebar({
  tasks,
  activeTaskId,
  runningSeconds,
  onOpenTasks,
  onToggle,
}: LeftSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-3.5">
      {CATEGORY_ORDER.map((category) => (
        <TaskBlock
          key={category}
          category={category}
          tasks={tasks.filter((t) => categoryOf(t) === category)}
          activeTaskId={activeTaskId}
          runningSeconds={runningSeconds}
          onOpenTasks={onOpenTasks}
          onToggle={onToggle}
        />
      ))}
      <ProgressSummary tasks={tasks} />
    </div>
  );
}
