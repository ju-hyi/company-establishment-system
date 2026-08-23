import { useState } from "react";

export default function LeftSidebar() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "회사 입금", completed: false },
    { id: 2, title: "AA 방송 확인", completed: false },
    { id: 3, title: "BAI 입금 확인", completed: true },
    { id: 4, title: "CAI 전직 전문", completed: false },
    { id: 5, title: "DAI 재신청 확인", completed: false },
    { id: 6, title: "마감 자료 작성", completed: false },
  ]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Today's Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              오늘 할일
            </h3>
            <span className="text-sm font-semibold text-gray-500">{completedCount}/{totalCount}</span>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => toggleTask(task.id)}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {}}
                  className="w-5 h-5 rounded accent-blue-500"
                />
                <span
                  className={`text-sm ${
                    task.completed
                      ? "line-through text-gray-400"
                      : "text-gray-700"
                  }`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Schedule */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            개인 일정
          </h3>
          <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg text-center">
            일정이 없습니다
          </div>
        </div>

        {/* Progress */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            오늘의 진행률
          </h3>
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-32 h-32">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
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
                <span className="text-3xl font-bold text-gray-900">
                  {progressPercent}%
                </span>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-green-500 font-semibold">{completedCount}</p>
                <p className="text-gray-600">진행중</p>
              </div>
              <div className="text-center">
                <p className="text-blue-500 font-semibold">
                  {totalCount - completedCount}
                </p>
                <p className="text-gray-600">진행중</p>
              </div>
              <div className="text-center">
                <p className="text-orange-500 font-semibold">1</p>
                <p className="text-gray-600">예정</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Watch */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">👥</span>
            오늘의 감시
          </h3>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-gray-700 mb-3">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-2xl">👧</span>
                오늘도 짜증이 있었나!
              </p>
              <p className="text-gray-600">꼭짜 비영이와는 좀!</p>
            </div>
            <button className="w-full bg-white text-purple-600 font-semibold py-2 rounded-lg hover:bg-purple-50 border border-purple-200">
              자세히 보기
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
