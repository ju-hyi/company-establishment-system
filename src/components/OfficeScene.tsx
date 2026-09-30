import { useEffect, useRef, useState } from "react";
import OfficeCharacter from "./OfficeCharacter";
import type { CharacterActivity, CharacterLocation } from "../types";

/**
 * LIVE OFFICE 공간.
 *
 * 방과 가구를 그리고, 캐릭터를 현재 위치로 "걸어서" 이동시킨다.
 * 위치가 바뀌면 이동하는 동안에는 걷는 동작으로 바꿨다가 도착하면 원래 활동으로 돌아간다.
 */

interface OfficeSceneProps {
  location: CharacterLocation;
  activity: CharacterActivity;
  message: string;
  showBubble: boolean;
}

/** 캐릭터의 발이 놓이는 지점 (컨테이너 대비 %) */
const ZONE_POS: Record<CharacterLocation, { x: number; y: number }> = {
  meeting: { x: 17, y: 48 },
  break_room: { x: 50, y: 48 },
  storage: { x: 83, y: 48 },
  desk: { x: 50, y: 72 },
  entrance: { x: 12, y: 76 },
  outside: { x: 12, y: 82 },
};

const ZONE_NAME: Record<CharacterLocation, string> = {
  meeting: "회의실",
  break_room: "휴게실",
  storage: "자료실",
  desk: "내 자리",
  entrance: "출입구",
  outside: "퇴근",
};

function RoomLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-gray-600 shadow-sm ring-1 ring-black/5">
      {children}
    </span>
  );
}

function Plant({ className }: { className: string }) {
  return (
    <div className={`absolute flex flex-col items-center ${className}`}>
      <div className="h-5 w-5 rounded-full bg-[#7fb083]" />
      <div className="-mt-1 h-3.5 w-4 rounded-b-md bg-[#c98f6a]" />
    </div>
  );
}

/** 사무실이 비어 보이지 않도록 두는 빈 자리 */
function SideDesk({ className }: { className: string }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="h-2 w-full rounded-sm bg-[#e6cdaa] ring-1 ring-[#cbae87]" />
      <div className="mx-auto -mt-3 h-3 w-5 rounded-[2px] bg-[#9aa8bd]" />
      <div className="mx-auto mt-2 h-2.5 w-2.5 rounded-full bg-[#b9c3d4]" />
    </div>
  );
}

