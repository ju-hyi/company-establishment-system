import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import MainDashboard from "./pages/MainDashboard";

/** user_metadata 는 any 이므로 문자열일 때만 쓴다. */
function metaText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

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

  // profile 은 세션보다 조금 늦게 도착하므로 그 사이엔 가입 때 저장한 메타데이터를 쓴다.
  const username = profile?.username ?? metaText(user.user_metadata?.username) ?? "";
  const name = profile?.name ?? metaText(user.user_metadata?.name) ?? username ?? "사용자";

  return (
    <MainDashboard
      userId={user.id}
      name={name || "사용자"}
      username={username}
      level={profile?.level ?? 1}
      onSignOut={signOut}
    />
  );
}
