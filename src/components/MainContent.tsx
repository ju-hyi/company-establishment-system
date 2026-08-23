import { useEffect, useState } from "react";
import { formatDuration, formatTime } from "../utils/helpers";
import type { ActivityType, CharacterState } from "../types";
import type { useTasks } from "../hooks/useTasks";
import type { useWorkSession } from "../hooks/useWorkSession";
import type { useActivities } from "../hooks/useActivities";
import type { Stats } from "../hooks/useStats";

interface MainContentProps {
  tasks: ReturnType<typeof useTasks>;
  work: ReturnType<typeof useWorkSession>;
  activities: ReturnType<typeof useActivities>;
  stats: Stats;
  onDataChange: () => void;
}

const ACTIVITY_OPTIONS: {
  id: ActivityType;
  name: string;
  icon: string;
  color: string;
}[] = [
  { id: "study", name: "공부", icon: "📚", color: "bg-purple-100 border-purple-400" },
  { id: "exercise", name: "운동", icon: "🏃", color: "bg-orange-100 border-orange-400" },
  { id: "break", name: "휴식", icon: "☕", color: "bg-green-100 border-green-400" },
  { id: "personal", name: "개인일", icon: "🧹", color: "bg-pink-100 border-pink-400" },
];

const LOCATION_LABEL: Record<CharacterState["location"], string> = {
  entrance: "🚪 출입구",
  desk: "🪑 내 자리",
  meeting: "🤝 회의실",
  break_room: "☕ 휴게실",
  storage: "📚 자료실",
  outside: "🏠 퇴근",
};

const ACTIVITY_EMOJI: Record<CharacterState["activity"], string> = {
  idle: "😊",
  walking: "🚶",
  working: "💼",
  studying: "📚",
  exercising: "💪",
  resting: "☕",
  leaving: "👋",
};

const ACTIVITY_SCENE: Record<
  ActivityType,
  { location: CharacterState["location"]; activity: CharacterState["activity"]; pos: { x: number; y: number }; message: string }
> = {
  study: { location: "storage", activity: "studying", pos: { x: 68, y: 62 }, message: "📚 공부 중이에요!" },
  exercise: { location: "break_room", activity: "exercising", pos: { x: 28, y: 62 }, message: "🏃 운동 중입니다!" },
  break: { location: "break_room", activity: "resting", pos: { x: 28, y: 62 }, message: "☕ 잠깐 쉬어갈게요~" },
  personal: { location: "desk", activity: "idle", pos: { x: 50, y: 30 }, message: "🧹 개인일을 처리 중입니다." },
};

