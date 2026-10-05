import { useState } from "react";
import { CalendarClock, Check, Pause, Pencil, Play, Plus, RotateCcw, Trash2, X } from "lucide-react";
import {
  CATEGORY_ORDER,
  Card,
  CardTitle,
  Empty,
  PageHeader,
  PRIORITY_ORDER,
  TASK_CATEGORY,
  TASK_PRIORITY,
  TASK_STATUS,
  inputClass,
  taskDateBadge,
} from "../components/ui";
import { formatDuration, formatTime } from "../utils/helpers";
import { categoryOf, type TaskPeriod } from "../services/tasks";
import type { Task, TaskCategory, TaskPriority, TaskStatus } from "../types";
import type { useTasks } from "../hooks/useTasks";

/**
 * 오늘 할 일 — 업무를 추가 · 수정 · 삭제 · 상태 변경하는 관리 페이지.
 * 업무마다 구분(회사 업무 / 공부 및 개인 활동 / MX 인스타)을 정하면
 * 라이브 오피스 왼쪽의 해당 블럭에 표시된다.
 *
 * 기간: 시작일(task_date) ~ 종료일(due_date). 끝나지 않은 업무는 날짜가 지나도 목록에 남는다(이월).
 * 시작 → 중지 → 재시작 → 완료 — 중지는 완료가 아니며, 실제 업무시간은 일한 구간만 더한다.
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
  { id: "on_hold", label: "중지" },
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
      className={`${inputClass} pr-8`}
      aria-label="우선순위"
    >
      {PRIORITY_ORDER.map((p) => (
        <option key={p} value={p}>
          {TASK_PRIORITY[p].label}
        </option>
      ))}
    </select>
  );
}

function CategorySelect({
  value,
  onChange,
}: {
  value: TaskCategory;
  onChange: (c: TaskCategory) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskCategory)}
      className={`${inputClass} pr-8`}
      aria-label="구분"
    >
      {CATEGORY_ORDER.map((c) => (
        <option key={c} value={c}>
          {TASK_CATEGORY[c].icon} {TASK_CATEGORY[c].label}
        </option>
      ))}
    </select>
  );
}

/** 기간 입력 — 시작일 · 종료일(선택). 종료일을 비우면 하루짜리 업무. */
function PeriodFields({
  value,
  onChange,
}: {
  value: TaskPeriod;
  onChange: (p: TaskPeriod) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
      <Field label="시작일">
        <input
          type="date"
          value={value.task_date}
          onChange={(e) => e.target.value && onChange({ ...value, task_date: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="종료일 (선택)">
        <input
          type="date"
          value={value.due_date ?? ""}
          min={value.task_date}
          onChange={(e) => onChange({ ...value, due_date: e.target.value || null })}
          className={inputClass}
        />
      </Field>
      <button
        type="button"
        onClick={() => onChange({ ...value, due_date: null })}
        disabled={!value.due_date}
        className="h-[42px] rounded-xl px-3 text-xs font-semibold text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:opacity-40"
      >
        기간 삭제
      </button>
    </div>
  );
}

const periodError = (p: TaskPeriod) =>
  p.due_date && p.due_date < p.task_date ? "종료일은 시작일과 같거나 뒤여야 해요." : null;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-semibold text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function TaskRow({
  task,
  isActive,
  runningSeconds,
  onStatus,
  onSave,
  onRemove,
  showCategory,
  today,
}: {
  task: Task;
  isActive: boolean;
  runningSeconds: number;
  onStatus: (status: TaskStatus) => void;
  onSave: (
    patch: {
      title: string;
      priority: TaskPriority;
      category: TaskCategory;
      description: string | null;
    } & TaskPeriod,
    status: TaskStatus
  ) => void;
  onRemove: () => void;
  showCategory: boolean;
  today: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [description, setDescription] = useState(task.description ?? "");
  const [category, setCategory] = useState<TaskCategory>(categoryOf(task));
  const [period, setPeriod] = useState<TaskPeriod>({ task_date: task.task_date, due_date: task.due_date });
  const [editStatus, setEditStatus] = useState<TaskStatus>(task.status);

  const done = task.status === "completed";
  const paused = task.status === "on_hold";
  const status = TASK_STATUS[task.status];
  const prio = TASK_PRIORITY[task.priority];
  const badge = taskDateBadge(task, today);
  const worked = task.duration_seconds ?? 0;
  const meta = [
    done && task.completed_at && `${formatTime(task.completed_at)} 완료`,
    done && task.duration_seconds !== null && `실제 업무시간 ${formatDuration(task.duration_seconds)}`,
    !done && !isActive && worked > 0 && `지금까지 ${formatDuration(worked)}`,
    !done && !isActive && worked === 0 && task.started_at && `${formatTime(task.started_at)} 시작`,
    task.description,
  ].filter(Boolean);

  const startEdit = () => {
    setTitle(task.title);
    setPriority(task.priority);
    setDescription(task.description ?? "");
    setCategory(categoryOf(task));
    setPeriod({ task_date: task.task_date, due_date: task.due_date });
    setEditStatus(task.status);
    setEditing(true);
  };

  const editError = periodError(period);

  const save = () => {
    if (!title.trim() || editError) return;
    onSave(
      { title: title.trim(), priority, category, description: description.trim() || null, ...period },
      editStatus
    );
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="col-span-2 sm:col-span-1">
            <Field label="구분">
              <CategorySelect value={category} onChange={setCategory} />
            </Field>
          </div>
          <Field label="상태">
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
              className={`${inputClass} pr-8`}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {TASK_STATUS[st].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="우선순위">
            <PrioritySelect value={priority} onChange={setPriority} />
          </Field>
        </div>
        <PeriodFields value={period} onChange={setPeriod} />
        {editError && <p className="text-xs text-rose-500">{editError}</p>}
        <div className="flex items-center gap-2">
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={save}
              disabled={!title.trim() || !!editError}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-40"
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={`min-w-0 max-w-full truncate font-medium ${done ? "text-gray-400 line-through" : "text-gray-900"}`}>
            {task.title}
          </p>
          {showCategory && (
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${TASK_CATEGORY[categoryOf(task)].badge}`}>
              {TASK_CATEGORY[categoryOf(task)].label}
            </span>
          )}
          {task.priority !== "normal" && (
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${prio.badge}`}>
              {prio.label}
            </span>
          )}
          {badge && (
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badge.tone}`}>
              {badge.label}
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

      <div className="flex w-full items-center gap-1.5 sm:w-auto [&_button]:whitespace-nowrap">
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

        {task.status === "in_progress" ? (
          <>
            <button
              onClick={() => onStatus("on_hold")}
              className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50"
            >
              <Pause size={12} /> 중지
            </button>
            <button
              onClick={() => onStatus("completed")}
              className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
            >
              <Check size={12} /> 완료
            </button>
          </>
        ) : !done ? (
          <button
            onClick={() => onStatus("in_progress")}
            className="flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600"
          >
            <Play size={12} /> {paused || worked > 0 ? "재시작" : "시작"}
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
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="업무 수정"
          >
            <Pencil size={14} /> 수정
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
  const [category, setCategory] = useState<TaskCategory>("work");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [period, setPeriod] = useState<TaskPeriod>({ task_date: tasks.today, due_date: null });
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryTab, setCategoryTab] = useState<TaskCategory | "all">("all");
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

  const addError = periodError(period);

  const submit = () => {
    if (!draft.trim() || addError) return;
    const title = draft;
    const chosen = period;
    setDraft("");
    setPriority("normal");
    setStatus("pending");
    setPeriod({ task_date: tasks.today, due_date: null });
    run(() => tasks.addTask(title, priority, category, status, chosen));
  };

  const row = (task: Task) => (
    <TaskRow
      key={task.id}
      task={task}
      isActive={tasks.activeTask?.id === task.id}
      runningSeconds={tasks.runningSeconds}
      onStatus={(status) => run(() => tasks.setStatus(task.id, status))}
      onSave={(patch, status) => run(() => tasks.editTask(task.id, patch, status))}
      onRemove={() => run(() => tasks.removeTask(task.id))}
      showCategory={categoryTab === "all"}
      today={tasks.today}
    />
  );

  const inTab = tasks.tasks.filter(
    (t) => categoryTab === "all" || categoryOf(t) === categoryTab
  );

  const count = (f: Filter) =>
    inTab.filter((t) =>
      f === "all" ? true : f === "open" ? t.status !== "completed" : t.status === f
    ).length;

  const visible = inTab
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
        description="업무를 등록하고 시작 · 중지 · 완료를 관리합니다. 끝나지 않은 업무는 다음 날에도 남아 있어요."
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
        <div className="space-y-3">
          <Field label="업무명">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submit()}
              placeholder="업무명을 입력하세요 (예: A사 발주 확인)"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
            <div className="col-span-2 sm:col-span-1">
              <Field label="구분">
                <CategorySelect value={category} onChange={setCategory} />
              </Field>
            </div>
            <Field label="상태">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={`${inputClass} pr-8`}
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {TASK_STATUS[st].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="우선순위">
              <PrioritySelect value={priority} onChange={setPriority} />
            </Field>
            <button
              onClick={submit}
              disabled={!draft.trim() || !!addError}
              className="col-span-2 flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-40 sm:col-span-1"
            >
              <Plus size={16} /> 저장
            </button>
          </div>
          <PeriodFields value={period} onChange={setPeriod} />
          {addError && <p className="text-xs text-rose-500">{addError}</p>}
        </div>
        {error && (
          <p className="mt-2 flex items-center gap-1 text-xs text-rose-500">
            <X size={12} /> {error}
          </p>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex gap-1 overflow-x-auto border-b border-[#f3ede8]">
          {(["all", ...CATEGORY_ORDER] as const).map((c) => {
            const n =
              c === "all" ? tasks.tasks.length : tasks.tasks.filter((t) => categoryOf(t) === c).length;
            return (
              <button
                key={c}
                onClick={() => {
                  setCategoryTab(c);
                  if (c !== "all") setCategory(c);
                }}
                className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition ${
                  categoryTab === c
                    ? "border-rose-400 text-rose-500"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {c === "all" ? "전체" : `${TASK_CATEGORY[c].icon} ${TASK_CATEGORY[c].label}`}
                <span className="ml-1 text-xs opacity-60">{n}</span>
              </button>
            );
          })}
        </div>

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
          <Empty>{inTab.length === 0 ? "위에서 업무를 추가해보세요." : "해당하는 업무가 없습니다."}</Empty>
        ) : (
          <ul className="space-y-2">{visible.map(row)}</ul>
        )}
      </Card>

      {/* 기간이 아직 시작되지 않은 업무 — 시작일이 되면 위 목록으로 올라간다 */}
      {tasks.upcoming.length > 0 && (
        <Card className="mt-5">
          <CardTitle right={<span className="text-xs text-gray-400">{tasks.upcoming.length}개</span>}>
            <CalendarClock size={16} className="text-indigo-400" /> 다가오는 업무
          </CardTitle>
          <ul className="space-y-2">{tasks.upcoming.map(row)}</ul>
        </Card>
      )}
    </div>
  );
}
