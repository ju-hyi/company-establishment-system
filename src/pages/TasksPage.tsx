import { useState } from "react";
import { Check, Pencil, Play, Plus, RotateCcw, Trash2, X } from "lucide-react";
import {
  Card,
  CardTitle,
  Empty,
  PageHeader,
  PRIORITY_ORDER,
  TASK_PRIORITY,
  TASK_STATUS,
  inputClass,
} from "../components/ui";
import { formatDuration, formatTime } from "../utils/helpers";
import type { Task, TaskPriority, TaskStatus } from "../types";
import type { useTasks } from "../hooks/useTasks";

/**
 * 오늘 할 일 — 업무를 추가 · 수정 · 삭제 · 상태 변경하는 관리 페이지.
 * 여기서 바꾼 내용이 라이브 오피스 대시보드에 그대로 보인다.
 */

interface TasksPageProps {
  tasks: ReturnType<typeof useTasks>;
  onDataChange: () => void;
}

type Filter = "all" | "open" | TaskStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "open", label: "남은 일" },
  { id: "in_progress", label: "진행중" },
  { id: "pending", label: "예정" },
  { id: "on_hold", label: "보류" },
  { id: "completed", label: "완료" },
];

const STATUS_OPTIONS: TaskStatus[] = ["pending", "in_progress", "on_hold", "completed"];

function PrioritySelect({
  value,
  onChange,
}: {
  value: TaskPriority;
  onChange: (p: TaskPriority) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskPriority)}
      className={`${inputClass} w-auto pr-8`}
      aria-label="우선순위"
    >
      {PRIORITY_ORDER.map((p) => (
        <option key={p} value={p}>
          우선순위 · {TASK_PRIORITY[p].label}
        </option>
      ))}
    </select>
  );
}

