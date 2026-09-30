import { useEffect, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import OfficeCharacter from "../components/OfficeCharacter";
import { CharacterImage } from "../components/CharacterSpeech";
import { CharacterEditor, characterEntries, ME_ID } from "../components/CharacterManager";
import { ME_LOOK } from "../components/OfficeScene";
import {
  DEFAULT_APPEARANCE,
  HAIR_OPTIONS,
  ILLUSTRATION_OPTIONS,
  OUTFIT_OPTIONS,
  POINT_OPTIONS,
  illustrationOf,
  lookFor,
  pointColorOf,
  resolveAppearance,
  type Appearance,
} from "../components/appearance";
import { Card, CardTitle, PageHeader } from "../components/ui";
import type { useOfficeProfile } from "../hooks/useOfficeProfile";

/**
 * 캐릭터 꾸미기 / 관리 — 메인 "캐릭터 관리"의 [캐릭터 꾸미기] 버튼으로 들어온다.
 *
 * 1) 외형 꾸미기: 헤어 · 옷 · 색상 · 기타 (옵션은 components/appearance.ts)
 *    고르는 동안 미리보기에만 반영되고, [저장]을 누르면 맵 · 프로필 · 캐릭터 관리 카드에 적용된다.
 * 2) 회사 맵 캐릭터의 이름 · 상태 · 사항 수정 (profiles.office_characters 에 저장)
 */

type SectionId = keyof Appearance;

const SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: "hair", label: "헤어", hint: "회사 맵 속 내 캐릭터의 머리색이 바뀌어요." },
  { id: "outfit", label: "옷", hint: "회사 맵 속 내 캐릭터의 옷 색이 바뀌어요." },
  { id: "point", label: "색상", hint: "맵의 내 이름표와 오른쪽 위 프로필 테두리 색이 바뀌어요." },
  { id: "illustration", label: "기타", hint: "오른쪽 위 프로필과 캐릭터 관리 카드의 대표 이미지가 바뀌어요." },
];

interface CharacterPageProps {
  office: ReturnType<typeof useOfficeProfile>;
  myName: string;
  myStatus: { label: string; dot: string };
  onBack: () => void;
}

function Swatch({ color, second }: { color: string; second?: string }) {
  return (
    <span
      className="block h-7 w-7 rounded-full ring-2 ring-white"
      style={{
        background: second ? `linear-gradient(135deg, ${color} 50%, ${second} 50%)` : color,
        boxShadow: "0 0 0 1px #e8ded6",
      }}
    />
  );
}

export default function CharacterPage({ office, myName, myStatus, onBack }: CharacterPageProps) {
  const saved = resolveAppearance(office.characters[ME_ID]?.appearance);
  const [draft, setDraft] = useState<Appearance>(saved);
  const [section, setSection] = useState<SectionId>("hair");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // 저장된 값이 늦게 도착하면 초안도 맞춘다.
  const savedKey = JSON.stringify(saved);
  useEffect(() => setDraft(resolveAppearance(JSON.parse(savedKey))), [savedKey]);

  const dirty = JSON.stringify(draft) !== savedKey;
  const look = lookFor(ME_LOOK, draft);
  const displayName = office.characters[ME_ID]?.name ?? myName;
  const entries = characterEntries(office.characters, myName, myStatus, lookFor(ME_LOOK, saved));
  const hint = SECTIONS.find((s) => s.id === section)?.hint;

  const choose = (key: SectionId, id: string) => {
    setDraft((d) => ({ ...d, [key]: id }));
    setState("idle");
  };

  const save = async () => {
    setState("saving");
    try {
      await office.updateCharacter(ME_ID, { appearance: draft });
      setState("saved");
    } catch {
      setState("error");
    }
  };

  const optionClass = (active: boolean) =>
    `flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold transition ${
      active ? "bg-rose-50 text-rose-600 ring-2 ring-rose-300" : "bg-[#faf7f4] text-gray-600 ring-1 ring-[#efe6df] hover:bg-white"
    }`;

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-sm font-semibold text-gray-400 transition hover:text-rose-500"
      >
        <ArrowLeft size={16} />
        라이브 오피스로
      </button>
      <PageHeader title="캐릭터 꾸미기" description="내 캐릭터의 외형과 회사 맵 캐릭터 정보를 관리합니다." />

      <div className="space-y-5">
        <Card>
          <CardTitle>외형 꾸미기</CardTitle>
          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            {/* 미리보기 */}
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#fdf6f3] p-4">
              <CharacterImage key={draft.illustration} src={illustrationOf(draft)} height={150} alt={`${displayName} 캐릭터`} />
              <div className="flex w-full items-end justify-center gap-4 border-t border-dashed border-[#efe1d8] pt-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-14">
                    <OfficeCharacter look={look} pose="stand" height="100%" label="맵 캐릭터 미리보기" />
                  </div>
                  <span
                    className="rounded-md px-1.5 text-[10px] font-bold leading-4 text-white"
                    style={{ background: pointColorOf(draft) }}
                  >
                    {displayName}
                  </span>
                </div>
                <p className="pb-1 text-[11px] leading-snug text-gray-400">
                  회사 맵
                  <br />
                  캐릭터
                </p>
              </div>
            </div>

            {/* 옵션 */}
            <div className="flex flex-col">
              <div className="mb-3 flex gap-1 border-b border-[#f3ede8]">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${
                      section === s.id
                        ? "border-rose-400 text-rose-500"
                        : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {section === "hair" &&
                  HAIR_OPTIONS.map((o) => (
                    <button key={o.id} onClick={() => choose("hair", o.id)} className={optionClass(draft.hair === o.id)}>
                      <Swatch color={o.color} />
                      {o.label}
                    </button>
                  ))}
                {section === "outfit" &&
                  OUTFIT_OPTIONS.map((o) => (
                    <button key={o.id} onClick={() => choose("outfit", o.id)} className={optionClass(draft.outfit === o.id)}>
                      <Swatch color={o.cloth} second={o.pants} />
                      {o.label}
                    </button>
                  ))}
                {section === "point" &&
                  POINT_OPTIONS.map((o) => (
                    <button key={o.id} onClick={() => choose("point", o.id)} className={optionClass(draft.point === o.id)}>
                      <Swatch color={o.color} />
                      {o.label}
                    </button>
                  ))}
                {section === "illustration" &&
                  ILLUSTRATION_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => choose("illustration", o.id)}
                      className={optionClass(draft.illustration === o.id)}
                    >
                      <CharacterImage src={o.src} height={64} alt={o.label} />
                      {o.label}
                    </button>
                  ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">{hint}</p>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <button
                  onClick={save}
                  disabled={!dirty || state === "saving" || !office.available}
                  className="rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-40"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setDraft(DEFAULT_APPEARANCE);
                    setState("idle");
                  }}
                  className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50"
                >
                  <RotateCcw size={14} />
                  기본으로
                </button>
                {state === "saved" && !dirty && (
                  <span className="text-xs font-semibold text-emerald-600">저장했어요 — 맵과 프로필에 적용됐어요</span>
                )}
                {state === "error" && <span className="text-xs text-rose-500">저장하지 못했어요</span>}
                {!office.available && (
                  <span className="text-xs text-amber-700">DB 업데이트(0003 마이그레이션) 후 저장할 수 있어요.</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <CharacterEditor entries={entries} available={office.available} onUpdate={office.updateCharacter} />
      </div>
    </div>
  );
}
