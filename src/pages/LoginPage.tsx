import { useState } from "react";
import { supabase } from "../lib/supabase";
import { LogIn } from "lucide-react";

/**
 * 로그인 ID + 비밀번호 인증.
 *
 * Supabase Auth의 password provider는 식별자로 이메일 형식만 받으므로
 * 이메일을 "로그인 ID"로 사용한다. 인증 메일은 발송하지 않으며
 * (Auth 설정의 Confirm email = OFF), 이메일 소유 확인 절차도 없다.
 */
export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const translateError = (raw: string) => {
    const m = raw.toLowerCase();
    if (m.includes("email rate limit") || m.includes("rate limit"))
      return "가입 요청이 일시적으로 제한되었습니다. Supabase Auth의 'Confirm email' 설정이 꺼져 있는지 확인해주세요.";
    if (m.includes("invalid login credentials"))
      return "아이디 또는 비밀번호가 올바르지 않습니다. 아직 가입하지 않으셨다면 아래 '회원가입'을 눌러주세요.";
    if (m.includes("already registered") || m.includes("already been registered"))
      return "이미 등록된 아이디입니다. 로그인해주세요.";
    if (m.includes("password should be at least"))
      return "비밀번호는 6자 이상이어야 합니다.";
    if (m.includes("email not confirmed"))
      return "이 계정은 확인 대기 상태입니다. Supabase Auth에서 'Confirm email'을 끈 뒤 다시 시도해주세요.";
    if (m.includes("invalid") && m.includes("email"))
      return "아이디는 이메일 형식으로 입력해주세요. (예: juhyi@myoffice.kr)";
    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    // 가입과 로그인이 항상 같은 값을 보내도록 한 곳에서 정규화한다.
    // Supabase는 이메일을 소문자로 저장하므로 대소문자 차이로 로그인이 실패하지 않게 맞춘다.
    const identifier = loginId.trim().toLowerCase();

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: identifier,
          password,
          options: { data: { name: name.trim() || identifier.split("@")[0] } },
        });
        if (signUpError) throw signUpError;

        // Confirm email이 꺼져 있으면 가입 즉시 세션이 발급된다.
        if (data.session) return;

        // 세션이 없으면 곧바로 로그인을 시도해 가입 직후 진입을 보장한다.
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : "오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setNotice("");
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
                placeholder="화면에 표시될 이름"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">로그인 ID</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="juhyi@myoffice.kr"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <p className="text-xs text-gray-500 mt-1">
              이메일 형식으로 입력합니다. <span className="font-semibold">인증 메일은 발송되지 않습니다.</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg py-2 px-3">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg py-2 px-3">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white font-bold rounded-xl shadow-lg hover:from-rose-500 hover:to-pink-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            {loading ? "처리 중..." : isSignUp ? "가입하고 바로 시작" : "로그인"}
          </button>
        </form>

        <button
          onClick={toggleMode}
          className="w-full mt-4 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
        </button>

        <p className="mt-6 text-xs text-center text-gray-400 leading-relaxed">
          이메일 인증 없이 아이디와 비밀번호만으로 사용합니다.
          <br />
          가입 즉시 로그인되며 세션은 브라우저에 유지됩니다.
        </p>
      </div>
    </div>
  );
}
