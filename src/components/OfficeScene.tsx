import OfficeCharacter from "./OfficeCharacter";
import type { CharacterLook, CharacterPose } from "./OfficeCharacter";
import {
  Bookshelf,
  Boxes,
  Chair,
  Desk,
  Door,
  Mat,
  MeetingTable,
  Plant,
  RoundTable,
  Shelf,
  Sofa,
} from "./OfficeFurniture";
import type { CharacterActivity, CharacterLocation } from "../types";

/**
 * LIVE OFFICE — ZEP / 게더타운 같은 2D 오피스 맵.
 *
 * 분홍 배경 위에 둥근 방 카드 7개를 놓고, 그 안에 책상·의자·노트북만 최소한으로 둔다.
 * 사람은 도트 캐릭터로 작게(맵 높이의 9%) 배치하고 이름표를 단다.
 * 맵이 주인공이고 사람은 맵의 일부다.
 */

const W = 1200;
const H = 780;

const px = (x: number) => `${(x / W) * 100}%`;
const py = (y: number) => `${(y / H) * 100}%`;
const CHAR_H = py(64);

const ROOM_FILL = "#fdfaf5";
const ROOM_LINE = "#ecdccb";

function Room({
  x,
  y,
  w,
  h,
  name,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
}) {
  const tagW = name.length * 13 + 22;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={ROOM_FILL} stroke={ROOM_LINE} strokeWidth={3} />
      <rect x={x + 14} y={y + 12} width={tagW} height={26} rx={13} fill="#f6e7ee" />
      <text x={x + 14 + tagW / 2} y={y + 30} textAnchor="middle" fontSize={14} fontWeight={700} fill="#8a6f7d">
        {name}
      </text>
    </g>
  );
}

/* ── 직원 ─────────────────────────────────────── */
const look = (hair: string, cloth: string, sleeve: string, pants: string): CharacterLook => ({
  hair,
  skin: "#f7d2b4",
  cloth,
  sleeve,
  pants,
  shoe: "#5a6480",
});

export const ME_LOOK = look("#6b4a38", "#f286b0", "#e275a1", "#6f7f9f");

interface Staff {
  id: string;
  name: string;
  x: number;
  y: number;
  pose: CharacterPose;
  facing: "left" | "right";
  look: CharacterLook;
}

const STAFF: Staff[] = [
  // 회의실 — 테이블에 둘러앉아 회의
  { id: "m1", name: "이대리", x: 162, y: 132, pose: "sit", facing: "right", look: look("#4a3830", "#87aee0", "#749bcd", "#4f5d78") },
  { id: "m2", name: "한주임", x: 240, y: 132, pose: "sit", facing: "right", look: look("#31292a", "#c0a2e0", "#ad8ed2", "#56617e") },
  { id: "m3", name: "서대리", x: 318, y: 132, pose: "sit", facing: "left", look: look("#7c4b33", "#f0a098", "#e08c84", "#5d6a86") },

  // 휴게실 — 소파에서 쉬는 사람, 서서 이야기하는 사람
  { id: "b1", name: "유대리", x: 590, y: 152, pose: "sit", facing: "right", look: look("#6d4330", "#8fcfb8", "#7bbfa7", "#6a7896") },
  { id: "b2", name: "김사원", x: 706, y: 240, pose: "stand", facing: "left", look: look("#463932", "#efc46f", "#e0b35a", "#5b6886") },

  // 공부·자기계발 — 책상에서 공부
  { id: "s1", name: "정과장", x: 1054, y: 162, pose: "sit", facing: "right", look: look("#8a5a3c", "#a8c9ea", "#93b8de", "#5f6b88") },

  // 마케팅팀 — 노트북 업무 + 지나가는 사람
  { id: "k1", name: "박사원", x: 122, y: 430, pose: "sit", facing: "right", look: look("#5d4030", "#9ccbe8", "#86bcdd", "#59668a") },
  { id: "k2", name: "최주임", x: 288, y: 430, pose: "sit", facing: "right", look: look("#3f3630", "#a3dcae", "#8ecd9b", "#5b6886") },
  { id: "k3", name: "오사원", x: 524, y: 500, pose: "walk", facing: "left", look: look("#4a3630", "#f0a5bd", "#e08fab", "#636f8d") },

  // 회계팀 — 노트북 업무
  { id: "a1", name: "강대리", x: 702, y: 430, pose: "sit", facing: "right", look: look("#3b3230", "#b9c6da", "#a4b3ca", "#525f7d") },
  { id: "a2", name: "윤사원", x: 868, y: 430, pose: "sit", facing: "right", look: look("#5a4334", "#e8b48f", "#d9a079", "#586686") },

  // 창고 — 박스 정리
  { id: "w1", name: "한사원", x: 332, y: 722, pose: "carry", facing: "left", look: look("#42566e", "#cdb493", "#bca180", "#55627d") },

  // 출입구 — 들어오는 사람
  { id: "e1", name: "신입", x: 622, y: 702, pose: "walk", facing: "left", look: look("#3f352f", "#9fb8d8", "#8aa5c9", "#4f5c78") },
  { id: "e2", name: "임차장", x: 1046, y: 700, pose: "stand", facing: "left", look: look("#4b3c33", "#d3a9dd", "#c294cf", "#535f7c") },
];

