import type { User } from "../types";
import Header from "../components/Header";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import MainContent from "../components/MainContent";

interface MainDashboardProps {
  user: User;
}

export default function MainDashboard({ user }: MainDashboardProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <Header user={user} />

      {/* Main Layout */}
      <div className="flex w-full pt-16">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Center Content */}
        <MainContent />

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}
