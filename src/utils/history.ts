import { addDays } from "date-fns";
import { todayKey } from "./helpers";
import type { Activity, ActivityType, Task, TaskCategory, TaskEvent, TaskEventType, WorkSession } from "../types";

/**
 * 날짜별 업무 히스토리 — 원본 기록에서 그날 실제로 한 일을 만든다.
 *
 *   근무        work_sessions.work_date
 *   개인 활동    activities.activity_date
 *   업무        task_events.event_date (시작 · 중지 · 재시작 · 완료 · 완료 취소)
 *               진행 기록이 없는 예전 업무는 tasks.started_at / completed_at 의 날짜로 보여준다.
 *
 * tasks 행은 지금 상태만 갖기 때문에, 히스토리는 tasks 의 task_date 로 묶지 않는다.
 * (그래서 날짜가 바뀌거나 업무를 다시 시작해도 지난 날의 기록이 바뀌지 않는다)
 */

export interface TimelineEntry {
  id: string;
  at: string;
  label: string;
  kind: "work" | "task" | "activity";
  /** 점 색 — 완료 / 중지 */
  tone?: "done" | "paused";
}

/** 그날 손댄 업무 하나 */
export interface DayTaskItem {
  key: string;
  title: string;
  category: TaskCategory | null;
  /** 그날 실제로 일한 시간(초) — 시작/재시작 ~ 중지/완료 구간 중 그날에 걸친 부분 */
  seconds: number;
  /** 그날 완료했는지 (마지막 기록이 완료) */
  completed: boolean;
}

export interface DayHistory {
  date: string;
  timeline: TimelineEntry[];
  /** 근무 시간(출근~퇴근 기록, 오늘 근무 중이면 지금까지) */
  workSeconds: number;
  tasks: DayTaskItem[];
  completedCount: number;
  activitySeconds: Record<ActivityType, number>;
}

export interface HistorySource {
  sessions: WorkSession[];
  tasks: Task[];
  events: TaskEvent[];
  activities: Activity[];
}

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  study: "공부",
  exercise: "운동",
  break: "휴식",
  personal: "개인일",
};

const EVENT_LABEL: Record<TaskEventType, string> = {
  start: "시작",
  pause: "중지",
  resume: "재시작",
  complete: "완료",
  reopen: "완료 취소",
};

const OPENS: TaskEventType[] = ["start", "resume"];
const CLOSES: TaskEventType[] = ["pause", "complete", "reopen"];

const ms = (iso: string) => new Date(iso).getTime();
const dayStart = (date: string) => new Date(`${date}T00:00:00`).getTime();
const dayEnd = (date: string) => addDays(new Date(`${date}T00:00:00`), 1).getTime();
const overlap = (a0: number, a1: number, b0: number, b1: number) =>
  Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/** 업무 한 건의 기록 — 진행 기록 또는 (예전 업무) tasks 의 시각 */
interface TaskMark {
  key: string;
  title: string;
  category: TaskCategory | null;
  type: TaskEventType;
  at: string;
  id: string;
}

function collectTaskMarks(tasks: Task[], events: TaskEvent[]): TaskMark[] {
  const marks: TaskMark[] = events.map((e) => ({
    // 삭제된 업무는 task_id 가 없으므로 업무명으로 묶는다
    key: e.task_id ?? `deleted:${e.task_title}`,
    title: e.task_title,
    category: e.task_category,
    type: e.event_type,
    at: e.occurred_at,
    id: e.id,
  }));

  // 같은 업무 · 같은 시각의 진행 기록이 이미 있으면 tasks 의 시각은 건너뛴다 (중복 방지)
  const recorded = new Set(events.map((e) => `${e.task_id}|${ms(e.occurred_at)}`));
  tasks.forEach((t) => {
    const legacy: [TaskEventType, string | null][] = [
      ["start", t.started_at],
      ["complete", t.completed_at],
    ];
    legacy.forEach(([type, at]) => {
      if (!at || recorded.has(`${t.id}|${ms(at)}`)) return;
      // 진행 기록이 있는 업무의 started_at 은 "마지막 재시작" 이라 이미 기록돼 있다 — 기록이 전혀 없는 업무만
      if (type === "start" && events.some((e) => e.task_id === t.id)) return;
      marks.push({
        key: t.id,
        title: t.title,
        category: t.category ?? "work",
        type,
        at,
        id: `${t.id}-${type === "start" ? "s" : "c"}`,
      });
    });
  });

  return marks.sort((a, b) => ms(a.at) - ms(b.at));
}

