import { useEffect, useState } from "react";
import { Check, Pencil, Sparkles, X } from "lucide-react";
import OfficeCharacter from "./OfficeCharacter";
import { CharacterImage, CHARACTER_IMAGES } from "./CharacterSpeech";
import { ME_LOOK, STAFF, STATUS_META } from "./OfficeScene";
import { Card, CardTitle, inputClass } from "./ui";
import type { ActivityType, CharacterOverrides, StaffStatus } from "../types";

/**
 * 회사 맵 캐릭터의 이름 · 상태 · 사항.
 *
 * 값은 코드에 고정하지 않고 profiles.office_characters 에 저장한다.
 * 캐릭터를 새로 만들거나 그림을 바꾸는 기능은 없다.
 * 내 캐릭터의 상태는 출퇴근 · 활동에 자동 연동되므로 이름과 사항만 바꿀 수 있다.
 *
 *   CharacterManageCard 메인 하단 마지막 "캐릭터 관리" — 이미지 + [캐릭터 꾸미기]
 *   CharacterEditor     캐릭터 꾸미기/관리 페이지 — 이름 · 상태 · 사항 수정
 */

export const ME_ID = "me";
const STATUS_OPTIONS = Object.keys(STATUS_META) as StaffStatus[];

type Status = { label: string; dot: string };

/** 내 캐릭터 상태 — 출퇴근 · 지금 하는 일에서 자동으로 정한다. */
export function myStatusOf(activity: ActivityType | null, isCheckedIn: boolean, leaving = false): Status {
  if (activity === "study") return STATUS_META.studying;
  if (activity === "exercise") return { label: "운동 중", dot: "bg-orange-400" };
  if (activity === "break") return STATUS_META.resting;
  if (activity === "personal") return STATUS_META.working;
  if (leaving) return STATUS_META.moving;
  return isCheckedIn ? STATUS_META.working : STATUS_META.away;
}

interface Entry {
  id: string;
  look: typeof ME_LOOK;
  name: string;
  status: Status;
  statusKey: StaffStatus | null;
  note: string;
}

/** 내 캐릭터 + 직원 목록에 저장된 변경값을 합친다. */
export function characterEntries(
  overrides: CharacterOverrides,
  myDefaultName: string,
  myStatus: Status,
  myLook: typeof ME_LOOK = ME_LOOK
): Entry[] {
  return [
    {
      id: ME_ID,
      look: myLook,
      name: overrides[ME_ID]?.name ?? myDefaultName,
      status: myStatus,
      statusKey: null,
      note: overrides[ME_ID]?.note ?? "",
    },
    ...STAFF.map((s) => {
      const key = overrides[s.id]?.status ?? s.status;
      return {
        id: s.id,
        look: s.look,
        name: overrides[s.id]?.name ?? s.name,
        status: STATUS_META[key],
        statusKey: key,
        note: overrides[s.id]?.note ?? "",
      };
    }),
  ];
}

