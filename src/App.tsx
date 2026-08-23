import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import MainDashboard from "./pages/MainDashboard";

export default function App() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-blue-50">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🏢</div>
          <p className="text-gray-600 font-semibold">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <MainDashboard
      userId={user.id}
      name={profile?.name ?? user.email?.split("@")[0] ?? "사용자"}
      email={user.email ?? ""}
      level={profile?.level ?? 1}
      onSignOut={signOut}
    />
  );
}