/** 업무별 작업 구간 [시작, 끝] — 아직 진행중인 구간은 now 까지 */
function segmentsByTask(marks: TaskMark[], now: number) {
  const open = new Map<string, number>();
  const segments = new Map<string, [number, number][]>();
  marks.forEach((m) => {
    const t = ms(m.at);
    if (OPENS.includes(m.type)) {
      if (!open.has(m.key)) open.set(m.key, t);
    } else if (CLOSES.includes(m.type)) {
      const s = open.get(m.key);
      if (s !== undefined) {
        segments.set(m.key, [...(segments.get(m.key) ?? []), [s, t]]);
        open.delete(m.key);
      }
    }
  });
  open.forEach((s, key) => segments.set(key, [...(segments.get(key) ?? []), [s, Math.max(s, now)]]));
  return segments;
}

export function buildHistory(days: string[], src: HistorySource, now: number = Date.now()) {
  const today = todayKey(new Date(now));
  const marks = collectTaskMarks(src.tasks, src.events);
  const segments = segmentsByTask(marks, now);
  const result = new Map<string, DayHistory>();

  days.forEach((date) => {
    const start = dayStart(date);
    const end = dayEnd(date);
    const timeline: TimelineEntry[] = [];

    const sessions = src.sessions.filter((s) => s.work_date === date);
    sessions.forEach((s) => {
      timeline.push({ id: `${s.id}-in`, at: s.check_in_at, label: "출근", kind: "work" });
      if (s.check_out_at) timeline.push({ id: `${s.id}-out`, at: s.check_out_at, label: "퇴근", kind: "work" });
    });
    const workSeconds = sessions.reduce((acc, s) => {
      if (s.duration_seconds !== null) return acc + s.duration_seconds;
      // 오늘 근무 중인 세션만 지금까지 시간을 더한다 (지난 날 퇴근 누락은 추정하지 않는다)
      if (!s.check_out_at && date === today) return acc + Math.max(0, Math.floor((now - ms(s.check_in_at)) / 1000));
      return acc;
    }, 0);

    const activitySeconds: Record<ActivityType, number> = { study: 0, exercise: 0, break: 0, personal: 0 };
    src.activities
      .filter((a) => a.activity_date === date)
      .forEach((a) => {
        const name = ACTIVITY_LABEL[a.type];
        timeline.push({ id: `${a.id}-s`, at: a.started_at, label: `${name} 시작`, kind: "activity" });
        if (a.ended_at) timeline.push({ id: `${a.id}-e`, at: a.ended_at, label: `${name} 종료`, kind: "activity" });
        activitySeconds[a.type] += a.duration_seconds ?? 0;
      });

    const items = new Map<string, DayTaskItem>();
    const touch = (key: string, title: string, category: TaskCategory | null) => {
      if (!items.has(key)) items.set(key, { key, title, category, seconds: 0, completed: false });
      return items.get(key)!;
    };

    marks
      .filter((m) => ms(m.at) >= start && ms(m.at) < end)
      .forEach((m) => {
        timeline.push({
          id: m.id,
          at: m.at,
          label: `${m.title} ${EVENT_LABEL[m.type]}`,
          kind: "task",
          tone: m.type === "complete" ? "done" : m.type === "pause" ? "paused" : undefined,
        });
        const item = touch(m.key, m.title, m.category);
        if (m.type === "complete") item.completed = true;
        else if (m.type === "reopen" || OPENS.includes(m.type)) item.completed = false;
      });

    // 그날에 걸친 작업 구간 — 전날 시작해 그날 이어진 업무도 포함
    segments.forEach((list, key) => {
      const seconds = Math.floor(list.reduce((acc, [a, b]) => acc + overlap(a, b, start, end), 0) / 1000);
      if (seconds <= 0) return;
      const last = [...marks].reverse().find((m) => m.key === key);
      if (last) touch(key, last.title, last.category).seconds = seconds;
    });

    const tasks = [...items.values()];
    result.set(date, {
      date,
      timeline: timeline.sort((a, b) => ms(a.at) - ms(b.at)),
      workSeconds,
      tasks,
      completedCount: tasks.filter((t) => t.completed).length,
      activitySeconds,
    });
  });

  return result;
}
