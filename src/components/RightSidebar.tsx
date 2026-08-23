import { useEffect, useState } from "react";
import { Clock, Plus } from "lucide-react";
import { formatDate, formatTime, formatDuration } from "../utils/helpers";
import type { Schedule } from "../types";

interface RightSidebarProps {
  isCheckedIn: boolean;
  checkInAt: string | null;
  elapsedSeconds: number;
  onAddTask: (title: string) => void;
  schedules: Schedule[];
  onAddSchedule: (title: string, startTime?: string) => void;
  onRemoveSchedule: (id: string) => void;
}

export default function RightSidebar({
  isCheckedIn,
  checkInAt,
  elapsedSeconds,
  onAddTask,
  schedules,
  onAddSchedule,
  onRemoveSchedule,
}: RightSidebarProps) {
  const [now, setNow] = useState(new Date());
  const [draft, setDraft] = useState("");
  const [scheduleDraft, setScheduleDraft] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const submit = () => {
    if (!draft.trim()) return;
    onAddTask(draft);
    setDraft("");
  };

  const submitSchedule = () => {
    if (!scheduleDraft.trim()) return;
    onAddSchedule(scheduleDraft, scheduleTime || undefined);
    setScheduleDraft("");
    setScheduleTime("");
  };

  return (
    <aside className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">{formatDate(now)}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {formatTime(now).split(":")[0]}
            </span>
            <span className="text-2xl font-bold text-gray-600">
              {formatTime(now).split(":")[1]}
            </span>
            <span className="text-lg font-medium text-gray-500">
              {now.getHours() < 12 ? "AM" : "PM"}
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-900 mb-3">업무 추가</h3>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="할 일을 입력하세요"
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={submit}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              aria-label="업무 추가"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-900 mb-3">📅 오늘의 일정</h3>

          <div className="flex gap-2 mb-3">
            <input
              value={scheduleDraft}
              onChange={(e) => setScheduleDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSchedule()}
              placeholder="일정 제목"
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={submitSchedule}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              aria-label="일정 추가"
            >
              <Plus size={18} />
            </button>
          </div>
          <input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          {schedules.length === 0 ? (
            <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg text-center">
              등록된 일정이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg p-3"
                >
                  <div className="flex-1 min-w-0">
                    {s.start_time && (
                      <p className="text-xs font-bold text-purple-700">
                        {s.start_time.slice(0, 5)}
                      </p>
                    )}
                    <p className="text-sm font-medium text-gray-900 break-words">{s.title}</p>
                  </div>
                  <button
                    onClick={() => onRemoveSchedule(s.id)}
                    className="text-gray-400 hover:text-red-500 text-sm transition shrink-0"
                    aria-label="일정 삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={18} />
            근무 시간
          </h3>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">출근 시간</span>
              <span className="font-semibold text-gray-900">
                {checkInAt ? formatTime(checkInAt) : "--:--"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">상태</span>
              <span
                className={`font-semibold ${isCheckedIn ? "text-green-600" : "text-gray-500"}`}
              >
                {isCheckedIn ? "근무 중" : "퇴근"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">경과 시간</span>
              <span className="font-semibold text-blue-600 font-mono">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