export default function OfficeScene({
  location,
  activity,
  message,
  showBubble,
}: OfficeSceneProps) {
  const posRef = useRef(ZONE_POS[location]);
  const [pos, setPos] = useState(posRef.current);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [durationMs, setDurationMs] = useState(900);

  useEffect(() => {
    const target = ZONE_POS[location];
    const prev = posRef.current;
    if (prev.x === target.x && prev.y === target.y) return;

    // 거리에 비례해 걷는 시간을 정한다. (가까우면 빨리, 멀면 오래)
    const distance = Math.hypot(target.x - prev.x, target.y - prev.y);
    const ms = Math.min(2200, Math.max(550, Math.round(distance * 26)));

    posRef.current = target;
    setDurationMs(ms);
    if (target.x !== prev.x) setFacing(target.x < prev.x ? "left" : "right");
    setWalking(true);
    setPos(target);

    const timer = window.setTimeout(() => setWalking(false), ms);
    return () => window.clearTimeout(timer);
  }, [location]);

  const shownActivity: CharacterActivity = walking
    ? activity === "leaving"
      ? "leaving"
      : "walking"
    : activity;

  return (
    <div
      className="relative h-[380px] overflow-hidden rounded-3xl border-4 border-amber-200 shadow-lg"
      style={{
        background:
          "repeating-linear-gradient(0deg,#f7ecdb 0 34px,#f4e7d3 34px 68px)," +
          "repeating-linear-gradient(90deg,#f7ecdb 0 34px,#f4e7d3 34px 68px)",
      }}
    >
      {/* ─── 위쪽 방 세 칸 ─── */}
      {/* 회의실 */}
      <div className="absolute left-[2.5%] top-[5%] h-[32%] w-[29%] rounded-xl border-2 border-[#c3d2e8] bg-[#e8eef7]">
        <RoomLabel>🤝 {ZONE_NAME.meeting}</RoomLabel>
        <div className="absolute left-1/2 top-2 h-3 w-[55%] -translate-x-1/2 rounded-sm bg-white ring-1 ring-[#c3d2e8]" />
        <div className="absolute left-1/2 top-1/2 h-[26%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#cbd9ec] ring-2 ring-[#aabfdc]" />
        {["left-[18%] top-[42%]", "left-[18%] top-[64%]", "right-[18%] top-[42%]", "right-[18%] top-[64%]"].map(
          (p) => (
            <div key={p} className={`absolute ${p} h-2.5 w-2.5 rounded-full bg-[#8aa2c4]`} />
          )
        )}
      </div>

      {/* 휴게실 */}
      <div className="absolute left-[35.5%] top-[5%] h-[32%] w-[29%] rounded-xl border-2 border-[#f4d3d9] bg-[#fdeef0]">
        <RoomLabel>☕ {ZONE_NAME.break_room}</RoomLabel>
        <div className="absolute left-[14%] top-[26%] h-[16%] w-[44%] rounded-t-lg bg-[#efa9b4]" />
        <div className="absolute left-[14%] top-[40%] h-[22%] w-[44%] rounded-lg bg-[#f6bcc5] ring-2 ring-[#e79aa7]" />
        <div className="absolute right-[16%] top-[46%] h-7 w-7 rounded-full bg-[#e8d5c0] ring-2 ring-[#d4bda4]" />
        <Plant className="bottom-[8%] left-[10%]" />
      </div>

      {/* 자료실 */}
      <div className="absolute left-[68.5%] top-[5%] h-[32%] w-[29%] rounded-xl border-2 border-[#dcd0f0] bg-[#f1ecfa]">
        <RoomLabel>📚 {ZONE_NAME.storage}</RoomLabel>
        {["top-[26%]", "top-[54%]"].map((top) => (
          <div
            key={top}
            className={`absolute ${top} left-1/2 flex h-[20%] w-[66%] -translate-x-1/2 items-end gap-[3px] rounded-sm bg-[#d8c7ae] px-1 pb-0.5 ring-2 ring-[#bfa98c]`}
          >
            {["#e88f8f", "#8fb7e8", "#efc97a", "#9ed8a6", "#c39ee0", "#e88f8f", "#8fb7e8"].map((c, i) => (
              <div key={i} className="flex-1 rounded-[1px]" style={{ height: `${62 + (i % 3) * 13}%`, background: c }} />
            ))}
          </div>
        ))}
      </div>

      {/* ─── 아래쪽 열린 공간 ─── */}
      {/* 내 자리 */}
      <div className="absolute left-[36%] top-[74%] h-[16%] w-[28%]">
        <div className="absolute inset-x-0 top-0 h-[55%] rounded-md bg-[#dfc09a] ring-2 ring-[#c3a077]" />
        <div className="absolute left-1/2 top-[-34%] h-[42%] w-[36%] -translate-x-1/2 rounded-sm bg-[#4a5568] p-[3px]">
          <div className="h-full w-full rounded-[2px] bg-[#8fc4e8]" />
        </div>
        <div className="absolute left-1/2 top-[58%] h-[14%] w-[46%] -translate-x-1/2 rounded-[2px] bg-[#cbb494]" />
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-gray-600 shadow-sm ring-1 ring-black/5">
          🪑 {ZONE_NAME.desk}
        </span>
      </div>

      {/* 출입구 */}
      <div className="absolute bottom-[4%] left-[3%] w-[18%]">
        <div className="relative mx-auto h-16 w-14 rounded-t-lg bg-[#d9c3a8] ring-2 ring-[#b99d7e]">
          <div className="absolute inset-x-1.5 top-1.5 bottom-1.5 rounded-sm bg-[#c9ae8e]" />
          <div className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#8a7358]" />
        </div>
        <div className="mx-auto mt-1 h-2 w-16 rounded-full bg-[#e3d4c1]" />
        <span className="mt-1 block whitespace-nowrap text-center text-[11px] font-bold text-gray-600">
          🚪 {ZONE_NAME.entrance}
        </span>
      </div>

      <SideDesk className="left-[10%] top-[60%] w-[14%]" />
      <SideDesk className="right-[10%] top-[60%] w-[14%]" />

      <Plant className="bottom-[8%] right-[7%]" />
      <Plant className="bottom-[8%] right-[15%]" />

      {/* ─── 캐릭터 ─── */}
      <div
        className="absolute z-20 flex flex-col items-center"
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: "translate(-50%, -100%)",
          transition: `left ${durationMs}ms ease-in-out, top ${durationMs}ms ease-in-out`,
        }}
      >
        {showBubble ? (
          <div className="mb-1.5 max-w-[240px] rounded-2xl border-2 border-purple-200 bg-white px-3 py-1.5 text-center text-xs font-semibold text-gray-800 shadow-md">
            {message}
          </div>
        ) : (
          <span className="mb-1.5 whitespace-nowrap rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-gray-700 shadow ring-1 ring-black/5">
            {ZONE_NAME[location]}
          </span>
        )}
        <OfficeCharacter activity={shownActivity} facing={facing} height={88} />
      </div>
    </div>
  );
}