/** 내 캐릭터가 서는 자리 (스프라이트 아래쪽 기준) */
const ZONE_POS: Record<CharacterLocation, { x: number; y: number }> = {
  meeting: { x: 408, y: 252 },
  break_room: { x: 790, y: 252 },
  storage: { x: 900, y: 252 },
  desk: { x: 1034, y: 430 },
  entrance: { x: 500, y: 702 },
  outside: { x: 500, y: 740 },
};

const POSE_BY_ACTIVITY: Record<CharacterActivity, CharacterPose> = {
  idle: "stand",
  walking: "walk",
  working: "sit",
  studying: "sit",
  exercising: "stand",
  resting: "sit",
  leaving: "walk",
};

function NameTag({ children, mine }: { children: React.ReactNode; mine?: boolean }) {
  return (
    <span
      className={`mt-0.5 block whitespace-nowrap rounded-full px-1.5 text-[8px] font-bold leading-[13px] ${
        mine ? "bg-rose-400 text-white" : "bg-white/90 text-gray-500"
      }`}
    >
      {children}
    </span>
  );
}

interface OfficeSceneProps {
  location: CharacterLocation;
  activity: CharacterActivity;
}

export default function OfficeScene({ location, activity }: OfficeSceneProps) {
  const me = ZONE_POS[location];

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl shadow-lg"
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      {/* ───── 배경 · 방 · 가구 ───── */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="bgDots" width="28" height="28" patternUnits="userSpaceOnUse">
            <rect width="28" height="28" fill="#f7d7e2" />
            <circle cx="7" cy="7" r="2" fill="#f2c7d6" />
            <circle cx="21" cy="21" r="2" fill="#f2c7d6" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#bgDots)" />

        {/* 방 7개 */}
        <Room x={26} y={26} w={444} h={250} name="회의실" />
        <Room x={486} y={26} w={342} h={250} name="휴게실" />
        <Room x={844} y={26} w={330} h={250} name="공부·자기계발" />
        <Room x={26} y={294} w={566} h={242} name="마케팅팀" />
        <Room x={608} y={294} w={566} h={242} name="회계팀" />
        <Room x={26} y={554} w={362} h={200} name="창고" />
        <Room x={404} y={554} w={770} h={200} name="출입구" />

        {/* 회의실 */}
        <Chair x={152} y={100} />
        <Chair x={230} y={100} />
        <Chair x={308} y={100} />
        <MeetingTable x={110} y={128} w={260} h={68} />
        <Chair x={172} y={200} />
        <Chair x={288} y={200} />
        <Plant x={64} y={248} />
        <Plant x={432} y={248} />

        {/* 휴게실 */}
        <Sofa x={530} y={120} w={120} />
        <RoundTable x={716} y={186} r={26} />
        <Plant x={520} y={248} />
        <Plant x={794} y={82} />

        {/* 공부·자기계발 */}
        <Bookshelf x={874} y={70} w={120} />
        <Chair x={1041} y={126} />
        <Desk x={1016} y={152} w={76} />
        <Plant x={882} y={230} />
        <Plant x={1140} y={248} />

        {/* 마케팅팀 */}
        {[84, 250, 416].map((dx) => (
          <g key={`k${dx}`}>
            <Chair x={dx + 25} y={392} />
            <Desk x={dx} y={418} w={76} />
          </g>
        ))}
        <Plant x={56} y={500} />
        <Plant x={560} y={340} />

        {/* 회계팀 */}
        {[664, 830, 996].map((dx) => (
          <g key={`a${dx}`}>
            <Chair x={dx + 25} y={392} />
            <Desk x={dx} y={418} w={76} />
          </g>
        ))}
        <Plant x={1142} y={500} />
        <Plant x={642} y={340} />

        {/* 창고 */}
        <Shelf x={62} y={600} w={110} />
        <Boxes x={212} y={604} />
        <Plant x={56} y={726} />

        {/* 출입구 */}
        <Mat x={738} y={676} w={104} h={34} />
        <Door x={742} y={716} w={96} />
        <RoundTable x={1046} y={650} r={26} />
        <Plant x={436} y={726} />
        <Plant x={1142} y={726} />
        <Plant x={960} y={600} />
      </svg>

      {/* ───── 사람 ───── */}
      {STAFF.map((s) => (
        <div
          key={s.id}
          className="absolute flex flex-col items-center"
          style={{ left: px(s.x), top: py(s.y), height: CHAR_H, transform: "translate(-50%, -100%)" }}
        >
          <OfficeCharacter look={s.look} pose={s.pose} facing={s.facing} height="100%" label={s.name} />
          <NameTag>{s.name}</NameTag>
        </div>
      ))}

      <div
        className="absolute z-10 flex flex-col items-center"
        style={{ left: px(me.x), top: py(me.y), height: CHAR_H, transform: "translate(-50%, -100%)" }}
      >
        <OfficeCharacter
          look={ME_LOOK}
          pose={POSE_BY_ACTIVITY[activity]}
          facing="right"
          height="100%"
          label="김주희"
        />
        <NameTag mine>김주희</NameTag>
      </div>
    </div>
  );
}
