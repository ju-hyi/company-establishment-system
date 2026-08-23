import { useState } from "react";
import { LogIn } from "lucide-react";
import {
  AuthFailure,
  isValidUsername,
  normalizeUsername,
  signInWithUsername,
  signUpWithUsername,
} from "../lib/auth";

/**
 * 아이디 + 비밀번호 로그인 화면.
 * 이메일은 입력받지도, 보여주지도 않는다. 인증 메일도 발송되지 않는다.
 */
export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const translateError = (err: unknown): string => {
    if (err instanceof AuthFailure && err.message === "USERNAME_TAKEN")
      return "이미 사용 중인 아이디입니다.";

    const raw = err instanceof Error ? err.message.toLowerCase() : "";
    if (raw.includes("invalid login credentials"))
      return "아이디 또는 비밀번호가 올바르지 않습니다.";
    if (raw.includes("already registered") || raw.includes("already been registered"))
      return "이미 사용 중인 아이디입니다.";
    // DB의 아이디 UNIQUE 제약에 걸린 경우 (사전 확인을 통과한 동시 가입 등)
    if (raw.includes("profiles_username_unique") || raw.includes("duplicate key"))
      return "이미 사용 중인 아이디입니다.";
    if (raw.includes("password should be at least"))
      return "비밀번호는 6자 이상 입력해주세요.";
    if (raw.includes("weak password") || raw.includes("pwned"))
      return "더 안전한 비밀번호로 다시 시도해주세요.";
    if (raw.includes("rate limit") || raw.includes("too many"))
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    if (raw.includes("failed to fetch") || raw.includes("network"))
      return "네트워크 연결을 확인한 뒤 다시 시도해주세요.";
    if (raw.includes("invalid") && raw.includes("email"))
      return "아이디에 사용할 수 없는 문자가 있습니다.";
    // 원인을 특정할 수 없으면 단정하지 않는다. (자세한 내용은 콘솔에만 남긴다)
    console.error(err);
    return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const id = normalizeUsername(username);
    if (!id) return setError("아이디를 입력해주세요.");
    if (!password) return setError("비밀번호를 입력해주세요.");

    if (isSignUp) {
      if (!name.trim()) return setError("이름을 입력해주세요.");
      if (!isValidUsername(id))
        return setError("아이디는 영문 소문자와 숫자로 3~30자로 입력해주세요. ( . _ - 사용 가능)");
      if (password.length < 6) return setError("비밀번호는 6자 이상 입력해주세요.");
    }

    setLoading(true);
    try {
      if (isSignUp) await signUpWithUsername(id, password, name);
      else await signInWithUsername(id, password);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-purple-100 to-blue-100 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border-4 border-white p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900">MY LIFE OFFICE</h1>
          <p className="text-sm text-gray-500 mt-1">Work · Study · Life</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">이름</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">아이디</label>
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">아이디는 로그인할 때 사용합니다.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white font-bold rounded-xl shadow-lg hover:from-rose-500 hover:to-pink-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
          </button>
        </form>

        <button
          onClick={toggleMode}
          className="w-full mt-4 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
        </button>

        <p className="mt-6 text-xs text-center text-gray-400 leading-relaxed">
          아이디와 비밀번호만으로 사용합니다.
          <br />
          가입 즉시 로그인되며 세션은 브라우저에 유지됩니다.
        </p>
      </div>
    </div>
  );
}
