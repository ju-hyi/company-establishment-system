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
import type { CharacterActivity, CharacterLocation, CharacterOverrides, StaffStatus } from "../types";

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
  /** 캐릭터 관리에서 바꾸기 전의 기본 상태 */
  status: StaffStatus;
  x: number;
  y: number;
  pose: CharacterPose;
  facing: "left" | "right";
  look: CharacterLook;
}

export const STAFF: Staff[] = [
  // 회의실 — 테이블에 둘러앉아 회의
  { id: "m1", name: "이대리", status: "meeting", x: 162, y: 132, pose: "sit", facing: "right", look: look("#4a3830", "#87aee0", "#749bcd", "#4f5d78") },
  { id: "m2", name: "한주임", status: "meeting", x: 240, y: 132, pose: "sit", facing: "right", look: look("#31292a", "#c0a2e0", "#ad8ed2", "#56617e") },
  { id: "m3", name: "서대리", status: "meeting", x: 318, y: 132, pose: "sit", facing: "left", look: look("#7c4b33", "#f0a098", "#e08c84", "#5d6a86") },

  // 휴게실 — 소파에서 쉬는 사람, 서서 이야기하는 사람
  { id: "b1", name: "유대리", status: "resting", x: 590, y: 152, pose: "sit", facing: "right", look: look("#6d4330", "#8fcfb8", "#7bbfa7", "#6a7896") },
  { id: "b2", name: "김사원", status: "resting", x: 706, y: 240, pose: "stand", facing: "left", look: look("#463932", "#efc46f", "#e0b35a", "#5b6886") },

  // 공부·자기계발 — 책상에서 공부
  { id: "s1", name: "정과장", status: "studying", x: 1054, y: 162, pose: "sit", facing: "right", look: look("#8a5a3c", "#a8c9ea", "#93b8de", "#5f6b88") },

  // 마케팅팀 — 노트북 업무 + 지나가는 사람
  { id: "k1", name: "박사원", status: "working", x: 122, y: 430, pose: "sit", facing: "right", look: look("#5d4030", "#9ccbe8", "#86bcdd", "#59668a") },
  { id: "k2", name: "최주임", status: "working", x: 288, y: 430, pose: "sit", facing: "right", look: look("#3f3630", "#a3dcae", "#8ecd9b", "#5b6886") },
  { id: "k3", name: "오사원", status: "moving", x: 524, y: 500, pose: "walk", facing: "left", look: look("#4a3630", "#f0a5bd", "#e08fab", "#636f8d") },

  // 회계팀 — 노트북 업무
  { id: "a1", name: "강대리", status: "working", x: 702, y: 430, pose: "sit", facing: "right", look: look("#3b3230", "#b9c6da", "#a4b3ca", "#525f7d") },
  { id: "a2", name: "윤사원", status: "working", x: 868, y: 430, pose: "sit", facing: "right", look: look("#5a4334", "#e8b48f", "#d9a079", "#586686") },

  // 창고 — 박스 정리
  { id: "w1", name: "한사원", status: "working", x: 332, y: 722, pose: "carry", facing: "left", look: look("#42566e", "#cdb493", "#bca180", "#55627d") },

  // 출입구 — 들어오는 사람
  { id: "e1", name: "신입", status: "moving", x: 622, y: 702, pose: "walk", facing: "left", look: look("#3f352f", "#9fb8d8", "#8aa5c9", "#4f5c78") },
  { id: "e2", name: "임차장", status: "resting", x: 1046, y: 700, pose: "stand", facing: "left", look: look("#4b3c33", "#d3a9dd", "#c294cf", "#535f7c") },
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

export const STATUS_META: Record<StaffStatus, { label: string; dot: string }> = {
  working: { label: "업무 중", dot: "bg-emerald-400" },
  meeting: { label: "회의 중", dot: "bg-violet-400" },
  moving: { label: "이동 중", dot: "bg-blue-400" },
  resting: { label: "휴식 중", dot: "bg-amber-400" },
  studying: { label: "공부 중", dot: "bg-sky-400" },
  away: { label: "자리 비움", dot: "bg-gray-300" },
};

/**
 * 이름표 + 상태 한 줄 (● 업무 중).
 * 글자 크기는 맵 폭(cqw)에 비례해서 줄어든다 — 좁은 화면에서도 이름표끼리 겹치지 않는다.
 * 넓은 화면에서의 크기(8px / 6.5px)는 그대로다.
 */
function NameTag({
  children,
  mine,
  status,
  color,
}: {
  children: React.ReactNode;
  mine?: boolean;
  status: { label: string; dot: string };
  /** 내 이름표 배경색 (꾸미기 포인트 색) */
  color?: string;
}) {
  return (
    <span
      className={`mt-0.5 flex flex-col items-center whitespace-nowrap rounded-md py-px font-bold ${
        mine ? "bg-rose-400 text-white" : "bg-white/90 text-gray-500"
      }`}
      style={{
        background: mine && color ? color : undefined,
        fontSize: "clamp(4px, 0.9cqw, 8px)",
        lineHeight: 1.35,
        paddingInline: "clamp(2px, 0.55cqw, 6px)",
      }}
    >
      {children}
      <span
        className={`flex items-center gap-0.5 font-semibold ${mine ? "text-white/90" : "text-gray-400"}`}
        style={{ fontSize: "clamp(3.5px, 0.74cqw, 6.5px)" }}
      >
        <span
          className={`shrink-0 rounded-full ${status.dot}`}
          style={{ width: "clamp(2.5px, 0.45cqw, 4px)", height: "clamp(2.5px, 0.45cqw, 4px)" }}
        />
        {status.label}
      </span>
    </span>
  );
}

interface OfficeSceneProps {
  location: CharacterLocation;
  activity: CharacterActivity;
  /** 캐릭터 관리에서 바꾼 이름·상태 */
  overrides?: CharacterOverrides;
  /** 내 캐릭터 이름 (관리에서 바꾸지 않았으면 기본값) */
  myName?: string;
  /** 내 캐릭터 상태 — 출퇴근·활동에서 자동으로 정해진다 */
  myStatus?: { label: string; dot: string };
  /** 캐릭터 꾸미기에서 바꾼 도트 색 (없으면 기본 모습) */
  myLook?: CharacterLook;
  /** 내 이름표 색 */
  myColor?: string;
}

export default function OfficeScene({
  location,
  activity,
  overrides = {},
  myName = "김주희",
  myStatus = STATUS_META.working,
  myLook = ME_LOOK,
  myColor,
}: OfficeSceneProps) {
  const me = ZONE_POS[location];

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl shadow-lg"
      style={{ aspectRatio: `${W} / ${H}`, containerType: "inline-size" }}
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
      {STAFF.map((s) => {
        const name = overrides[s.id]?.name ?? s.name;
        const status = overrides[s.id]?.status ?? s.status;
        return (
          <div
            key={s.id}
            className={`absolute flex flex-col items-center transition-opacity ${status === "away" ? "opacity-40" : ""}`}
            style={{ left: px(s.x), top: py(s.y), height: CHAR_H, transform: "translate(-50%, -100%)" }}
          >
            <OfficeCharacter look={s.look} pose={s.pose} facing={s.facing} height="100%" label={name} />
            <NameTag status={STATUS_META[status]}>{name}</NameTag>
          </div>
        );
      })}

      <div
        className="absolute z-10 flex flex-col items-center"
        style={{ left: px(me.x), top: py(me.y), height: CHAR_H, transform: "translate(-50%, -100%)" }}
      >
        <OfficeCharacter
          look={myLook}
          pose={POSE_BY_ACTIVITY[activity]}
          facing="right"
          height="100%"
          label={myName}
        />
        <NameTag mine status={myStatus} color={myColor}>
          {myName}
        </NameTag>
      </div>
    </div>
  );
}
