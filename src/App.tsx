import MainDashboard from "./pages/MainDashboard";
import type { User } from "./types";

export default function App() {
  const mockUser: User = {
    id: "user-123",
    email: "user@example.com",
    name: "김주희",
    level: 12,
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=kimjuhee",
    created_at: new Date().toISOString(),
  };

  return <MainDashboard user={mockUser} />;
}
