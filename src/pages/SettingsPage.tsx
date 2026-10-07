import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import DailyMessageCard, { DEFAULT_DAILY_MESSAGE } from "../components/DailyMessageCard";
import type { useOfficeProfile } from "../hooks/useOfficeProfile";
import OfficeCharacter from "../components/OfficeCharacter";
import { ME_LOOK } from "../components/OfficeScene";
import { lookFor, type Appearance } from "../components/appearance";
import UserAdminCard from "../components/UserAdminCard";
import TimeInput from "../components/TimeInput";
import { parseTime } from "../utils/time";
import { Card, CardTitle, PageHeader, inputClass } from "../components/ui";

/**
 * 설정 — 오늘의 한마디, 점심시간, 계정 정보, 서비스 정보. 계정/인증 구조는 여기서 바꾸지 않는다.
 */

interface SettingsPageProps {
  name: string;
  username: string;
  level: number;
  office: ReturnType<typeof useOfficeProfile>;
  appearance: Appearance;
  userId: string;
  onDataReset: () => void;
  onSignOut: () => void;
}

function DailyMessageEditor({ office }: { office: ReturnType<typeof useOfficeProfile> }) {
  const [draft, setDraft] = useState(office.dailyMessage ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // 프로필이 늦게 도착하면 저장된 값으로 채운다.
  useEffect(() => setDraft(office.dailyMessage ?? ""), [office.dailyMessage]);

  const save = async () => {
    setState("saving");
    try {
      await office.saveDailyMessage(draft);
      setState("saved");
    } catch {
      setState("error");
    }
  };

  return (
    <Card>
      <CardTitle>오늘의 한마디</CardTitle>
      <p className="mb-3 text-sm text-gray-500">라이브 오피스 하단에 캐릭터 말풍선으로 보여줄 문구예요.</p>
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setState("idle");
            }}
            rows={3}
            maxLength={80}
            placeholder={DEFAULT_DAILY_MESSAGE}
            className={`${inputClass} resize-none`}
            aria-label="오늘의 한마디"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={save}
              disabled={state === "saving" || !office.available}
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-40"
            >
              저장
            </button>
            <span className="text-xs text-gray-400">{draft.length}/80 · 비워두면 기본 문구</span>
            {state === "saved" && <span className="text-xs font-semibold text-emerald-600">저장했어요</span>}
            {state === "error" && <span className="text-xs text-rose-500">저장하지 못했어요</span>}
          </div>
          {!office.available && (
            <p className="mt-2 text-xs text-amber-700">DB 업데이트(0003 마이그레이션) 후 저장할 수 있어요.</p>
          )}
        </div>
        <div className="[&>section]:shadow-none">
          <DailyMessageCard message={draft} />
        </div>
      </div>
    </Card>
  );
}

/** 점심시간 — 이 시간 동안은 상태가 "점심시간"으로 보이고 근무 시간에서 빠진다. */
function LunchEditor({ office }: { office: ReturnType<typeof useOfficeProfile> }) {
  const [start, setStart] = useState(office.lunch?.start ?? "");
  const [end, setEnd] = useState(office.lunch?.end ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  // 프로필이 늦게 도착하면 저장된 값으로 채운다.
  useEffect(() => {
    setStart(office.lunch?.start ?? "");
    setEnd(office.lunch?.end ?? "");
  }, [office.lunch?.start, office.lunch?.end]);

  const save = async (next: { start: string; end: string } | null) => {
    setMessage(null);
    setState("saving");
    try {
      await office.saveLunch(next);
      setState("saved");
    } catch {
      setState("error");
    }
  };

  const submit = () => {
    const s = parseTime(start);
    const e = parseTime(end);
    if (!s || !e) {
      setMessage("시간은 00:00 ~ 23:59 사이로 입력해주세요. (예: 12:00)");
      return;
    }
    if (e <= s) {
      setMessage("끝나는 시간은 시작 시간보다 뒤여야 해요.");
      return;
    }
    setStart(s);
    setEnd(e);
    save({ start: s, end: e });
  };

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setState("idle");
    setMessage(null);
  };

  return (
    <Card>
      <CardTitle>점심시간</CardTitle>
      <p className="mb-3 text-sm text-gray-500">
        출근 중 이 시간에는 상태가 '점심시간'으로 보이고, 근무 시간에서 빠져요.
      </p>
      <div className="grid max-w-sm grid-cols-2 gap-2">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-semibold text-gray-500">시작</span>
          <TimeInput value={start} onChange={edit(setStart)} placeholder="12:00" aria-label="점심 시작" />
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-semibold text-gray-500">끝</span>
          <TimeInput value={end} onChange={edit(setEnd)} placeholder="13:00" aria-label="점심 끝" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={submit}
          disabled={state === "saving" || !office.lunchAvailable}
          className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-40"
        >
          저장
        </button>
        {office.lunch && (
          <button
            onClick={() => {
              setStart("");
              setEnd("");
              save(null);
            }}
            disabled={state === "saving" || !office.lunchAvailable}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            점심시간 사용 안 함
          </button>
        )}
        {state === "saved" && (
          <span className="text-xs font-semibold text-emerald-600">
            {office.lunch ? "저장했어요" : "점심시간을 쓰지 않아요"}
          </span>
        )}
        {state === "error" && <span className="text-xs text-rose-500">저장하지 못했어요</span>}
        {message && <span className="text-xs text-rose-500">{message}</span>}
      </div>
      <p className="mt-2 text-[11px] text-gray-400">이미 퇴근한 지난 근무 기록은 바뀌지 않아요.</p>
      {!office.lunchAvailable && (
        <p className="mt-2 text-xs text-amber-700">DB 업데이트(0008 마이그레이션) 후 저장할 수 있어요.</p>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

export default function SettingsPage({
  name,
  username,
  level,
  office,
  appearance,
  userId,
  onDataReset,
  onSignOut,
}: SettingsPageProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="설정" description="오늘의 한마디, 점심시간과 계정 정보를 관리합니다." />

      <div className="space-y-5">
        <DailyMessageEditor office={office} />
        <LunchEditor office={office} />

        <Card>
          <CardTitle>내 계정</CardTitle>
          <div className="mb-2 flex items-center gap-4 rounded-xl bg-[#fdf6f3] p-4">
            <div className="h-16 shrink-0">
              <OfficeCharacter look={lookFor(ME_LOOK, appearance)} pose="stand" height="100%" label="내 캐릭터" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{name}</p>
              <p className="text-sm text-gray-500">@{username}</p>
            </div>
            <span className="ml-auto rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-500">
              Lv.{level}
            </span>
          </div>
          <dl className="divide-y divide-[#f3ede8]">
            <Row label="이름" value={name} />
            <Row label="아이디" value={username || "-"} />
            <Row label="레벨" value={`Lv.${level}`} />
          </dl>
        </Card>

        <Card>
          <CardTitle>서비스</CardTitle>
          <dl className="divide-y divide-[#f3ede8]">
            <Row label="데이터 저장" value="클라우드 (Supabase)" />
            <Row label="기록 기준 시간대" value="한국 표준시 (KST)" />
            <Row label="통계 범위" value="최근 7일" />
          </dl>
        </Card>

        <UserAdminCard myUserId={userId} onMyDataCleared={onDataReset} />

        <Card>
          <CardTitle>로그아웃</CardTitle>
          <p className="mb-4 text-sm text-gray-500">모든 기기에서 로그인 세션을 종료합니다.</p>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </Card>
      </div>
    </div>
  );
}
