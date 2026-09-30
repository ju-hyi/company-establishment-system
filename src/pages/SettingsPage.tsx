import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import DailyMessageCard, { DEFAULT_DAILY_MESSAGE } from "../components/DailyMessageCard";
import type { useOfficeProfile } from "../hooks/useOfficeProfile";
import OfficeCharacter from "../components/OfficeCharacter";
import { ME_LOOK } from "../components/OfficeScene";
import { lookFor, type Appearance } from "../components/appearance";
import { Card, CardTitle, PageHeader, inputClass } from "../components/ui";

/**
 * 설정 — 오늘의 한마디, 계정 정보, 서비스 정보. 계정/인증 구조는 여기서 바꾸지 않는다.
 */

interface SettingsPageProps {
  name: string;
  username: string;
  level: number;
  office: ReturnType<typeof useOfficeProfile>;
  appearance: Appearance;
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
  onSignOut,
}: SettingsPageProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="설정" description="오늘의 한마디와 계정 정보를 관리합니다." />

      <div className="space-y-5">
        <DailyMessageEditor office={office} />

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
