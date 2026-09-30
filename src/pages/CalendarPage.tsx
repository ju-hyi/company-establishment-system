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
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardTitle, Empty, PageHeader, SCHEDULE_CATEGORY, inputClass } from "../components/ui";
import { useMonthSchedules, type ScheduleInput } from "../hooks/useMonthSchedules";
import { todayKey } from "../utils/helpers";
import type { Schedule, ScheduleCategory } from "../types";

/**
 * 캘린더 — 일정을 추가 · 수정 · 삭제하는 관리 페이지.
 * 오늘 날짜 일정은 라이브 오피스 "오늘의 일정"에 그대로 보인다.
 */

interface CalendarPageProps {
  userId: string;
  /** 일정이 바뀌면 대시보드의 오늘 일정을 다시 읽게 한다. */
  onChanged: () => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const CATEGORIES = Object.keys(SCHEDULE_CATEGORY) as ScheduleCategory[];

const emptyForm = (date: string): ScheduleInput => ({
  title: "",
  schedule_date: date,
  start_time: null,
  end_time: null,
  category: "work",
  memo: null,
});

const fromSchedule = (s: Schedule): ScheduleInput => ({
  title: s.title,
  schedule_date: s.schedule_date,
  start_time: s.start_time?.slice(0, 5) ?? null,
  end_time: s.end_time?.slice(0, 5) ?? null,
  category: s.category,
  memo: s.memo,
});

export default function CalendarPage({ userId, onChanged }: CalendarPageProps) {
  const today = todayKey();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today);
  const [form, setForm] = useState<ScheduleInput>(() => emptyForm(today));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { schedules, loading, add, update, remove } = useMonthSchedules(userId, month);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  const byDate = new Map<string, Schedule[]>();
  schedules.forEach((s) => byDate.set(s.schedule_date, [...(byDate.get(s.schedule_date) ?? []), s]));
  const daySchedules = byDate.get(selected) ?? [];

  const selectDate = (key: string) => {
    setSelected(key);
    if (!editingId) setForm((f) => ({ ...f, schedule_date: key }));
  };

