import { LogOut } from "lucide-react";
import OfficeCharacter from "../components/OfficeCharacter";
import { ME_LOOK } from "../components/OfficeScene";
import { Card, CardTitle, PageHeader } from "../components/ui";

/**
 * 설정 — 계정 정보와 서비스 정보. 계정/인증 구조는 여기서 바꾸지 않는다.
 */

interface SettingsPageProps {
  name: string;
  username: string;
  level: number;
  onSignOut: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

export default function SettingsPage({ name, username, level, onSignOut }: SettingsPageProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="설정" description="계정과 서비스 정보를 확인합니다." />

      <div className="space-y-5">
        <Card>
          <CardTitle>내 계정</CardTitle>
          <div className="mb-2 flex items-center gap-4 rounded-xl bg-[#fdf6f3] p-4">
            <div className="h-16 shrink-0">
              <OfficeCharacter look={ME_LOOK} pose="stand" height="100%" label="내 캐릭터" />
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
