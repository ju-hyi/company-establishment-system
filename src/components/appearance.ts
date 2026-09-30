import { CHARACTER_IMAGES } from "./CharacterSpeech";
import type { CharacterLook } from "./OfficeCharacter";

/**
 * 캐릭터 꾸미기 옵션.
 *
 *   헤어 · 옷 — 회사 맵 도트 캐릭터의 "색"만 바꾼다. 도트 모양(스프라이트)은 그대로다.
 *   색상     — 포인트 색: 맵 이름표 · 오른쪽 위 프로필 테두리.
 *   기타     — 대표 이미지: 사용자가 제공한 일러스트 중 하나 (프로필 · 캐릭터 관리 카드).
 *
 * 옵션을 늘리려면 아래 배열에 항목만 추가하면 꾸미기 화면에 바로 나타난다.
 * 일러스트 옵션은 사용자가 제공한 이미지만 쓴다 (새로 그리지 않는다).
 */

export interface Appearance {
  hair: string;
  outfit: string;
  point: string;
  illustration: string;
}

export const HAIR_OPTIONS = [
  { id: "brown", label: "기본 브라운", color: "#6b4a38" },
  { id: "dark", label: "다크 브라운", color: "#4a3228" },
  { id: "black", label: "흑발", color: "#2b2626" },
  { id: "light", label: "밝은 갈색", color: "#9b6b47" },
  { id: "ash", label: "애쉬 브라운", color: "#7a6a63" },
  { id: "wine", label: "와인", color: "#7a3b3f" },
];

export const OUTFIT_OPTIONS = [
  { id: "pink", label: "기본 핑크", cloth: "#f286b0", sleeve: "#e275a1", pants: "#6f7f9f" },
  { id: "black", label: "블랙 후드", cloth: "#3b3b42", sleeve: "#2f2f35", pants: "#5a6480" },
  { id: "navy", label: "네이비", cloth: "#4a5d8a", sleeve: "#3f5079", pants: "#6f7f9f" },
  { id: "mint", label: "민트", cloth: "#8fd3bf", sleeve: "#7cc3ae", pants: "#6f7f9f" },
  { id: "lavender", label: "라벤더", cloth: "#b9a3e3", sleeve: "#a78fd6", pants: "#6f7f9f" },
  { id: "beige", label: "베이지", cloth: "#e6c9a3", sleeve: "#d9b88e", pants: "#6f7f9f" },
];

export const POINT_OPTIONS = [
  { id: "rose", label: "로즈", color: "#fb7185" },
  { id: "violet", label: "바이올렛", color: "#a78bfa" },
  { id: "sky", label: "스카이", color: "#38bdf8" },
  { id: "emerald", label: "에메랄드", color: "#34d399" },
  { id: "amber", label: "앰버", color: "#f5b942" },
  { id: "slate", label: "슬레이트", color: "#64748b" },
];

export const ILLUSTRATION_OPTIONS = [
  { id: "cap", label: "모자", src: CHARACTER_IMAGES.manage },
  { id: "bunny", label: "토끼 후드", src: CHARACTER_IMAGES.dailyMessage },
  { id: "hoodie", label: "후드티", src: CHARACTER_IMAGES.cheer },
  { id: "glasses", label: "안경", src: CHARACTER_IMAGES.glasses },
];

/** 기본값 — 지금까지 확정된 모습과 같다 (도트: 브라운 머리 + 핑크 옷, 대표 이미지: 모자) */
export const DEFAULT_APPEARANCE: Appearance = {
  hair: "brown",
  outfit: "pink",
  point: "rose",
  illustration: "cap",
};

const pick = <T extends { id: string }>(list: T[], id: string | undefined) =>
  list.find((o) => o.id === id) ?? list[0];

/** 저장값에 없는 항목(또는 없어진 옵션)은 기본값으로 채운다. */
export function resolveAppearance(saved?: Partial<Appearance>): Appearance {
  return {
    hair: pick(HAIR_OPTIONS, saved?.hair ?? DEFAULT_APPEARANCE.hair).id,
    outfit: pick(OUTFIT_OPTIONS, saved?.outfit ?? DEFAULT_APPEARANCE.outfit).id,
    point: pick(POINT_OPTIONS, saved?.point ?? DEFAULT_APPEARANCE.point).id,
    illustration: pick(ILLUSTRATION_OPTIONS, saved?.illustration ?? DEFAULT_APPEARANCE.illustration).id,
  };
}

/** 도트 캐릭터 색 — 기본 모습(base)에서 머리 · 옷 색만 바꾼다. */
export function lookFor(base: CharacterLook, a: Appearance): CharacterLook {
  const outfit = pick(OUTFIT_OPTIONS, a.outfit);
  return {
    ...base,
    hair: pick(HAIR_OPTIONS, a.hair).color,
    cloth: outfit.cloth,
    sleeve: outfit.sleeve,
    pants: outfit.pants,
  };
}

export const pointColorOf = (a: Appearance) => pick(POINT_OPTIONS, a.point).color;
export const illustrationOf = (a: Appearance) => pick(ILLUSTRATION_OPTIONS, a.illustration).src;
