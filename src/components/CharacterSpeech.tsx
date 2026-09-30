import { useState, type ReactNode } from "react";

/**
 * 캐릭터 이미지 + 말풍선. 캐릭터가 옆에서 말하는 것처럼 꼬리가 캐릭터 쪽(왼쪽)을 향한다.
 *
 * 캐릭터 그림은 사용자가 제공한 이미지를 그대로 쓴다 (public/characters/char-*.webp).
 * 원본에서 바깥 흰 배경만 투명 처리하고 여백을 자른 뒤 480px 높이로 줄였다.
 * 화면에는 그보다 훨씬 작게 표시되므로 고해상도 화면에서도 깨지지 않는다.
 */

export const CHARACTER_IMAGES = {
  /** 1번 이미지 — 오늘의 한마디 */
  dailyMessage: "/characters/char-bunny.webp",
  /** 2번 이미지 — 캐릭터 관리 */
  manage: "/characters/char-cap.webp",
  /** 3번 이미지 — 오늘의 진행률 응원 */
  cheer: "/characters/char-hoodie.webp",
  /** 안경 버전 — 꾸미기 대표 이미지 선택용 */
  glasses: "/characters/char-glasses.webp",
} as const;

/** 원본 비율(가로/세로) — 레이아웃이 흔들리지 않도록 width 를 미리 잡는다 */
const RATIO: Record<string, number> = {
  [CHARACTER_IMAGES.dailyMessage]: 387 / 480,
  [CHARACTER_IMAGES.manage]: 384 / 480,
  [CHARACTER_IMAGES.cheer]: 414 / 480,
  [CHARACTER_IMAGES.glasses]: 419 / 480,
};

export function CharacterImage({
  src,
  height,
  alt = "내 캐릭터",
  className = "",
  fit = false,
}: {
  src: string;
  /** 표시 높이(px). fit 이면 최대 높이 */
  height: number;
  alt?: string;
  className?: string;
  /** 부모 높이가 정해져 있으면 그 안에 맞춰 줄어든다 (최대 height) */
  fit?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt={alt}
      width={Math.round(height * (RATIO[src] ?? 0.8))}
      height={height}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`select-none object-contain ${fit ? "h-full min-h-0" : "shrink-0"} ${className}`}
      style={fit ? { maxHeight: height, width: "auto" } : { height, width: "auto" }}
    />
  );
}

export default function CharacterSpeech({
  src,
  imageHeight,
  children,
  compact = false,
  vertical = false,
}: {
  src: string;
  imageHeight: number;
  children: ReactNode;
  compact?: boolean;
  /** true: 캐릭터가 위, 말풍선이 아래 (꼬리가 위쪽 캐릭터를 향한다) */
  vertical?: boolean;
}) {
  if (vertical) {
    return (
      <div className="flex h-full flex-col items-center">
        {/* 카드 높이가 정해져 있으면 캐릭터가 그 안에 맞춰 줄어든다 */}
        <div className="flex min-h-0 flex-1 basis-auto justify-center">
          <CharacterImage src={src} height={imageHeight} fit />
        </div>
        <div className="relative mt-3 w-full shrink-0">
          <div className="rounded-[20px] bg-[#fdf1f4] px-4 py-3.5 text-center ring-1 ring-[#f5d9e1]">
            <div className="max-h-24 overflow-y-auto whitespace-pre-line break-words text-sm font-medium leading-relaxed text-gray-700">
              {children}
            </div>
          </div>
          {/* 꼬리: 위쪽 캐릭터를 향한다. 말풍선 테두리와 이어지도록 경계선 위를 덮는다 */}
          <svg
            className="absolute -top-[10px] left-1/2 z-10 -translate-x-1/2"
            width="20"
            height="12"
            viewBox="0 0 20 12"
            aria-hidden
          >
            <path d="M1 12 L10 2 L19 12" fill="#fdf1f4" stroke="#f5d9e1" strokeWidth="1.2" strokeLinejoin="round" />
            <rect x="1.8" y="9.2" width="16.4" height="3" fill="#fdf1f4" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <CharacterImage src={src} height={imageHeight} />

      {/* 말풍선 — 꼬리가 캐릭터를 향한다 */}
      <div className="relative min-w-0 flex-1">
        <div
          className={`rounded-[18px] bg-[#fdf1f4] ring-1 ring-[#f5d9e1] ${compact ? "px-3 py-2.5" : "px-4 py-3.5"}`}
        >
          <div
            className={`whitespace-pre-line break-words font-medium leading-relaxed text-gray-700 ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {children}
          </div>
        </div>
        {/* 꼬리: 말풍선 테두리와 이어지도록 경계선 위를 덮는다 */}
        <svg
          className="absolute -left-[10px] top-1/2 z-10 -translate-y-1/2"
          width="12"
          height="18"
          viewBox="0 0 12 18"
          aria-hidden
        >
          <path d="M12 1 L2 9 L12 17" fill="#fdf1f4" stroke="#f5d9e1" strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="9.2" y="1.8" width="3" height="14.4" fill="#fdf1f4" />
        </svg>
      </div>
    </div>
  );
}
