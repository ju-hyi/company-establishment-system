import type { ReactNode } from "react";
import { Card, CardTitle, Empty, formatHours } from "./ui";
import WeeklyStatsCard from "./WeeklyStatsCard";
import { timelineDot } from "./HistoryDayModal";
import { formatTime } from "../utils/helpers";
import type { Stats } from "../hooks/useStats";

/**
 * 라이브 오피스 하단 — 오늘의 한마디 · 업무 히스토리 · 이번 주 통계 · 이번 주 활동 · 캐릭터 관리.
 * 통계는 모두 원본 기록(useStats)에서 계산한 값을 보여주기만 한다.
 */

interface DashboardBottomProps {
  stats: Stats;
  /** 진행 중인 근무 세션의 경과 시간 — 아직 DB 에 합산되지 않은 오늘 몫 */
  liveWorkSeconds: number;
  onOpenStats: () => void;
  /** 업무 히스토리 — 날짜별 기록 팝업 열기 */
  onOpenHistory: () => void;
  /** ① 오늘의 한마디 */
  messageCard: ReactNode;
  /** ⑤ 캐릭터 관리 */
  characterCard: ReactNode;
}

/**
 * 넓은 화면(한 줄 5칸)에서는 줄 높이를 "이번 주 활동" 카드가 정한다.
 * 나머지 카드는 그 높이에 맞춰 들어가고(넘치는 목록은 카드 안에서 스크롤), 줄 높이에 영향을 주지 않는다.
 */
function FitRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`xl:relative ${className}`}>
      <div className="h-full xl:absolute xl:inset-0 [&>section]:h-full">{children}</div>
    </div>
  );
}

export default function DashboardBottom({
  stats,
  liveWorkSeconds,
  onOpenStats,
  onOpenHistory,
  messageCard,
  characterCard,
}: DashboardBottomProps) {
  const activityRows = [
    { label: "회사 업무", icon: "🏢", seconds: stats.weeklyWorkSeconds + liveWorkSeconds },
    { label: "공부", icon: "📚", seconds: stats.studySeconds },
    { label: "운동", icon: "🏃", seconds: stats.exerciseSeconds },
    { label: "개인활동", icon: "🧹", seconds: stats.personalSeconds },
    { label: "휴식", icon: "☕", seconds: stats.breakSeconds },
    { label: "MX 인스타", icon: "📱", seconds: stats.taskSecondsByCategory.mx_instagram },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[1.05fr_1fr_1.1fr_1.15fr_0.8fr]">
      {/* ① 오늘의 한마디 */}
      <FitRow>{messageCard}</FitRow>

      {/* ② 업무 히스토리 */}
      <FitRow>
      <Card className="flex flex-col">
        <CardTitle link={{ label: "날짜별 보기", onClick: onOpenHistory }}>업무 히스토리</CardTitle>
        {stats.timeline.length === 0 ? (
          <Empty>오늘 기록이 아직 없어요</Empty>
        ) : (
          <ol className="relative max-h-[320px] min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 xl:max-h-none">
            <span className="absolute bottom-2 left-[3.5px] top-2 w-px bg-[#efe6df]" aria-hidden />
            {stats.timeline.map((entry) => (
              <li key={entry.id} className="relative flex items-start gap-3 text-sm">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ring-2 ring-white ${timelineDot(entry)}`} />
                <span className="w-11 shrink-0 pt-px font-mono text-xs text-gray-400">{formatTime(entry.at)}</span>
                <span className="min-w-0 flex-1 break-words text-gray-700">{entry.label}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
      </FitRow>

      {/* ③ 이번 주 통계 — 월~일 요일별 막대 */}
      <FitRow>
        <WeeklyStatsCard daily={stats.daily} liveWorkSeconds={liveWorkSeconds} onOpenStats={onOpenStats} />
      </FitRow>

      {/* ④ 이번 주 활동 */}
      <Card className="flex flex-col">
        <CardTitle>이번 주 활동</CardTitle>
        <ul className="space-y-1.5">
          {activityRows.map((row) => (
            <li key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                <span className="mr-1.5">{row.icon}</span>
                {row.label}
              </span>
              <span className="font-semibold text-gray-900">{formatHours(row.seconds)}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* ⑤ 캐릭터 관리 */}
      <FitRow className="md:col-span-2 xl:col-span-1">{characterCard}</FitRow>
    </div>
  );
}
