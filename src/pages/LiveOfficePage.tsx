import { useEffect, useRef, useState } from "react";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import OfficeScene from "../components/OfficeScene";
import DashboardBottom from "../components/DashboardBottom";
import { ACTIVITY_LABEL } from "../hooks/useStats";
import { formatDuration, todayKey } from "../utils/helpers";
import type { ActivityType, CharacterState } from "../types";
import type { PageId } from "../components/ui";
import type { useTasks } from "../hooks/useTasks";
import type { useWorkSession } from "../hooks/useWorkSession";
import type { useActivities } from "../hooks/useActivities";
import type { useSchedules } from "../hooks/useSchedules";
import type { Stats } from "../hooks/useStats";

/**
 * 라이브 오피스 — 오늘 상황을 한눈에 보는 대시보드.
 *
 *   왼쪽  : 오늘 할 일 + 오늘의 진행률
 *   가운데: LIVE OFFICE 회사 맵 (디자인은 OfficeScene 그대로)
 *   오른쪽: 날짜·시각 + 오늘의 일정 + 근무 시간 + 지금 하는 일
 *   아래  : 업무 히스토리 + 이번 주 통계 + 이번 주 활동
 *
 * 업무·일정 등록 UI 는 두지 않는다. 등록/수정은 "오늘 할 일" · "캘린더" 페이지에서 한다.
 */

interface LiveOfficePageProps {
  tasks: ReturnType<typeof useTasks>;
  work: ReturnType<typeof useWorkSession>;
  activities: ReturnType<typeof useActivities>;
  schedules: ReturnType<typeof useSchedules>;
  stats: Stats;
  onDataChange: () => void;
  onNavigate: (page: PageId) => void;
}

type Scene = Pick<CharacterState, "location" | "activity">;

const ACTIVITY_SCENE: Record<ActivityType, Scene> = {
  study: { location: "storage", activity: "studying" },
  exercise: { location: "break_room", activity: "exercising" },
  break: { location: "break_room", activity: "resting" },
  personal: { location: "desk", activity: "working" },
};

const ACTIVITY_OPTIONS: { id: ActivityType; icon: string }[] = [
  { id: "study", icon: "📚" },
  { id: "exercise", icon: "🏃" },
  { id: "break", icon: "☕" },
  { id: "personal", icon: "🧹" },
];

const LOCATION_LABEL: Record<CharacterState["location"], string> = {
  meeting: "회의실",
  break_room: "휴게실",
  storage: "공부·자기계발",
  desk: "회계팀 자리",
  entrance: "출입구",
  outside: "밖",
};

