import { useEffect, useState } from "react";
import { Clock, Plus } from "lucide-react";
import { formatDate, formatTime, formatDuration } from "../utils/helpers";

interface RightSidebarProps {
  isCheckedIn: boolean;
  checkInAt: string | null;
  elapsedSeconds: number;
  onAddTask: (title: string) => void;
}

export default function RightSidebar({
  isCheckedIn,
  checkInAt,
  elapsedSeconds,
  onAddTask,
}: RightSidebarProps) {
  const [now, setNow] = useState(new Date());
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const submit = () => {
    if (!draft.trim()) return;
    onAddTask(draft);
    setDraft("");
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