function StatusBadge({ status, mine }: { status: Status; mine?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
        mine ? "bg-rose-50 text-rose-500" : "bg-[#faf7f4] text-gray-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  );
}

/* ── 메인: 캐릭터 관리 카드 ─────────────────────────── */
export function CharacterManageCard({
  name,
  status,
  imageSrc = CHARACTER_IMAGES.manage,
  onCustomize,
}: {
  name: string;
  status: Status;
  /** 꾸미기에서 고른 대표 이미지 (기본: 2번 이미지) */
  imageSrc?: string;
  onCustomize: () => void;
}) {
  return (
    <Card className="flex flex-col items-center">
      <div className="w-full">
        <CardTitle>캐릭터 관리</CardTitle>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2">
        <div className="flex min-h-0 flex-1 basis-auto justify-center">
          <CharacterImage key={imageSrc} src={imageSrc} height={150} alt={`${name} 캐릭터`} fit />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <p className="text-sm font-bold text-gray-900">{name}</p>
          <StatusBadge status={status} mine />
        </div>
      </div>
      <button
        onClick={onCustomize}
        className="mt-3 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-sm font-semibold text-gray-700 ring-1 ring-[#efe4dc] transition hover:bg-rose-50 hover:text-rose-600"
      >
        <Sparkles size={14} />
        캐릭터 꾸미기
      </button>
    </Card>
  );
}

/* ── 캐릭터 꾸미기/관리 페이지: 이름 · 상태 · 사항 수정 ──── */
function EditorRow({
  entry,
  onSave,
}: {
  entry: Entry;
  onSave: (patch: { name: string; note: string; status?: StaffStatus }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(entry.name);
  const [note, setNote] = useState(entry.note);

  useEffect(() => {
    if (!editing) {
      setName(entry.name);
      setNote(entry.note);
    }
  }, [editing, entry.name, entry.note]);

  const save = async () => {
    await onSave({ name, note });
    setEditing(false);
  };

  const mine = entry.id === ME_ID;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-2.5 ring-1 ring-[#f0e8e2]">
      <div className="h-9 w-6 shrink-0">
        <OfficeCharacter look={entry.look} pose="stand" height="100%" label={entry.name} />
      </div>

      {editing ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={10}
            autoFocus
            placeholder="이름"
            className={`${inputClass} !w-28 !py-1.5`}
            aria-label="캐릭터 이름"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && save()}
            maxLength={30}
            placeholder="사항 (예: 거래처 미팅 준비)"
            className={`${inputClass} !py-1.5 min-w-[140px] flex-1`}
            aria-label="캐릭터 사항"
          />
          <button onClick={save} className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50" aria-label="저장">
            <Check size={16} />
          </button>
          <button onClick={() => setEditing(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="취소">
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              {entry.name}
              {mine && <span className="rounded bg-rose-50 px-1 text-[10px] font-bold text-rose-500">나</span>}
            </p>
            <p className="truncate text-xs text-gray-400">{entry.note || "사항 없음"}</p>
          </div>

          {mine ? (
            <span title="출퇴근 · 지금 하는 일에 따라 자동으로 바뀌어요">
              <StatusBadge status={entry.status} mine />
            </span>
          ) : (
            <label className="relative flex shrink-0 items-center">
              <span className={`pointer-events-none absolute left-2 h-1.5 w-1.5 rounded-full ${entry.status.dot}`} />
              <select
                value={entry.statusKey ?? "working"}
                onChange={(e) => onSave({ name: entry.name, note: entry.note, status: e.target.value as StaffStatus })}
                className="appearance-none rounded-lg bg-[#faf7f4] py-1.5 pl-5 pr-2 text-xs font-semibold text-gray-600 ring-1 ring-[#efe6df] focus:outline-none focus:ring-rose-200"
                aria-label={`${entry.name} 상태`}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {STATUS_META[opt].label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label={`${entry.name} 이름·사항 수정`}
          >
            <Pencil size={14} />
          </button>
        </>
      )}
    </li>
  );
}

export function CharacterEditor({
  entries,
  available,
  onUpdate,
}: {
  entries: Entry[];
  available: boolean;
  onUpdate: (id: string, patch: { name?: string; status?: StaffStatus; note?: string }) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardTitle right={<span className="text-xs text-gray-400">{entries.length}명</span>}>
        캐릭터 이름 · 상태 · 사항
      </CardTitle>
      <p className="mb-3 text-sm text-gray-500">
        바꾼 이름과 상태는 회사 맵 이름표에 바로 반영되고, 사항은 캐릭터별 메모로 저장돼요.
      </p>
      {!available && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          DB 업데이트(0003 마이그레이션) 후 변경 내용을 저장할 수 있어요.
        </p>
      )}
      {error && <p className="mb-3 text-xs text-rose-500">{error}</p>}
      <ul className="space-y-2">
        {entries.map((entry) => (
          <EditorRow
            key={entry.id}
            entry={entry}
            onSave={async (patch) => {
              setError(null);
              try {
                await onUpdate(entry.id, patch);
              } catch {
                setError("저장하지 못했어요. DB 업데이트(0003 마이그레이션)가 적용됐는지 확인해주세요.");
              }
            }}
          />
        ))}
      </ul>
    </Card>
  );
}
