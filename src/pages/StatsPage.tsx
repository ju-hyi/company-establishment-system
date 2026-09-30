import type { ReactNode } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardTitle, Empty, PageHeader, formatHours } from "../components/ui";
import { ACTIVITY_LABEL, type Stats } from "../hooks/useStats";
import { formatDuration, formatTime, todayKey } from "../utils/helpers";

/**
 * 기록/통계 — 최근 7일 동안의 근무 · 업무 · 공부/운동/휴식 기록을 확인한다.
 * 모든 값은 원본 기록(work_sessions / tasks / activities)에서 계산한다.
 */

interface StatsPageProps {
  stats: Stats;
  liveWorkSeconds: number;
}

const dayLabel = (date: string) => format(new Date(`${date}T00:00:00`), "M/d (EEE)", { locale: ko });

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <Card className="!p-4">
      <p className="text-xs font-semibold text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
    </Card>
  );
}

function RecordList({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {empty ? <Empty>최근 7일 기록이 없어요</Empty> : <ul className="max-h-[320px] space-y-1 overflow-y-auto pr-1">{children}</ul>}
    </Card>
  );
}

export default function StatsPage({ stats, liveWorkSeconds }: StatsPageProps) {
  const today = todayKey();
  const daily = stats.daily.map((d) =>
    d.date === today ? { ...d, workSeconds: d.workSeconds + liveWorkSeconds } : d
  );
  const weekWork = stats.weeklyWorkSeconds + liveWorkSeconds;
  const rate = stats.totalTasks === 0 ? 0 : Math.round((stats.completedTasks / stats.totalTasks) * 100);
  const maxWork = Math.max(3600, ...daily.map((d) => d.workSeconds));

  const completed = stats.tasks
    .filter((t) => t.status === "completed")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="기록/통계" description="최근 7일 동안의 근무 · 업무 · 활동 기록입니다." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="총 근무시간" value={formatHours(weekWork)} tone="text-rose-500" />
        <Kpi
          label="업무 완료율"
          value={`${rate}%`}
          sub={`${stats.completedTasks}/${stats.totalTasks}개 · ${formatHours(stats.taskSeconds)}`}
          tone="text-emerald-600"
        />
        <Kpi label="공부 시간" value={formatHours(stats.studySeconds)} tone="text-violet-600" />
        <Kpi label="운동 시간" value={formatHours(stats.exerciseSeconds)} tone="text-amber-600" />
        <Kpi label="휴식 시간" value={formatHours(stats.breakSeconds)} tone="text-sky-600" />
      </div>

      {/* 일별 */}
      <Card className="mb-5">
        <CardTitle>일별 기록</CardTitle>
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400">
                <th className="px-1 pb-2 font-semibold">날짜</th>
                <th className="w-[34%] px-1 pb-2 font-semibold">근무 시간</th>
                <th className="px-1 pb-2 font-semibold">업무 완료</th>
                <th className="px-1 pb-2 font-semibold">공부</th>
                <th className="px-1 pb-2 font-semibold">운동</th>
                <th className="px-1 pb-2 font-semibold">휴식</th>
                <th className="px-1 pb-2 font-semibold">개인일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3ede8]">
              {[...daily].reverse().map((d) => (
                <tr key={d.date} className={d.date === today ? "bg-rose-50/40" : ""}>
                  <td className="whitespace-nowrap px-1 py-2.5 font-medium text-gray-700">
                    {dayLabel(d.date)}
                    {d.date === today && <span className="ml-1 text-[10px] font-bold text-rose-500">오늘</span>}
                  </td>
                  <td className="px-1 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f3ede8]">
                        <div
                          className="h-full rounded-full bg-rose-300"
                          style={{ width: `${(d.workSeconds / maxWork) * 100}%` }}
                        />
                      </div>
                      <span className="w-20 shrink-0 text-right text-xs font-semibold text-gray-700">
                        {d.workSeconds ? formatHours(d.workSeconds) : "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-1 py-2.5 text-gray-700">
                    {d.totalTasks ? `${d.completedTasks}/${d.totalTasks}` : "-"}
                  </td>
                  <td className="px-1 py-2.5 text-gray-600">{d.studySeconds ? formatHours(d.studySeconds) : "-"}</td>
                  <td className="px-1 py-2.5 text-gray-600">{d.exerciseSeconds ? formatHours(d.exerciseSeconds) : "-"}</td>
                  <td className="px-1 py-2.5 text-gray-600">{d.breakSeconds ? formatHours(d.breakSeconds) : "-"}</td>
                  <td className="px-1 py-2.5 text-gray-600">{d.personalSeconds ? formatHours(d.personalSeconds) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 원본 기록 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <RecordList title="근무 기록" empty={stats.sessions.length === 0}>
          {stats.sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-[#faf7f4]">
              <span className="text-gray-700">{dayLabel(s.work_date)}</span>
              <span className="font-mono text-xs text-gray-500">
                {formatTime(s.check_in_at)} – {s.check_out_at ? formatTime(s.check_out_at) : "근무 중"}
              </span>
              <span className="w-16 text-right font-mono text-xs font-semibold text-gray-800">
                {s.duration_seconds !== null ? formatDuration(s.duration_seconds) : formatDuration(liveWorkSeconds)}
              </span>
            </li>
          ))}
        </RecordList>

        <RecordList title="완료한 업무" empty={completed.length === 0}>
          {completed.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-[#faf7f4]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              <span className="min-w-0 flex-1 truncate text-gray-700">{t.title}</span>
              <span className="shrink-0 text-xs text-gray-400">{dayLabel(t.task_date)}</span>
              <span className="w-16 shrink-0 text-right font-mono text-xs font-semibold text-gray-800">
                {t.duration_seconds !== null ? formatDuration(t.duration_seconds) : "-"}
              </span>
            </li>
          ))}
        </RecordList>

        <RecordList title="활동 기록" empty={stats.activities.length === 0}>
          {stats.activities.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-[#faf7f4]">
              <span className="w-12 shrink-0 font-semibold text-gray-700">{ACTIVITY_LABEL[a.type]}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-gray-400">
                {dayLabel(a.activity_date)} {formatTime(a.started_at)}
              </span>
              <span className="w-16 shrink-0 text-right font-mono text-xs font-semibold text-gray-800">
                {a.duration_seconds !== null ? formatDuration(a.duration_seconds) : "진행 중"}
              </span>
            </li>
          ))}
        </RecordList>
      </div>
    </div>
  );
}