function TaskRow({
  task,
  isActive,
  runningSeconds,
  onStatus,
  onSave,
  onRemove,
}: {
  task: Task;
  isActive: boolean;
  runningSeconds: number;
  onStatus: (status: TaskStatus) => void;
  onSave: (patch: { title: string; priority: TaskPriority; description: string | null }) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [description, setDescription] = useState(task.description ?? "");

  const done = task.status === "completed";
  const status = TASK_STATUS[task.status];
  const prio = TASK_PRIORITY[task.priority];
  const meta = [
    done && task.completed_at && `${formatTime(task.completed_at)} 완료`,
    done && task.duration_seconds !== null && `소요 ${formatDuration(task.duration_seconds)}`,
    !done && !isActive && task.started_at && `${formatTime(task.started_at)} 시작`,
    task.description,
  ].filter(Boolean);

  const startEdit = () => {
    setTitle(task.title);
    setPriority(task.priority);
    setDescription(task.description ?? "");
    setEditing(true);
  };

  const save = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), priority, description: description.trim() || null });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="space-y-2 rounded-xl bg-[#fdf9f6] p-3 ring-1 ring-rose-100">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className={inputClass}
          autoFocus
          aria-label="업무명"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="메모 (선택)"
          className={inputClass}
          aria-label="메모"
        />
        <div className="flex flex-wrap items-center gap-2">
          <PrioritySelect value={priority} onChange={setPriority} />
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={save}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              저장
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-3 ring-1 transition sm:flex-nowrap ${
        isActive ? "bg-blue-50/60 ring-blue-200" : done ? "bg-[#faf7f4] ring-transparent" : "bg-white ring-[#f0e8e2]"
      }`}
    >
      <button
        onClick={() => onStatus(done ? "pending" : "completed")}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${
          done ? "bg-rose-400 text-white" : "ring-1 ring-gray-300 hover:ring-rose-300"
        }`}
        aria-label={done ? "완료 취소" : "완료 처리"}
      >
        {done && <Check size={13} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate font-medium ${done ? "text-gray-400 line-through" : "text-gray-900"}`}>
            {task.title}
          </p>
          {task.priority !== "normal" && (
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${prio.badge}`}>
              {prio.label}
            </span>
          )}
        </div>
        {(isActive || meta.length > 0) && (
          <p className="mt-0.5 truncate text-xs text-gray-400">
            {isActive && <span className="mr-1.5 font-mono text-blue-500">⏱ {formatDuration(runningSeconds)}</span>}
            {meta.join(" · ")}
          </p>
        )}
      </div>

      <div className="flex w-full items-center gap-1.5 sm:w-auto">
        <select
          value={task.status}
          onChange={(e) => onStatus(e.target.value as TaskStatus)}
          className={`rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-200 ${status.badge}`}
          aria-label="상태"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS[s].label}
            </option>
          ))}
        </select>

        {task.status === "pending" || task.status === "on_hold" ? (
          <button
            onClick={() => onStatus("in_progress")}
            className="flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600"
          >
            <Play size={12} /> 시작
          </button>
        ) : task.status === "in_progress" ? (
          <button
            onClick={() => onStatus("completed")}
            className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
          >
            <Check size={12} /> 완료
          </button>
        ) : (
          <button
            onClick={() => onStatus("pending")}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50"
          >
            <RotateCcw size={12} /> 되돌리기
          </button>
        )}

        <div className="ml-auto flex sm:ml-1">
          <button
            onClick={startEdit}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="업무 수정"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`'${task.title}' 업무를 삭제할까요?`)) onRemove();
            }}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-500"
            aria-label="업무 삭제"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function TasksPage({ tasks, onDataChange }: TasksPageProps) {
  const [draft, setDraft] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
      onDataChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const submit = () => {
    if (!draft.trim()) return;
    const title = draft;
    setDraft("");
    setPriority("normal");
    run(() => tasks.addTask(title, priority));
  };

  const count = (f: Filter) =>
    tasks.tasks.filter((t) =>
      f === "all" ? true : f === "open" ? t.status !== "completed" : t.status === f
    ).length;

  const visible = tasks.tasks
    .filter((t) =>
      filter === "all" ? true : filter === "open" ? t.status !== "completed" : t.status === filter
    )
    .sort(
      (a, b) =>
        Number(a.status === "completed") - Number(b.status === "completed") ||
        PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    );

  const percent =
    tasks.totalCount === 0 ? 0 : Math.round((tasks.completedCount / tasks.totalCount) * 100);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="오늘 할 일"
        description="오늘의 업무를 등록하고 진행 상황을 관리합니다. 라이브 오피스에 바로 반영돼요."
        right={
          <div className="text-right">
            <p className="text-2xl font-extrabold text-gray-900">{percent}%</p>
            <p className="text-xs text-gray-400">
              {tasks.completedCount}/{tasks.totalCount} 완료
            </p>
          </div>
        }
      />

      <Card className="mb-5">
        <CardTitle>
          <Plus size={16} className="text-rose-400" /> 업무 추가
        </CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submit()}
            placeholder="업무명을 입력하세요 (예: A사 발주 확인)"
            className={`${inputClass} sm:flex-1`}
            aria-label="업무명"
          />
          <div className="flex gap-2">
            <PrioritySelect value={priority} onChange={setPriority} />
            <button
              onClick={submit}
              disabled={!draft.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-40"
            >
              <Plus size={16} /> 추가
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-2 flex items-center gap-1 text-xs text-rose-500">
            <X size={12} /> {error}
          </p>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.id ? "bg-gray-900 text-white" : "bg-[#faf7f4] text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f.label} <span className="opacity-60">{count(f.id)}</span>
            </button>
          ))}
        </div>

        {tasks.loading ? (
          <Empty>불러오는 중...</Empty>
        ) : visible.length === 0 ? (
          <Empty>{tasks.totalCount === 0 ? "위에서 오늘의 첫 업무를 추가해보세요." : "해당하는 업무가 없습니다."}</Empty>
        ) : (
          <ul className="space-y-2">
            {visible.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isActive={tasks.activeTask?.id === task.id}
                runningSeconds={tasks.runningSeconds}
                onStatus={(status) => run(() => tasks.setStatus(task.id, status))}
                onSave={(patch) => run(() => tasks.updateTask(task.id, patch))}
                onRemove={() => run(() => tasks.removeTask(task.id))}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
