/**
 * LIVE OFFICE 의 직원 캐릭터 — ZEP / 게더타운 같은 도트(픽셀아트) 스프라이트.
 *
 * 매끈한 벡터 사람이 아니라 한 칸 한 칸 찍은 도트다.
 * 스프라이트는 16칸 폭의 문자 격자로 정의하고, 가로로 이어지는 같은 색은
 * 하나의 rect 로 합쳐서 그린다. shapeRendering="crispEdges" 로 칸이 또렷하게 나온다.
 *
 *   h 머리  s 피부  e 눈  c 상의  a 소매  p 하의  o 신발  b 상자  . 비움
 */

export type CharacterPose = "stand" | "sit" | "walk" | "carry";

export interface CharacterLook {
  hair: string;
  skin: string;
  cloth: string;
  sleeve: string;
  pants: string;
  shoe: string;
}

const EYE = "#2f2a28";

/* ── 스프라이트 ─────────────────────────────── */

const STAND = [
  "....hhhhhhhh....",
  "...hhhhhhhhhh...",
  "..hhhhhhhhhhhh..",
  "..hhhhhhhhhhhh..",
  "..hhsssssssshh..",
  "..hhsssssssshh..",
  "..hhsesssseshh..",
  "..hhsssssssshh..",
  "..hhsssssssshh..",
  "....ssssssss....",
  "......ssss......",
  "....cccccccc....",
  "..aaccccccccaa..",
  "..aaccccccccaa..",
  "..aaccccccccaa..",
  "..aaccccccccaa..",
  "..aaccccccccaa..",
  "..ssccccccccss..",
  "....pppppppp....",
  "....ppp..ppp....",
  "....ppp..ppp....",
  "....ppp..ppp....",
  "....ppp..ppp....",
  "....ooo..ooo....",
];

/** 앉은 모습 — 다리가 접혀 키가 낮다 */
const SIT = [
  "....hhhhhhhh....",
  "...hhhhhhhhhh...",
  "..hhhhhhhhhhhh..",
  "..hhhhhhhhhhhh..",
  "..hhsssssssshh..",
  "..hhsssssssshh..",
  "..hhsesssseshh..",
  "..hhsssssssshh..",
  "..hhsssssssshh..",
  "....ssssssss....",
  "......ssss......",
  "....cccccccc....",
  "..aaccccccccaa..",
  "..aaccccccccaa..",
  "..aaccccccccaa..",
  "..aaccccccccaa..",
  "..ssccccccccss..",
  "....pppppppp....",
  "....pppppppp....",
  "....ppp..ppp....",
  "....ooo..ooo....",
];

/** 걷는 모습 — 다리가 벌어져 있다 */
const WALK = [
  "....hhhhhhhh....",
  "...hhhhhhhhhh...",
  "..hhhhhhhhhhhh..",
  "..hhhhhhhhhhhh..",
  "..hhsssssssshh..",
  "..hhsssssssshh..",
  "..hhsesssseshh..",
  "..hhsssssssshh..",
  "..hhsssssssshh..",
  "....ssssssss....",
  "......ssss......",
  "....cccccccc....",
  ".aaaccccccccaaa.",
  ".aaaccccccccaaa.",
  "..aaccccccccaa..",
  "..aaccccccccaa..",
  "..ssccccccccss..",
  "....pppppppp....",
  "...ppp....ppp...",
  "...ppp....ppp...",
  "..ppp......ppp..",
  "..ppp......ppp..",
  "..ooo......ooo..",
  "................",
];

/** 상자를 들고 있는 모습 */
const CARRY = [
  "....hhhhhhhh....",
  "...hhhhhhhhhh...",
  "..hhhhhhhhhhhh..",
  "..hhhhhhhhhhhh..",
  "..hhsssssssshh..",
  "..hhsssssssshh..",
  "..hhsesssseshh..",
  "..hhsssssssshh..",
  "..hhsssssssshh..",
  "....ssssssss....",
  "......ssss......",
  "....cccccccc....",
  "..aaccccccccaa..",
  "..sabbbbbbbbas..",
  "..sabbbbbbbbas..",
  "..ssbbbbbbbbss..",
  "..aaccccccccaa..",
  "..aaccccccccaa..",
  "....pppppppp....",
  "....ppp..ppp....",
  "....ppp..ppp....",
  "....ppp..ppp....",
  "....ppp..ppp....",
  "....ooo..ooo....",
];

const SPRITES: Record<CharacterPose, string[]> = {
  stand: STAND,
  sit: SIT,
  walk: WALK,
  carry: CARRY,
};

/* ── 같은 색이 가로로 이어지면 rect 하나로 합친다 ── */
interface Run {
  x: number;
  y: number;
  w: number;
  key: string;
}

function toRuns(grid: string[]): Run[] {
  const runs: Run[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      if (key === ".") {
        x += 1;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === key) w += 1;
      runs.push({ x, y, w, key });
      x += w;
    }
  });
  return runs;
}

const RUNS: Record<CharacterPose, Run[]> = {
  stand: toRuns(STAND),
  sit: toRuns(SIT),
  walk: toRuns(WALK),
  carry: toRuns(CARRY),
};

interface Props {
  look: CharacterLook;
  pose: CharacterPose;
  facing?: "left" | "right";
  /** 스프라이트 높이 (px 또는 % 등 CSS 길이) */
  height?: number | string;
  label?: string;
}

export default function OfficeCharacter({
  look,
  pose,
  facing = "right",
  height = 72,
  label = "직원",
}: Props) {
  const grid = SPRITES[pose];
  const runs = RUNS[pose];

  const color: Record<string, string> = {
    h: look.hair,
    s: look.skin,
    e: EYE,
    c: look.cloth,
    a: look.sleeve,
    p: look.pants,
    o: look.shoe,
    b: "#e0b47f",
  };

  return (
    <svg
      viewBox={`0 0 16 ${grid.length}`}
      shapeRendering="crispEdges"
      preserveAspectRatio="xMidYMax meet"
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: "auto",
        display: "block",
        transform: facing === "left" ? "scaleX(-1)" : undefined,
      }}
      role="img"
      aria-label={label}
    >
      {runs.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={color[r.key]} />
      ))}
    </svg>
  );
}