  const resetForm = (date = selected) => {
    setEditingId(null);
    setForm(emptyForm(date));
  };

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
      onChanged();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요. 잠시 후 다시 시도해주세요.");
      return false;
    }
  };

  const submit = async () => {
    if (!form.title.trim() || !form.schedule_date) return;
    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      setError("끝나는 시간은 시작 시간보다 뒤여야 해요.");
      return;
    }
    const input = { ...form, memo: form.memo?.trim() || null };
    const ok = await run(() => (editingId ? update(editingId, input) : add(input)));
    if (ok) {
      const target = input.schedule_date;
      setSelected(target);
      if (!isSameMonth(new Date(`${target}T00:00:00`), month))
        setMonth(startOfMonth(new Date(`${target}T00:00:00`)));
      resetForm(target);
    }
  };

  const goMonth = (next: Date) => {
    setMonth(startOfMonth(next));
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="캘린더"
        description="날짜와 시간을 정해 일정을 관리합니다. 오늘 일정은 라이브 오피스에 표시돼요."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* 월간 달력 */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => goMonth(addMonths(month, -1))}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="이전 달"
              >
                <ChevronLeft size={18} />
              </button>
              <h3 className="w-32 text-center text-lg font-bold text-gray-900">
                {format(month, "yyyy년 M월", { locale: ko })}
              </h3>
              <button
                onClick={() => goMonth(addMonths(month, 1))}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="다음 달"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={() => {
                goMonth(new Date());
                selectDate(today);
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            >
              오늘
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-semibold">
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className={`pb-2 ${i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className={`grid grid-cols-7 gap-1 ${loading ? "opacity-60" : ""}`}>
            {days.map((day) => {
              const key = todayKey(day);
              const items = byDate.get(key) ?? [];
              const inMonth = isSameMonth(day, month);
              const isSelected = key === selected;
              const isToday = key === today;
              const dow = day.getDay();
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (!inMonth) goMonth(day);
                    selectDate(key);
                  }}
                  className={`flex min-h-[64px] flex-col items-stretch rounded-xl p-1.5 text-left transition sm:min-h-[86px] ${
                    isSelected ? "bg-rose-50 ring-2 ring-rose-300" : "hover:bg-[#faf7f4]"
                  } ${inMonth ? "" : "opacity-35"}`}
                >
                  <span
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday
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
                  <span className="hidden space-y-0.5 sm:block">
                    {items.slice(0, 2).map((s) => (
                      <span
                        key={s.id}
                        className={`block truncate rounded px-1 text-[10px] font-medium ${SCHEDULE_CATEGORY[s.category].tile} ${SCHEDULE_CATEGORY[s.category].text}`}
                      >
                        {s.start_time ? `${s.start_time.slice(0, 5)} ` : ""}
                        {s.title}
                      </span>
                    ))}
                    {items.length > 2 && (
                      <span className="block px-1 text-[10px] text-gray-400">+{items.length - 2}</span>
                    )}
                  </span>
                  {items.length > 0 && (
                    <span className="flex gap-0.5 px-1 sm:hidden">
                      {items.slice(0, 3).map((s) => (
                        <span key={s.id} className={`h-1.5 w-1.5 rounded-full ${SCHEDULE_CATEGORY[s.category].dot}`} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          {/* 선택한 날짜의 일정 */}
          <Card>
            <CardTitle>
              {format(new Date(`${selected}T00:00:00`), "M월 d일 (EEE)", { locale: ko })}
              {selected === today && (
                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">오늘</span>
              )}
            </CardTitle>
            {daySchedules.length === 0 ? (
              <Empty>이 날은 일정이 없어요</Empty>
            ) : (
              <ul className="space-y-2">
                {daySchedules.map((s) => {
                  const cat = SCHEDULE_CATEGORY[s.category];
                  return (
                    <li
                      key={s.id}
                      className={`flex items-start gap-3 rounded-xl border-l-[3px] px-3 py-2.5 ${cat.tile} ${cat.bar} ${
                        editingId === s.id ? "ring-2 ring-rose-200" : ""
                      }`}
                    >
                      <span className="w-11 shrink-0 font-mono text-sm font-semibold text-gray-700">
                        {s.start_time ? s.start_time.slice(0, 5) : "종일"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-gray-900">{s.title}</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {cat.label}
                          {s.end_time && ` · ~${s.end_time.slice(0, 5)}`}
                          {s.memo && ` · ${s.memo}`}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(s.id);
                          setForm(fromSchedule(s));
                          setError(null);
                        }}
                        className="rounded-md p-1 text-gray-400 hover:bg-white hover:text-gray-700"
                        aria-label="일정 수정"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`'${s.title}' 일정을 삭제할까요?`)) return;
                          run(() => remove(s.id)).then(() => {
                            if (editingId === s.id) resetForm();
                          });
                        }}
                        className="rounded-md p-1 text-gray-400 hover:bg-white hover:text-rose-500"
                        aria-label="일정 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* 일정 추가 / 수정 */}
          <Card>
            <CardTitle>
              {editingId ? (
                <>
                  <Pencil size={15} className="text-rose-400" /> 일정 수정
                </>
              ) : (
                <>
                  <Plus size={16} className="text-rose-400" /> 일정 추가
                </>
              )}
            </CardTitle>

            <div className="space-y-2.5">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submit()}
                placeholder="일정 제목 (예: 팀 주간 회의)"
                className={inputClass}
                aria-label="일정 제목"
              />
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-gray-500">날짜</span>
                <input
                  type="date"
                  value={form.schedule_date}
                  onChange={(e) => setForm({ ...form, schedule_date: e.target.value })}
                  className={inputClass}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-500">시작 시간</span>
                  <input
                    type="time"
                    value={form.start_time ?? ""}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value || null })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-gray-500">끝나는 시간</span>
                  <input
                    type="time"
                    value={form.end_time ?? ""}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value || null })}
                    className={inputClass}
                  />
                </label>
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold text-gray-500">분류</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => {
                    const meta = SCHEDULE_CATEGORY[c];
                    const active = form.category === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setForm({ ...form, category: c })}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          active ? `${meta.tile} ${meta.text} ring-1 ring-current` : "bg-[#faf7f4] text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <input
                value={form.memo ?? ""}
                onChange={(e) => setForm({ ...form, memo: e.target.value || null })}
                placeholder="메모 · 장소 (선택)"
                className={inputClass}
                aria-label="메모"
              />

              {error && <p className="text-xs text-rose-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                {editingId && (
                  <button
                    onClick={() => resetForm()}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={submit}
                  disabled={!form.title.trim() || !form.schedule_date}
                  className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-40"
                >
                  {editingId ? "수정 저장" : "일정 추가"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
