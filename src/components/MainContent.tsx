import { useState, useEffect } from "react";
import type { CharacterState, Task } from "../types";

interface TaskWithTimer extends Task {
  timer?: string;
  isActive?: boolean;
  startedAt?: string;
}

export default function MainContent() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [workingTime, setWorkingTime] = useState("00:00:00");
  const [now, setNow] = useState(new Date());
  const [characterState, setCharacterState] = useState<CharacterState>({
    location: "entrance",
    activity: "idle",
    message: "안녕하세요! 오늘도 화이팅! 💪",
    messageEndTime: Date.now() + 5000,
  });
  const [characterPos, setCharacterPos] = useState({ x: 50, y: 50 });
  const [tasks, setTasks] = useState<TaskWithTimer[]>([
    {
      id: "1",
      user_id: "user-123",
      title: "회사 입금 확인",
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "2",
      user_id: "user-123",
      title: "AA 방송 확인",
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "3",
      user_id: "user-123",
      title: "BAI 입금 확인",
      status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activities] = useState([
    { id: "study", name: "📚 공부", icon: "📚", color: "bg-purple-100 border-purple-400" },
    { id: "exercise", name: "🏃 운동", icon: "🏃", color: "bg-orange-100 border-orange-400" },
    { id: "break", name: "☕ 휴식", icon: "☕", color: "bg-green-100 border-green-400" },
    { id: "personal", name: "🧹 개인일", icon: "🧹", color: "bg-pink-100 border-pink-400" },
  ]);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [activityTimer, setActivityTimer] = useState("00:00:00");
  const [activityStartTime, setActivityStartTime] = useState<string | null>(null);
  const [stats] = useState({
    weeklyWorkHours: "35:42",
    completedTasks: 7,
    totalTasks: 12,
    studyMinutes: 120,
    exerciseMinutes: 45,
    breakMinutes: 30,
  });

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 업무 타이머 업데이트
  useEffect(() => {
    if (!activeTaskId) return;

    const updateTimer = () => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === activeTaskId && task.startedAt) {
            const elapsed = Math.floor(
              (Date.now() - new Date(task.startedAt).getTime()) / 1000
            );
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            return {
              ...task,
              timer: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
            };
          }
          return task;
        })
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeTaskId]);

  // 개인 활동 타이머 업데이트
  useEffect(() => {
    if (!activeActivityId || !activityStartTime) return;

    const updateActivityTimer = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(activityStartTime).getTime()) / 1000
      );
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      setActivityTimer(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    updateActivityTimer();
    const interval = setInterval(updateActivityTimer, 1000);
    return () => clearInterval(interval);
  }, [activeActivityId, activityStartTime]);

  // 근무 시간 계산
  useEffect(() => {
    if (!isCheckedIn || !checkInTime) return;

    const updateWorkingTime = () => {
      const checkIn = new Date(checkInTime);
      const diff = Date.now() - checkIn.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setWorkingTime(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    updateWorkingTime();
    const timer = setInterval(updateWorkingTime, 1000);
    return () => clearInterval(timer);
  }, [isCheckedIn, checkInTime]);

  // 출근 처리
  const handleCheckIn = () => {
    const now = new Date().toISOString();
    setCheckInTime(now);
    setIsCheckedIn(true);
    setCharacterState({
      location: "desk",
      activity: "working",
      message: "출근했어요! 오늘도 열심히 해봅시다! 🎯",
      messageEndTime: Date.now() + 4000,
    });
    setCharacterPos({ x: 30, y: 50 });
  };

  // 퇴근 처리
  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setActiveTaskId(null);
    setCharacterState({
      location: "outside",
      activity: "leaving",
      message: "오늘 하루 수고했어요! 내일 봐요! 👋",
      messageEndTime: Date.now() + 4000,
    });
    setCharacterPos({ x: 80, y: 50 });
  };

  // 업무 시작
  const handleStartTask = (taskId: string) => {
    setActiveTaskId(taskId);
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "in_progress",
              startedAt: new Date().toISOString(),
              timer: "00:00:00",
            }
          : task
      )
    );

    setCharacterState({
      location: "meeting",
      activity: "working",
      message: "이 업무부터 처리해볼게요! 💪",
      messageEndTime: Date.now() + 3000,
    });
    setCharacterPos({ x: 75, y: 40 });
  };

  // 업무 완료
  const handleCompleteTask = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: "completed", timer: undefined, startedAt: undefined }
          : task
      )
    );

    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      setCharacterState({
        location: "desk",
        activity: "idle",
        message: "하나 끝냈어요! 다음 업무 시작할게요! 🎉",
        messageEndTime: Date.now() + 3000,
      });
      setCharacterPos({ x: 30, y: 50 });
    }
  };

  // 개인 활동 시작
  const handleStartActivity = (activityId: string) => {
    setActiveActivityId(activityId);
    setActivityStartTime(new Date().toISOString());
    setActivityTimer("00:00:00");

    const activity = activities.find((a) => a.id === activityId);
    const locationMap: Record<string, "break_room" | "storage" | "desk"> = {
      study: "storage",
      exercise: "break_room",
      break: "break_room",
      personal: "desk",
    };

    const activityMap: Record<string, string> = {
      study: "📚 공부 중이에요!",
      exercise: "🏃 운동 중입니다!",
      break: "☕ 잠깐 쉬어갈게요~",
      personal: "🧹 개인일을 처리 중입니다.",
    };

    setCharacterState({
      location: (locationMap[activityId] || "break_room") as any,
      activity: "studying",
      message: activityMap[activityId] || activity?.name || "활동 중이에요!",
      messageEndTime: Date.now() + 3000,
    });

    const positions: Record<string, { x: number; y: number }> = {
      study: { x: 65, y: 30 },
      exercise: { x: 50, y: 70 },
      break: { x: 45, y: 60 },
      personal: { x: 30, y: 50 },
    };
    setCharacterPos(positions[activityId] || { x: 50, y: 50 });
  };

  // 개인 활동 종료
  const handleEndActivity = () => {
    setActiveActivityId(null);
    setActivityStartTime(null);
    setActivityTimer("00:00:00");

    setCharacterState({
      location: "desk",
      activity: "idle",
      message: "활동을 마쳤어요! 🎉",
      messageEndTime: Date.now() + 3000,
    });
    setCharacterPos({ x: 30, y: 50 });
  };

  const getLocationLabel = (location: string) => {
    const labels: Record<string, string> = {
      entrance: "🚪 출입구",
      desk: "🪑 내 자리",
      meeting: "🤝 회의실",
      break_room: "☕ 휴게실",
      storage: "📚 자료실",
      outside: "🏠 퇴근",
    };
    return labels[location] || location;
  };

  const getActivityEmoji = (activity: string) => {
    const emojis: Record<string, string> = {
      idle: "😊",
      walking: "🚶",
      working: "💼",
      studying: "📚",
      exercising: "💪",
      resting: "☕",
      leaving: "👋",
    };
    return emojis[activity] || "😊";
  };

  const formatTime = (date: Date) => {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50">
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">🏢 MY LIVE OFFICE</h2>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold animate-pulse ${
                isCheckedIn
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${
                  isCheckedIn ? "bg-green-500" : "bg-gray-400"
                }`}
              ></span>
              {isCheckedIn ? "근무 중" : "퇴근 상태"} · {formatTime(now)}
            </div>
          </div>
        </div>

        {/* Main Office Canvas */}
        <div className="flex-1 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl shadow-lg p-12 relative overflow-hidden border-4 border-amber-300">
          {/* Room Zones */}
          <div className="absolute top-10 left-10 text-center">
            <div className="text-sm font-bold text-gray-600 mb-2">🚪 출입구</div>
            <div className="w-20 h-20 bg-yellow-200 rounded-xl opacity-40 border-2 border-yellow-400"></div>
          </div>

          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-sm font-bold text-gray-600 mb-2">🪑 내 자리</div>
            <div className="w-24 h-20 bg-blue-200 rounded-xl opacity-40 border-2 border-blue-400"></div>
          </div>

          <div className="absolute top-10 right-10 text-center">
            <div className="text-sm font-bold text-gray-600 mb-2">🤝 회의실</div>
            <div className="w-20 h-20 bg-pink-200 rounded-xl opacity-40 border-2 border-pink-400"></div>
          </div>

          <div className="absolute bottom-10 left-1/4 transform -translate-x-1/2 text-center">
            <div className="text-sm font-bold text-gray-600 mb-2">☕ 휴게실</div>
            <div className="w-24 h-20 bg-green-200 rounded-xl opacity-40 border-2 border-green-400"></div>
          </div>

          <div className="absolute bottom-10 right-1/4 text-center">
            <div className="text-sm font-bold text-gray-600 mb-2">📚 자료실</div>
            <div className="w-20 h-20 bg-purple-200 rounded-xl opacity-40 border-2 border-purple-400"></div>
          </div>

          {/* Character */}
          <div
            className="absolute flex flex-col items-center transition-all duration-500 group"
            style={{
              left: `${characterPos.x}%`,
              top: `${characterPos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Speech Bubble */}
            {characterState.messageEndTime && characterState.messageEndTime > Date.now() && (
              <div className="mb-4 bg-white border-3 border-purple-300 rounded-3xl px-4 py-2 text-sm font-semibold text-gray-800 whitespace-nowrap shadow-lg">
                {characterState.message}
              </div>
            )}

            {/* Character Circle */}
            <div className="w-20 h-20 bg-gradient-to-br from-rose-300 to-pink-300 rounded-full flex items-center justify-center text-5xl shadow-xl border-4 border-white hover:scale-110 transition-transform">
              {getActivityEmoji(characterState.activity)}
            </div>

            {/* Status Info */}
            <div className="mt-3 text-center">
              <p className="text-xs font-bold text-gray-700 bg-white px-3 py-1 rounded-full">
                {getLocationLabel(characterState.location)}
              </p>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {/* Check In/Out Button */}
          <button
            onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
            className={`py-4 px-6 rounded-2xl font-bold text-lg transition-all shadow-lg border-2 ${
              isCheckedIn
                ? "bg-red-500 text-white border-red-600 hover:bg-red-600 active:scale-95"
                : "bg-green-500 text-white border-green-600 hover:bg-green-600 active:scale-95"
            }`}
          >
            {isCheckedIn ? "🔴 퇴근하기" : "🟢 출근하기"}
          </button>

          {/* Working Time Display */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-200 flex flex-col justify-center">
            <p className="text-xs text-gray-600 font-semibold mb-1">근무시간</p>
            <p className="text-3xl font-bold text-blue-600 font-mono">{workingTime}</p>
            {checkInTime && (
              <p className="text-xs text-gray-500 mt-1">
                출근: {new Date(checkInTime).toLocaleTimeString("ko-KR")}
              </p>
            )}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="mt-4 bg-white rounded-2xl p-4 shadow-md border-2 border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-gray-600 font-semibold">상태</p>
              <p className="text-lg font-bold text-purple-600 mt-1">
                {isCheckedIn ? "🟢 근무중" : "⚪ 퇴근"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">위치</p>
              <p className="text-lg font-bold text-blue-600 mt-1">
                {getLocationLabel(characterState.location)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">활동</p>
              <p className="text-lg font-bold text-pink-600 mt-1">
                {characterState.activity === "working"
                  ? "💼 업무"
                  : characterState.activity === "studying"
                    ? "📚 공부"
                    : characterState.activity === "resting"
                      ? "☕ 휴식"
                      : "😊 대기"}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {activeActivityId ? (
            <>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-4 shadow-md border-2 border-blue-400">
                <p className="text-sm font-bold text-blue-800 mb-2">활동 중...</p>
                <p className="text-2xl font-mono font-bold text-blue-600 mb-3">
                  {activityTimer}
                </p>
                <button
                  onClick={handleEndActivity}
                  className="w-full px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition"
                >
                  활동 종료
                </button>
              </div>
            </>
          ) : (
            activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => handleStartActivity(activity.id)}
                className={`p-4 rounded-2xl shadow-md border-2 transition-all hover:scale-105 ${activity.color}`}
              >
                <p className="text-2xl mb-2">{activity.icon}</p>
                <p className="text-sm font-semibold text-gray-900">{activity.name}</p>
              </button>
            ))
          )}
        </div>

        {/* Tasks Section */}
        <div className="mt-6 bg-white rounded-2xl p-4 shadow-md border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">📋 오늘 할일</h3>
            <span className="text-sm font-semibold text-gray-500">
              {tasks.filter((t) => t.status === "completed").length}/{tasks.length}
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  task.status === "completed"
                    ? "bg-gray-50 border-gray-200 opacity-60"
                    : activeTaskId === task.id
                      ? "bg-blue-50 border-blue-400"
                      : "bg-white border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() =>
                      handleCompleteTask(task.id)
                    }
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <p
                      className={`font-semibold ${
                        task.status === "completed"
                          ? "line-through text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </p>
                    {activeTaskId === task.id && task.timer && (
                      <p className="text-xs text-blue-600 font-mono">
                        ⏱️ {task.timer}
                      </p>
                    )}
                  </div>
                  {task.status !== "completed" && activeTaskId !== task.id && (
                    <button
                      onClick={() => handleStartTask(task.id)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition"
                    >
                      시작
                    </button>
                  )}
                  {activeTaskId === task.id && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition"
                    >
                      완료
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-4 shadow-md border-2 border-blue-300">
            <p className="text-xs text-blue-700 font-semibold mb-2">주간 근무시간</p>
            <p className="text-3xl font-bold text-blue-600 font-mono">{stats.weeklyWorkHours}</p>
          </div>

          <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-4 shadow-md border-2 border-green-300">
            <p className="text-xs text-green-700 font-semibold mb-2">업무 완료율</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
            </p>
            <p className="text-xs text-green-600 mt-1">
              {stats.completedTasks}/{stats.totalTasks}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-4 shadow-md border-2 border-purple-300">
            <p className="text-xs text-purple-700 font-semibold mb-2">📚 공부시간</p>
            <p className="text-2xl font-bold text-purple-600">{stats.studyMinutes}분</p>
          </div>

          <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl p-4 shadow-md border-2 border-orange-300">
            <p className="text-xs text-orange-700 font-semibold mb-2">🏃 운동시간</p>
            <p className="text-2xl font-bold text-orange-600">{stats.exerciseMinutes}분</p>
          </div>
        </div>
      </div>
    </main>
  );
}
