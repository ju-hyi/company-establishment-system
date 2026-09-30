import { useEffect, useState } from "react";
import Header, { NAV_ITEMS } from "../components/Header";
import LiveOfficePage from "./LiveOfficePage";
import TasksPage from "./TasksPage";
import CalendarPage from "./CalendarPage";
import StatsPage from "./StatsPage";
import SettingsPage from "./SettingsPage";
import CharacterPage from "./CharacterPage";
import { ME_ID, myStatusOf } from "../components/CharacterManager";
import { illustrationOf, pointColorOf, resolveAppearance } from "../components/appearance";
import type { PageId } from "../components/ui";
import { useTasks } from "../hooks/useTasks";
import { useWorkSession } from "../hooks/useWorkSession";
import { useActivities } from "../hooks/useActivities";
import { useStats } from "../hooks/useStats";
import { useSchedules } from "../hooks/useSchedules";
import { useOfficeProfile } from "../hooks/useOfficeProfile";

interface MainDashboardProps {
  userId: string;
  name: string;
  username: string;
  level: number;
  onSignOut: () => void;
}

/** 새로고침 · 뒤로가기에도 보던 페이지가 유지되도록 주소의 #해시로 페이지를 기억한다. */
function pageFromHash(): PageId {
  const id = window.location.hash.replace("#", "");
  // "character" 는 상단 메뉴에는 없고 캐릭터 관리의 [캐릭터 꾸미기] 버튼으로 들어온다.
  return NAV_ITEMS.some((item) => item.id === id) || id === "character" ? (id as PageId) : "office";
}

export default function MainDashboard({
  userId,
  name,
  username,
  level,
  onSignOut,
}: MainDashboardProps) {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [statsKey, setStatsKey] = useState(0);
  const refreshStats = () => setStatsKey((n) => n + 1);

  // 모든 페이지가 같은 데이터를 공유한다 — 관리 페이지에서 바꾼 내용이 대시보드에 바로 보인다.
  const tasks = useTasks(userId);
  const work = useWorkSession(userId);
  const activities = useActivities(userId);
  const { stats } = useStats(userId, statsKey);
  const schedules = useSchedules(userId);
  const office = useOfficeProfile(userId);
  // 캐릭터 꾸미기 값 — 맵 · 프로필 · 캐릭터 관리 카드가 같이 쓴다
  const appearance = resolveAppearance(office.characters[ME_ID]?.appearance);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (next: PageId) => {
    if (next !== page) window.location.hash = next === "office" ? "" : next;
    setPage(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-[#faf7f4]">
      <Header
        name={name}
        username={username}
        level={level}
        page={page}
        onNavigate={navigate}
        onSignOut={onSignOut}
        avatarSrc={illustrationOf(appearance)}
        avatarColor={pointColorOf(appearance)}
      />

      <main className="mx-auto max-w-[1680px] px-4 pb-10 pt-[84px] sm:px-5">
        {page === "office" && (
          <LiveOfficePage
            tasks={tasks}
            work={work}
            activities={activities}
            stats={stats}
            office={office}
            appearance={appearance}
            myName={name}
            onDataChange={refreshStats}
            onNavigate={navigate}
          />
        )}
        {page === "tasks" && <TasksPage tasks={tasks} onDataChange={refreshStats} />}
        {page === "calendar" && <CalendarPage userId={userId} onChanged={schedules.reload} />}
        {page === "stats" && <StatsPage stats={stats} liveWorkSeconds={work.elapsedSeconds} />}
        {page === "character" && (
          <CharacterPage
            office={office}
            myName={name}
            myStatus={myStatusOf(activities.activity?.type ?? null, work.isCheckedIn)}
            onBack={() => navigate("office")}
          />
        )}
        {page === "settings" && (
          <SettingsPage
            name={name}
            username={username}
            level={level}
            office={office}
            appearance={appearance}
            userId={userId}
            onDataReset={() => window.location.reload()}
            onSignOut={onSignOut}
          />
        )}
      </main>
    </div>
  );
}
