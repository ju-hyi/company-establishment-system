import type { Task } from "../types";

interface LeftSidebarProps {
  tasks: Task[];
  completedCount: number;
  totalCount: number;
  onToggle: (task: Task) => void;
}

export default function LeftSidebar({
  tasks,
  completedCount,
  totalCount,
  onToggle,
}: LeftSidebarProps) {
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              오늘 할일
            </h3>
            <span className="text-sm font-semibold text-gray-500">
              {completedCount}/{totalCount}
            </span>
          </div>

          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg text-center">
              등록된 업무가 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => onToggle(task)}
                >
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => onToggle(task)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded accent-blue-500"
                  />
                  <span
                    className={`text-sm ${
                      task.status === "completed"
                        ? "line-through text-gray-400"
                        : "text-gray-700"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            오늘의 진행률
          </h3>
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${(progressPercent / 100) * 283} 283`}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{progressPercent}%</span>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-green-500 font-semibold">{completedCount}</p>
                <p className="text-gray-600">완료</p>
              </div>
              <div className="text-center">
                <p className="text-blue-500 font-semibold">{inProgress}</p>
                <p className="text-gray-600">진행중</p>
              </div>
              <div className="text-center">
                <p className="text-orange-500 font-semibold">{pending}</p>
                <p className="text-gray-600">대기</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
