import { addDays, format, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardTitle, formatHours } from "./ui";
import { todayKey } from "../utils/helpers";
import type { DayStat } from "../hooks/useStats";

/**
 * 이번 주 통계 — 월~일 요일별 세로 막대.
 *
 * 한 요일 막대 안에서 회사 업무(핑크) · 공부 및 자기계발(보라) · 운동(주황)을 색으로 나눠 쌓는다.
 * 막대 높이는 그 주에서 가장 많이 기록한 날을 기준으로 한 상대 크기다.
 * 시간 숫자는 기본 화면에 표시하지 않고, 막대에 마우스를 올렸을 때만 보여준다.
 *
 *   회사 업무         = 그날의 근무 시간(출근~퇴근 기록, 진행 중이면 지금까지)
 *   공부 및 자기계발  = 그날의 "공부" 활동 기록
 *   운동             = 그날의 "운동" 활동 기록
 */

interface WeeklyStatsCardProps {
  daily: DayStat[];
  /** 진행 중인 근무 세션의 경과 시간 — 아직 DB 에 합산되지 않은 오늘 몫 */
  liveWorkSeconds: number;
  onOpenStats: () => void;
}

const SERIES = [
  { key: "work", label: "회사 업무", color: "#f5a3b7" },
  { key: "study", label: "공부 및 자기계발", color: "#b8a5ee" },
  { key: "exercise", label: "운동", color: "#f7c17f" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];


export default function WeeklyStatsCard({ daily, liveWorkSeconds, onOpenStats }: WeeklyStatsCardProps) {
  const today = todayKey();
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const byDate = new Map(daily.map((d) => [d.date, d]));

  // 이번 주 월~일. 아직 오지 않은 날과 기록이 없는 날은 빈 막대로 둔다.
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const key = todayKey(date);
    const d = byDate.get(key);
    const values: Record<SeriesKey, number> = {
      work: (d?.workSeconds ?? 0) + (key === today ? liveWorkSeconds : 0),
      study: d?.studySeconds ?? 0,
      exercise: d?.exerciseSeconds ?? 0,
    };
    const total = values.work + values.study + values.exercise;
    return { key, date, values, total, isToday: key === today, isFuture: key > today };
  });

  const maxTotal = Math.max(...week.map((d) => d.total));
  const range = `${format(monday, "M/d")} – ${format(addDays(monday, 6), "M/d")}`;

  return (
    <Card className="flex flex-col">
      <CardTitle
        right={<span className="text-[11px] text-gray-400">{range}</span>}
        link={{ label: "기록/통계", onClick: onOpenStats }}
      >
        이번 주 통계
      </CardTitle>

      {/* 막대 영역은 카드에 남는 높이를 채운다 (작은 화면에서는 최소 132px) */}
      <div className="flex min-h-[132px] flex-1 justify-between gap-1.5 px-1 xl:min-h-0">
        {week.map((day) => {
          // 가장 많이 기록한 날 = 100%
          const height = maxTotal === 0 ? 0 : (day.total / maxTotal) * 100;
          const tooltip =
            day.total === 0
              ? `${format(day.date, "M/d (EEE)", { locale: ko })} · 기록 없음`
              : [
                  format(day.date, "M/d (EEE)", { locale: ko }),
                  ...SERIES.filter((s) => day.values[s.key] > 0).map(
                    (s) =>
                      `${s.label} ${day.values[s.key] < 60 ? "1분 미만" : formatHours(day.values[s.key])}`
                  ),
                ].join("\n");

          return (
            <div key={day.key} className="flex flex-1 flex-col items-center gap-1.5" title={tooltip}>
              <div className="flex min-h-0 w-full flex-1 justify-center">
                <div className="flex h-full w-full max-w-[22px] flex-col justify-end">
                  {day.total === 0 ? (
                    // 기록 없는 날 — 채우지 않고 자리만 표시
                    <div
                      className={`h-1.5 w-full rounded-full ${day.isFuture ? "bg-transparent" : "bg-[#f1ebe6]"}`}
                    />
                  ) : (
                    <div
                      className="flex w-full flex-col-reverse overflow-hidden rounded-md transition-all duration-500"
                      style={{ height: `max(6px, ${height}%)` }}
                    >
                      {SERIES.map((s) =>
                        day.values[s.key] > 0 ? (
                          <span
                            key={s.key}
                            className="block w-full"
                            style={{ height: `${(day.values[s.key] / day.total) * 100}%`, background: s.color }}
                          />
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </div>
              <span
                className={`text-[11px] ${
                  day.isToday
                    ? "rounded-full bg-rose-400 px-1.5 font-bold text-white"
                    : day.isFuture
                      ? "text-gray-300"
                      : "text-gray-500"
                }`}
              >
                {format(day.date, "EEE", { locale: ko })}
              </span>
            </div>
          );
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