export default function MainContent({
  tasks,
  work,
  activities,
  stats,
  onDataChange,
}: MainContentProps) {
  const [now, setNow] = useState(new Date());
  const [character, setCharacter] = useState<CharacterState>({
    location: "entrance",
    activity: "idle",
    message: "안녕하세요! 오늘도 화이팅! 💪",
    messageEndTime: Date.now() + 5000,
  });
  const [characterPos, setCharacterPos] = useState({ x: 18, y: 30 });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 새로고침 후에도 서버 상태에 맞춰 캐릭터를 복구한다.
  useEffect(() => {
    if (work.loading || activities.loading || tasks.loading) return;

    if (activities.activity) {
      const scene = ACTIVITY_SCENE[activities.activity.type];
      setCharacter((prev) => ({ ...scene, messageEndTime: prev.messageEndTime }));
      setCharacterPos(scene.pos);
      return;
    }

    if (tasks.activeTask) {
      setCharacter((prev) => ({
        location: "meeting",
        activity: "working",
        message: "이 업무부터 처리해볼게요! 💪",
        messageEndTime: prev.messageEndTime,
      }));
      setCharacterPos({ x: 80, y: 30 });
      return;
    }

    if (work.isCheckedIn) {
      setCharacter((prev) => ({
        location: "desk",
        activity: "idle",
        message: prev.message,
        messageEndTime: prev.messageEndTime,
      }));
      setCharacterPos({ x: 50, y: 30 });
      return;
    }

    setCharacter((prev) => ({
      location: "entrance",
      activity: "idle",
      message: prev.message,
      messageEndTime: prev.messageEndTime,
    }));
    setCharacterPos({ x: 18, y: 30 });
  }, [
    work.loading,
    work.isCheckedIn,
    activities.loading,
    activities.activity?.id,
    tasks.loading,
    tasks.activeTask?.id,
  ]);

  const say = (message: string) =>
    setCharacter((prev) => ({ ...prev, message, messageEndTime: Date.now() + 4000 }));

  const handleCheckIn = async () => {
    await work.checkIn();
    say("출근했어요! 오늘도 열심히 해봅시다! 🎯");
    onDataChange();
  };

  const handleCheckOut = async () => {
    if (activities.activity) await activities.end();
    await work.checkOut();
    setCharacter({
      location: "outside",
      activity: "leaving",
      message: "오늘 하루 수고했어요! 내일 봐요! 👋",
      messageEndTime: Date.now() + 4000,
    });
    setCharacterPos({ x: 18, y: 30 });
    onDataChange();
  };

  const handleStartTask = async (taskId: string) => {
    await tasks.startTask(taskId);
    say("이거부터 처리해볼게요! 💪");
    onDataChange();
  };

  const handleCompleteTask = async (taskId: string) => {
    await tasks.completeTask(taskId);
    say("하나 끝냈어요! 🎉");
    onDataChange();
  };

  const handleStartActivity = async (type: ActivityType) => {
    await activities.start(type);
    say(ACTIVITY_SCENE[type].message);
    onDataChange();
  };

  const handleEndActivity = async () => {
    await activities.end();
    say("활동을 마쳤어요! 🎉");
    onDataChange();
  };

  const showBubble = character.messageEndTime !== undefined && character.messageEndTime > now.getTime();
  const completionRate =
    stats.totalTasks === 0 ? 0 : Math.round((stats.completedTasks / stats.totalTasks) * 100);

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50">
      <div className="p-6 flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">🏢 MY LIVE OFFICE</h2>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              work.isCheckedIn ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full ${
                work.isCheckedIn ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {work.isCheckedIn ? "근무 중" : "퇴근 상태"} · {formatTime(now)}
          </div>
        </div>

        {/* Office Canvas */}
        <div className="h-80 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl shadow-lg relative overflow-hidden border-4 border-amber-300">
          <div className="absolute top-6 left-[10%] -translate-x-1/2 text-center">
            <div className="text-xs font-bold text-gray-600 mb-1">🚪 출입구</div>
            <div className="w-20 h-16 bg-yellow-200 rounded-xl opacity-40 border-2 border-yellow-400" />
          </div>
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
            <div className="text-xs font-bold text-gray-600 mb-1">🪑 내 자리</div>
            <div className="w-24 h-16 bg-blue-200 rounded-xl opacity-40 border-2 border-blue-400" />
          </div>
          <div className="absolute top-6 right-[6%] text-center">
            <div className="text-xs font-bold text-gray-600 mb-1">🤝 회의실</div>
            <div className="w-20 h-16 bg-pink-200 rounded-xl opacity-40 border-2 border-pink-400" />
          </div>
          <div className="absolute bottom-6 left-[24%] -translate-x-1/2 text-center">
            <div className="text-xs font-bold text-gray-600 mb-1">☕ 휴게실</div>
            <div className="w-24 h-16 bg-green-200 rounded-xl opacity-40 border-2 border-green-400" />
          </div>
          <div className="absolute bottom-6 right-[24%] text-center">
            <div className="text-xs font-bold text-gray-600 mb-1">📚 자료실</div>
            <div className="w-20 h-16 bg-purple-200 rounded-xl opacity-40 border-2 border-purple-400" />
          </div>

          <div
            className="absolute flex flex-col items-center transition-all duration-700 ease-in-out"
            style={{
              left: `${characterPos.x}%`,
              top: `${characterPos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {showBubble && (
              <div className="mb-3 bg-white border-2 border-purple-300 rounded-3xl px-4 py-2 text-sm font-semibold text-gray-800 whitespace-nowrap shadow-lg">
                {character.message}
              </div>
            )}
            <div className="w-20 h-20 bg-gradient-to-br from-rose-300 to-pink-300 rounded-full flex items-center justify-center text-5xl shadow-xl border-4 border-white">
              {ACTIVITY_EMOJI[character.activity]}
            </div>
            <p className="mt-2 text-xs font-bold text-gray-700 bg-white px-3 py-1 rounded-full shadow">
              {LOCATION_LABEL[character.location]}
            </p>
          </div>
        </div>

        {/* Check in / out */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={work.isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={work.loading}
            className={`py-4 px-6 rounded-2xl font-bold text-lg transition-all shadow-lg border-2 disabled:opacity-50 ${
              work.isCheckedIn
                ? "bg-red-500 text-white border-red-600 hover:bg-red-600 active:scale-95"
                : "bg-green-500 text-white border-green-600 hover:bg-green-600 active:scale-95"
            }`}
          >
            {work.isCheckedIn ? "🔴 퇴근하기" : "🟢 출근하기"}
          </button>

          <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-200 flex flex-col justify-center">
            <p className="text-xs text-gray-600 font-semibold mb-1">근무시간</p>
            <p className="text-3xl font-bold text-blue-600 font-mono">
              {formatDuration(work.elapsedSeconds)}
            </p>
            {work.session && (
              <p className="text-xs text-gray-500 mt-1">
                출근: {formatTime(work.session.check_in_at)}
              </p>
            )}
          </div>
        </div>

        {/* Activities */}
        <div className="mt-6">
          {activities.activity ? (
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-4 shadow-md border-2 border-blue-400 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-800 mb-1">
                  {ACTIVITY_OPTIONS.find((a) => a.id === activities.activity!.type)?.icon}{" "}
                  {ACTIVITY_OPTIONS.find((a) => a.id === activities.activity!.type)?.name} 진행 중
                </p>
                <p className="text-3xl font-mono font-bold text-blue-600">
                  {formatDuration(activities.elapsedSeconds)}
                </p>
              </div>
              <button
                onClick={handleEndActivity}
                className="px-5 py-3 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition"
              >
                활동 종료
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {ACTIVITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleStartActivity(option.id)}
                  className={`p-4 rounded-2xl shadow-md border-2 transition-all hover:scale-105 ${option.color}`}
                >
                  <p className="text-2xl mb-1">{option.icon}</p>
                  <p className="text-sm font-semibold text-gray-900">{option.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="mt-6 bg-white rounded-2xl p-4 shadow-md border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">📋 오늘 할일</h3>
            <span className="text-sm font-semibold text-gray-500">
              {tasks.completedCount}/{tasks.totalCount}
            </span>
          </div>

          {tasks.tasks.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              오른쪽 패널에서 오늘의 업무를 추가해보세요.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.tasks.map((task) => {
                const isActive = tasks.activeTask?.id === task.id;
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      task.status === "completed"
                        ? "bg-gray-50 border-gray-200 opacity-60"
                        : isActive
                          ? "bg-blue-50 border-blue-400"
                          : "bg-white border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={() =>
                          task.status === "completed"
                            ? tasks.reopenTask(task.id).then(onDataChange)
                            : handleCompleteTask(task.id)
                        }
                        className="w-5 h-5 rounded cursor-pointer accent-blue-500"
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
                        {isActive && (
                          <p className="text-xs text-blue-600 font-mono">
                            ⏱️ {formatDuration(tasks.runningSeconds)}
                          </p>
                        )}
                        {task.status === "completed" && task.duration_seconds !== null && (
                          <p className="text-xs text-gray-400 font-mono">
                            소요 {formatDuration(task.duration_seconds)}
                          </p>
                        )}
                      </div>

                      {task.status !== "completed" && !isActive && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition"
                        >
                          시작
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition"
                        >
                          완료
                        </button>
                      )}
                      <button
                        onClick={() => tasks.removeTask(task.id).then(onDataChange)}
                        className="px-2 py-1 text-gray-400 hover:text-red-500 text-sm transition"
                        aria-label="업무 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly stats */}
        <div className="mt-6 grid grid-cols-4 gap-4 pb-6">
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-4 shadow-md border-2 border-blue-300">
            <p className="text-xs text-blue-700 font-semibold mb-2">주간 근무시간</p>
            <p className="text-2xl font-bold text-blue-600 font-mono">
              {formatDuration(stats.weeklyWorkSeconds)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-4 shadow-md border-2 border-green-300">
            <p className="text-xs text-green-700 font-semibold mb-2">업무 완료율</p>
            <p className="text-2xl font-bold text-green-600">{completionRate}%</p>
            <p className="text-xs text-green-600 mt-1">
              {stats.completedTasks}/{stats.totalTasks}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-4 shadow-md border-2 border-purple-300">
            <p className="text-xs text-purple-700 font-semibold mb-2">📚 공부시간</p>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(stats.studySeconds / 60)}분
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl p-4 shadow-md border-2 border-orange-300">
            <p className="text-xs text-orange-700 font-semibold mb-2">🏃 운동시간</p>
            <p className="text-2xl font-bold text-orange-600">
              {Math.round(stats.exerciseSeconds / 60)}분
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
