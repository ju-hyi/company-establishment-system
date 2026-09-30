import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardTitle, Empty, formatHours } from "./ui";
import { formatTime, todayKey } from "../utils/helpers";
import type { Stats, TimelineEntry } from "../hooks/useStats";

/**
 * 라이브 오피스 하단 — 업무 히스토리 · 이번 주 통계 · 이번 주 활동.
 * 모두 원본 기록(useStats)에서 계산한 값을 보여주기만 한다.
 */

interface DashboardBottomProps {
  stats: Stats;
  /** 진행 중인 근무 세션의 경과 시간 — 아직 DB 에 합산되지 않은 오늘 몫 */
  liveWorkSeconds: number;
  onOpenStats: () => void;
}

const KIND_DOT: Record<TimelineEntry["kind"], string> = {
  work: "bg-blue-400",
  task: "bg-amber-400",
  activity: "bg-violet-400",
};

function dotFor(entry: TimelineEntry) {
  if (entry.kind === "task" && entry.label.endsWith("완료")) return "bg-emerald-400";
  return KIND_DOT[entry.kind];
}

export default function DashboardBottom({ stats, liveWorkSeconds, onOpenStats }: DashboardBottomProps) {
  const today = todayKey();
  const daily = stats.daily.map((d) =>
    d.date === today ? { ...d, workSeconds: d.workSeconds + liveWorkSeconds } : d
  );
  const weekWork = stats.weeklyWorkSeconds + liveWorkSeconds;
  const maxDay = Math.max(3600, ...daily.map((d) => d.workSeconds));

  const activityRows = [
    { label: "회사 업무", icon: "🏢", seconds: stats.taskSeconds, bar: "bg-rose-300" },
    { label: "공부", icon: "📚", seconds: stats.studySeconds, bar: "bg-violet-300" },
    { label: "운동", icon: "🏃", seconds: stats.exerciseSeconds, bar: "bg-amber-300" },
    { label: "휴식", icon: "☕", seconds: stats.breakSeconds, bar: "bg-emerald-300" },
    { label: "개인일", icon: "🧹", seconds: stats.personalSeconds, bar: "bg-sky-300" },
  ];
  const maxActivity = Math.max(1, ...activityRows.map((r) => r.seconds));

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[1fr_1.35fr_1fr]">
      {/* 업무 히스토리 */}
      <Card>
        <CardTitle>업무 히스토리</CardTitle>
        {stats.timeline.length === 0 ? (
          <Empty>오늘 기록이 아직 없어요</Empty>
        ) : (
          <ol className="relative max-h-[188px] space-y-2.5 overflow-y-auto pr-1">
            <span className="absolute bottom-2 left-[3.5px] top-2 w-px bg-[#efe6df]" aria-hidden />
            {stats.timeline.map((entry) => (
              <li key={entry.id} className="relative flex items-center gap-3 text-sm">
                <span className={`h-2 w-2 shrink-0 rounded-full ring-2 ring-white ${dotFor(entry)}`} />
                <span className="w-11 shrink-0 font-mono text-xs text-gray-400">{formatTime(entry.at)}</span>
                <span className="min-w-0 flex-1 truncate text-gray-700">{entry.label}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* 이번 주 통계 */}
      <Card>
        <CardTitle
          right={<span className="text-[11px] text-gray-400">최근 7일</span>}
          link={{ label: "기록/통계", onClick: onOpenStats }}
        >
          이번 주 통계
        </CardTitle>

        <dl className="grid grid-cols-4 gap-2">
          {[
            { label: "총 근무시간", value: formatHours(weekWork) },
            { label: "완료한 업무", value: `${stats.completedTasks}개` },
            { label: "공부 시간", value: formatHours(stats.studySeconds) },
            { label: "운동 시간", value: formatHours(stats.exerciseSeconds) },
          ].map((kpi) => (
            <div key={kpi.label} className="min-w-0">
              <dt className="truncate text-[11px] text-gray-400">{kpi.label}</dt>
              <dd className="truncate text-[15px] font-bold text-gray-900">{kpi.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex h-[92px] items-end justify-between gap-2">
          {daily.map((d) => {
            const isToday = d.date === today;
            const height = d.workSeconds === 0 ? 4 : Math.max(8, (d.workSeconds / maxDay) * 70);
            return (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center gap-1.5"
                title={`${d.date} · ${formatHours(d.workSeconds)}`}
              >
                <span className="text-[10px] font-semibold text-gray-400">
                  {d.workSeconds > 0 ? (d.workSeconds / 3600).toFixed(1) : ""}
                </span>
                <div
                  className={`w-full max-w-[22px] rounded-md transition-all duration-500 ${
                    d.workSeconds === 0 ? "bg-gray-100" : isToday ? "bg-rose-400" : "bg-rose-200"
                  }`}
                  style={{ height }}
                />
                <span className={`text-[11px] ${isToday ? "font-bold text-rose-500" : "text-gray-400"}`}>
                  {format(new Date(`${d.date}T00:00:00`), "EEE", { locale: ko })}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 이번 주 활동 */}
      <Card className="md:col-span-2 xl:col-span-1">
        <CardTitle>이번 주 활동</CardTitle>
        <ul className="space-y-2.5">
          {activityRows.map((row) => (
            <li key={row.label} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">
                  <span className="mr-1.5">{row.icon}</span>
                  {row.label}
                </span>
                <span className="font-semibold text-gray-900">{formatHours(row.seconds)}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#f3ede8]">
                <div
                  className={`h-full rounded-full ${row.bar} transition-all duration-500`}
                  style={{ width: `${(row.seconds / maxActivity) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
