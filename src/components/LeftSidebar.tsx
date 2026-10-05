import { useState } from "react";
import { Check, Pause, Play } from "lucide-react";
import { CATEGORY_ORDER, Card, CardTitle, Empty, TASK_CATEGORY, TASK_STATUS, taskDateBadge } from "./ui";
import { categoryOf } from "../services/tasks";
import { formatDuration } from "../utils/helpers";
import type { Task, TaskCategory, TaskStatus } from "../types";

/**
 * 라이브 오피스 왼쪽 — 회사 업무 / 공부 및 개인 활동 / MX 인스타 / 오늘의 진행률 (확인용).
 * 세 블럭은 같은 컴포넌트(TaskBlock)를 쓰고, 업무의 구분(category)으로 나눠 보여준다.
 * 여기서는 완료 체크 · 상태 변경 · 시작/중지를 할 수 있다. 업무 추가 · 수정 · 삭제는 "오늘 할 일" 페이지에서 한다.
 */

interface LeftSidebarProps {
  tasks: Task[];
  activeTaskId: string | null;
  runningSeconds: number;
  onOpenTasks: () => void;
  /** 체크박스 — 완료 ↔ 되돌리기 */
  onToggle: (task: Task) => Promise<void>;
  /** 상태 변경 · 시작/중지 버튼 */
  onStatus: (task: Task, status: TaskStatus) => Promise<void>;
  today: string;
}

const STATUS_OPTIONS: TaskStatus[] = ["pending", "in_progress", "on_hold", "completed"];

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
  onStatus,
  today,
}: {
  category: TaskCategory;
  tasks: Task[];
  activeTaskId: string | null;
  runningSeconds: number;
  onOpenTasks: () => void;
  /** 체크박스 — 완료 ↔ 되돌리기 */
  onToggle: (task: Task) => Promise<void>;
  onStatus: (task: Task, status: TaskStatus) => Promise<void>;
  today: string;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const busy = async (task: Task, action: () => Promise<void>) => {
    setBusyId(task.id);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };
  const toggle = (task: Task) => busy(task, () => onToggle(task));

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
            const running = task.status === "in_progress";
            const badge = taskDateBadge(task, today);
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
                  {(isActive || badge) && (
                    <p className="flex items-center gap-1.5 truncate text-[11px]">
                      {isActive && <span className="font-mono text-blue-500">⏱ {formatDuration(runningSeconds)}</span>}
                      {badge && <span className={`rounded px-1 font-semibold ${badge.tone}`}>{badge.label}</span>}
                    </p>
                  )}
                </div>
                {!isDone && (
                  <button
                    type="button"
                    onClick={() => busy(task, () => onStatus(task, running ? "on_hold" : "in_progress"))}
                    disabled={busyId === task.id}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition disabled:opacity-50 ${
                      running ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-blue-50 text-blue-500 hover:bg-blue-100"
                    }`}
                    aria-label={running ? `${task.title} 중지` : `${task.title} 시작`}
                    title={running ? "중지" : task.started_at ? "재시작" : "시작"}
                  >
                    {running ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                )}
                <select
                  value={task.status}
                  onChange={(e) => busy(task, () => onStatus(task, e.target.value as TaskStatus))}
                  disabled={busyId === task.id}
                  className={`shrink-0 cursor-pointer appearance-none rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50 ${status.badge}`}
                  aria-label={`${task.title} 상태`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS[s].label}
                    </option>
                  ))}
                </select>
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
  onStatus,
  today,
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
          onStatus={onStatus}
          today={today}
        />
      ))}
      <ProgressSummary tasks={tasks} />
    </div>
  );
}
