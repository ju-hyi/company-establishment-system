import { useState } from "react";
import Header from "../components/Header";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import MainContent from "../components/MainContent";
import { useTasks } from "../hooks/useTasks";
import { useWorkSession } from "../hooks/useWorkSession";
import { useActivities } from "../hooks/useActivities";
import { useStats } from "../hooks/useStats";
import { useSchedules } from "../hooks/useSchedules";

interface MainDashboardProps {
  userId: string;
  name: string;
  username: string;
  level: number;
  onSignOut: () => void;
}

export default function MainDashboard({
  userId,
  name,
  username,
  level,
  onSignOut,
}: MainDashboardProps) {
  const [statsKey, setStatsKey] = useState(0);
  const refreshStats = () => setStatsKey((n) => n + 1);

  const tasks = useTasks(userId);
  const work = useWorkSession(userId);
  const activities = useActivities(userId);
  const { stats } = useStats(userId, statsKey);
  const schedules = useSchedules(userId);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Header name={name} username={username} level={level} onSignOut={onSignOut} />

      <div className="flex w-full pt-16">
        <LeftSidebar
          tasks={tasks.tasks}
          completedCount={tasks.completedCount}
          totalCount={tasks.totalCount}
          onToggle={async (task) => {
            if (task.status === "completed") await tasks.reopenTask(task.id);
            else await tasks.completeTask(task.id);
            refreshStats();
          }}
        />

        <MainContent
          tasks={tasks}
          work={work}
          activities={activities}
          stats={stats}
          onDataChange={refreshStats}
        />

        <RightSidebar
          isCheckedIn={work.isCheckedIn}
          checkInAt={work.session?.check_in_at ?? null}
          elapsedSeconds={work.elapsedSeconds}
          onAddTask={async (title) => {
            await tasks.addTask(title);
            refreshStats();
          }}
          schedules={schedules.schedules}
          onAddSchedule={schedules.addSchedule}
          onRemoveSchedule={schedules.removeSchedule}
        />
      </div>
    </div>
  );
}
