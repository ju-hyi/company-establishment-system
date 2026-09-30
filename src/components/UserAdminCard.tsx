import { useCallback, useEffect, useState } from "react";
import { Eraser, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Card, CardTitle, Empty } from "./ui";
import * as admin from "../services/admin";
import { formatDate } from "../utils/helpers";

/**
 * 설정 → 회원 관리 (관리자에게만 보인다)
 *
 *   기록 삭제 : 계정은 남기고 업무 · 출퇴근 · 활동 · 일정 · 한마디 · 캐릭터 설정을 지운다.
 *   계정 삭제 : 아이디와 모든 기록을 지운다. 해당 아이디로 다시 로그인할 수 없다.
 * 비밀번호는 묻지 않는다. 실수로 누르는 것만 막도록 확인 창을 한 번 띄운다.
 */

interface UserAdminCardProps {
  myUserId: string;
  /** 내 기록을 지웠을 때 화면 데이터를 새로 읽게 한다 */
  onMyDataCleared: () => void;
}

export default function UserAdminCard({ myUserId, onMyDataCleared }: UserAdminCardProps) {
  const [state, setState] = useState<admin.AdminState | null>(null);
  const [users, setUsers] = useState<admin.AdminUser[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const next = await admin.getAdminState();
    setState(next);
    if (next.isAdmin) setUsers(await admin.listUsers());
  }, []);

  useEffect(() => {
    load().catch(() => setState({ available: false, isAdmin: false, adminExists: false }));
  }, [load]);

  const run = async (key: string, action: () => Promise<void>, done: string) => {
    setBusy(key);
    setMessage(null);
    try {
      await action();
      setMessage({ tone: "ok", text: done });
      await load();
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "처리하지 못했어요." });
    } finally {
      setBusy(null);
    }
  };

  // 0004 마이그레이션 전이거나, 관리자가 있는데 내가 관리자가 아니면 아무것도 보여주지 않는다.
  if (!state || !state.available) return null;
  if (!state.isAdmin && state.adminExists) return null;

  if (!state.isAdmin) {
    return (
      <Card>
        <CardTitle>회원 관리</CardTitle>
        <p className="mb-3 text-sm text-gray-500">
          아직 관리자가 없어요. 이 계정을 관리자로 등록하면 가입한 회원의 기록 · 아이디를 삭제할 수 있어요.
          <br />
          <span className="text-xs text-gray-400">한 번 등록하면 다른 계정은 관리자로 등록할 수 없어요.</span>
        </p>
        <button
          onClick={() =>
            run("claim", async () => {
              const ok = await admin.claimFirstAdmin();
              if (!ok) throw new Error("이미 다른 관리자가 등록되어 있어요.");
            }, "관리자로 등록했어요.")
          }
          disabled={busy !== null}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
        >
          <ShieldCheck size={16} />이 계정을 관리자로 등록
        </button>
        {message && (
          <p className={`mt-2 text-xs ${message.tone === "ok" ? "text-emerald-600" : "text-rose-500"}`}>
            {message.text}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle
        right={
          <button
            onClick={() => run("reload", async () => undefined, "새로 불러왔어요.")}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="새로고침"
          >
            <RefreshCw size={14} />
          </button>
        }
      >
        <ShieldCheck size={16} className="text-rose-400" /> 회원 관리
        <span className="text-xs font-semibold text-gray-400">{users.length}명</span>
      </CardTitle>
      <p className="mb-3 text-xs text-gray-400">
        기록 삭제는 계정을 남기고 업무 · 출퇴근 · 활동 · 일정을 지워요. 계정 삭제는 아이디와 모든 기록을 지우며 되돌릴 수 없어요.
      </p>

      {message && (
        <p className={`mb-3 text-xs ${message.tone === "ok" ? "text-emerald-600" : "text-rose-500"}`}>
          {message.text}
        </p>
      )}

      {users.length === 0 ? (
        <Empty>가입한 회원이 없어요</Empty>
      ) : (
        <ul className="divide-y divide-[#f3ede8]">
          {users.map((u) => {
            const me = u.id === myUserId;
            const label = u.username ? `@${u.username}` : "(아이디 없음)";
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    {u.name}
                    <span className="font-normal text-gray-400">{label}</span>
                    {me && <span className="rounded bg-rose-50 px-1 text-[10px] font-bold text-rose-500">나</span>}
                    {u.is_admin && (
                      <span className="rounded bg-gray-100 px-1 text-[10px] font-bold text-gray-500">관리자</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    가입 {formatDate(u.created_at)} · 업무 {u.task_count}개 · 출퇴근 {u.session_count}회
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      if (!window.confirm(`${u.name}(${label})의 기록을 모두 삭제할까요?\n계정은 남아요. 되돌릴 수 없어요.`)) return;
                      run(`clear-${u.id}`, () => admin.clearUserData(u.id), `${u.name}의 기록을 삭제했어요.`).then(
                        () => me && onMyDataCleared()
                      );
                    }}
                    disabled={busy !== null}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:opacity-40"
                  >
                    <Eraser size={13} />
                    기록 삭제
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(`${u.name}(${label}) 계정을 삭제할까요?\n아이디와 모든 기록이 바로 사라지고 되돌릴 수 없어요.`)) return;
                      run(`delete-${u.id}`, () => admin.deleteUser(u.id), `${u.name} 계정을 삭제했어요.`);
                    }}
                    disabled={busy !== null || me}
                    title={me ? "내 계정은 여기서 삭제할 수 없어요" : undefined}
                    className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                    계정 삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