export default function LiveOfficePage({
  tasks,
  work,
  activities,
  schedules,
  stats,
  onDataChange,
  onNavigate,
}: LiveOfficePageProps) {
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  // 캐릭터 위치는 서버 상태(출근 · 활동 · 진행중 업무)에서 바로 계산한다.
  const scene: Scene = activities.activity
    ? ACTIVITY_SCENE[activities.activity.type]
    : tasks.activeTask
      ? { location: "meeting", activity: "working" }
      : work.isCheckedIn
        ? { location: "desk", activity: "working" }
        : { location: "entrance", activity: leaving ? "leaving" : "idle" };

  // 퇴근한 뒤에도 오늘 기록(첫 출근 · 마지막 퇴근 · 합계)은 보여준다.
  const todaySessions = stats.sessions
    .filter((s) => s.work_date === todayKey())
    .sort((a, b) => a.check_in_at.localeCompare(b.check_in_at));
  const firstCheckIn = todaySessions[0]?.check_in_at ?? null;
  const lastCheckOut = todaySessions.filter((s) => s.check_out_at).pop()?.check_out_at ?? null;
  const todayWorked = todaySessions.reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0);

  const doingText = activities.activity
    ? `${ACTIVITY_LABEL[activities.activity.type]} 중`
    : tasks.activeTask
      ? `'${tasks.activeTask.title}' 처리 중`
      : work.isCheckedIn
        ? "자리에서 업무 중"
        : lastCheckOut
          ? "오늘 업무 종료"
          : "출근 전";

  const handleCheckIn = async () => {
    await work.checkIn();
    onDataChange();
  };

  const handleCheckOut = async () => {
    if (activities.activity) await activities.end();
    await work.checkOut();
    setLeaving(true);
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setLeaving(false), 4200);
    onDataChange();
  };

  const handleStartActivity = async (type: ActivityType) => {
    await activities.start(type);
    onDataChange();
  };

  const handleEndActivity = async () => {
    await activities.end();
    onDataChange();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[260px_minmax(0,1fr)_284px]">
        {/* 가운데 — LIVE OFFICE (작은 화면에서는 가장 위) */}
        <section className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#f0e8e2] md:col-span-2 xl:order-2 xl:col-span-1">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900">LIVE OFFICE</h2>
            <span
              className={`flex items-center gap-1.5 text-sm font-semibold ${
                work.isCheckedIn ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${work.isCheckedIn ? "animate-pulse bg-emerald-500" : "bg-gray-300"}`}
              />
              {work.isCheckedIn ? "근무 중" : lastCheckOut ? "퇴근" : "출근 전"}
            </span>
            {work.isCheckedIn && (
              <span className="font-mono text-sm font-semibold text-gray-700">
                {formatDuration(work.elapsedSeconds)}
              </span>
            )}
          </div>

          <OfficeScene location={scene.location} activity={scene.activity} />

          {/* 내 상태 + 지금 하는 일 전환 — 누르면 캐릭터가 해당 공간으로 이동한다 */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl bg-[#fdf6f3] px-4 py-2.5 text-sm">
            <p className="min-w-0 truncate text-gray-600">
              <span className="mr-1.5 inline-block rounded-full bg-rose-400 px-2 py-0.5 text-[11px] font-bold text-white">
                나
              </span>
              <span className="font-semibold text-gray-800">{LOCATION_LABEL[scene.location]}</span>
              <span className="mx-1.5 text-gray-300">·</span>
              {doingText}
              {activities.activity ? (
                <span className="ml-2 font-mono text-xs font-semibold text-violet-500">
                  {formatDuration(activities.elapsedSeconds)}
                </span>
              ) : (
                tasks.activeTask && (
                  <span className="ml-2 font-mono text-xs font-semibold text-blue-500">
                    {formatDuration(tasks.runningSeconds)}
                  </span>
                )
              )}
            </p>

            {activities.activity ? (
              <button
                onClick={handleEndActivity}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
              >
                {ACTIVITY_LABEL[activities.activity.type]} 끝내기
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="mr-0.5 hidden text-xs text-gray-400 sm:inline">지금 하는 일</span>
                {ACTIVITY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleStartActivity(option.id)}
                    className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-[#efe4dc] transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <span>{option.icon}</span>
                    {ACTIVITY_LABEL[option.id]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 왼쪽 */}
        {/* 넓은 화면에서는 맵 높이에 맞추고, 넘치는 목록은 카드 안에서 스크롤한다 */}
        <div className="xl:relative xl:order-1">
          <div className="h-full xl:absolute xl:inset-0">
          <LeftSidebar
            tasks={tasks.tasks}
            activeTaskId={tasks.activeTask?.id ?? null}
            runningSeconds={tasks.runningSeconds}
            onOpenTasks={() => onNavigate("tasks")}
          />
          </div>
        </div>

        {/* 오른쪽 */}
        <div className="xl:relative xl:order-3">
          <div className="h-full xl:absolute xl:inset-0">
          <RightSidebar
            schedules={schedules.schedules}
            isCheckedIn={work.isCheckedIn}
            checkInAt={work.session?.check_in_at ?? firstCheckIn}
            checkOutAt={lastCheckOut}
            elapsedSeconds={work.isCheckedIn ? work.elapsedSeconds : todayWorked}
            workLoading={work.loading}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onOpenCalendar={() => onNavigate("calendar")}
          />
          </div>
        </div>
      </div>

      <DashboardBottom
        stats={stats}
        liveWorkSeconds={work.elapsedSeconds}
        onOpenStats={() => onNavigate("stats")}
      />
    </div>
  );
}
