import type { CharacterActivity } from "../types";

/**
 * LIVE OFFICE 안에서 움직이는 캐릭터.
 *
 * 도형 하나가 아니라 머리 / 몸통 / 두 팔 / 두 다리를 따로 그려서,
 * 활동에 따라 각 관절을 회전시켜 자세와 동작을 만든다.
 * 애니메이션 정의는 index.css 의 ch-* 클래스에 있다.
 */

interface OfficeCharacterProps {
  activity: CharacterActivity;
  facing: "left" | "right";
  /** 캐릭터 키(px) */
  height?: number;
}

const SKIN = "#ffdcc6";
const HAIR = "#5b4136";
const SHIRT = "#f79ec0";
const SHIRT_DARK = "#e07fa6";
const SLEEVE = "#f18ab0";
const PANTS = "#7b8ec4";
const SHOE = "#4c5b86";
const LINE = "#4a352e";

export default function OfficeCharacter({
  activity,
  facing,
  height = 88,
}: OfficeCharacterProps) {
  const walking = activity === "walking" || activity === "leaving";
  const seated = activity === "working";
  const jacks = activity === "exercising";
  const studying = activity === "studying";
  const resting = activity === "resting";
  const waving = activity === "leaving";

  // 앉으면 상체가 내려오고 다리는 짧게 보인다.
  const torsoTop = seated ? 44 : 38;
  const legTop = seated ? 72 : 64;
  const legH = seated ? 14 : 23;
  const armTop = torsoTop + 4;
  const headDy = seated ? 6 : 0;

  const bodyAnim = jacks
    ? "ch-anim-hop"
    : walking
      ? "ch-anim-bob"
      : resting
        ? "ch-anim-sway"
        : "ch-anim-idle";

  // 왼팔 / 오른팔 — 애니메이션이 없으면 고정 각도로 자세를 잡는다.
  let armLClass = "";
  let armRClass = "";
  let armLAngle = 0;
  let armRAngle = 0;

  if (walking) {
    armLClass = "ch-walk-arm-a";
    armRClass = "ch-walk-arm-b";
  } else if (jacks) {
    armLClass = "ch-jack-arm-a";
    armRClass = "ch-jack-arm-b";
  } else if (seated) {
    armLClass = "ch-type-l";
    armRClass = "ch-type-r";
  } else if (studying) {
    armLAngle = 42;
    armRAngle = -42;
  } else if (resting) {
    armLAngle = 6;
    armRAngle = -34;
  }

  if (waving) {
    // 퇴근할 땐 오른팔만 인사하고 왼팔은 계속 걷는 동작.
    armRClass = "ch-wave";
  }

  const legLClass = walking ? "ch-walk-leg-a" : jacks ? "ch-jack-leg-a" : "";
  const legRClass = walking ? "ch-walk-leg-b" : jacks ? "ch-jack-leg-b" : "";

  const rot = (angle: number) => (angle ? { transform: `rotate(${angle}deg)` } : undefined);

  return (
    <svg
      viewBox="0 0 64 100"
      height={height}
      width={(height * 64) / 100}
      style={{ overflow: "visible", transform: facing === "left" ? "scaleX(-1)" : undefined }}
      role="img"
      aria-label="내 캐릭터"
    >
      <g className={bodyAnim} style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}>
        {/* ─── 다리 ─── */}
        <g className={`ch-j ${legLClass}`}>
          <rect x={24.2} y={legTop} width={7} height={legH} rx={3.5} fill={PANTS} />
          <ellipse cx={27.7} cy={legTop + legH} rx={4.8} ry={2.9} fill={SHOE} />
        </g>
        <g className={`ch-j ${legRClass}`}>
          <rect x={32.8} y={legTop} width={7} height={legH} rx={3.5} fill={PANTS} />
          <ellipse cx={36.3} cy={legTop + legH} rx={4.8} ry={2.9} fill={SHOE} />
        </g>

        {/* ─── 몸통 ─── */}
        <rect x={17.5} y={torsoTop} width={29} height={28} rx={11} fill={SHIRT} />
        <path
          d={`M26 ${torsoTop + 1.5} Q32 ${torsoTop + 7.5} 38 ${torsoTop + 1.5}`}
          fill="none"
          stroke={SHIRT_DARK}
          strokeWidth={1.6}
          strokeLinecap="round"
        />

        {/* ─── 팔 ─── */}
        <g className={`ch-j ${armLClass}`} style={rot(armLAngle)}>
          <rect x={11.8} y={armTop} width={6.6} height={24} rx={3.3} fill={SLEEVE} />
          <circle cx={15.1} cy={armTop + 25} r={4} fill={SKIN} />
        </g>
        <g className={`ch-j ${armRClass}`} style={rot(armRAngle)}>
          <rect x={45.6} y={armTop} width={6.6} height={24} rx={3.3} fill={SLEEVE} />
          <circle cx={48.9} cy={armTop + 25} r={4} fill={SKIN} />
        </g>

        {/* ─── 소지품 ─── */}
        {studying && (
          <g>
            <rect x={19} y={58} width={26} height={17} rx={1.8} fill="#ffffff" stroke="#d8c7b4" strokeWidth={1.2} />
            <line x1={32} y1={58.6} x2={32} y2={74.4} stroke="#d8c7b4" strokeWidth={1.2} />
            <line x1={22.5} y1={63} x2={29} y2={63} stroke="#c9b6a2" strokeWidth={1} strokeLinecap="round" />
            <line x1={22.5} y1={67} x2={29} y2={67} stroke="#c9b6a2" strokeWidth={1} strokeLinecap="round" />
            <line x1={35} y1={63} x2={41.5} y2={63} stroke="#c9b6a2" strokeWidth={1} strokeLinecap="round" />
            <line x1={35} y1={67} x2={41.5} y2={67} stroke="#c9b6a2" strokeWidth={1} strokeLinecap="round" />
          </g>
        )}

        {resting && (
          <g>
            <path className="ch-steam" d="M50 50 q2.5 -3 0 -6" fill="none" stroke="#c7b8ad" strokeWidth={1.4} strokeLinecap="round" />
            <rect x={45.5} y={52} width={9} height={8} rx={1.6} fill="#ffffff" stroke="#d8c7b4" strokeWidth={1.2} />
            <path d="M54.5 54 q3 2 0 4" fill="none" stroke="#d8c7b4" strokeWidth={1.2} />
          </g>
        )}

        {/* ─── 머리 ─── */}
        <g transform={headDy ? `translate(0 ${headDy})` : undefined}>
          <ellipse cx={32} cy={22.5} rx={17} ry={16.5} fill={HAIR} />
          <ellipse cx={32} cy={25.5} rx={14.2} ry={13.8} fill={SKIN} />
          <path
            d="M18.2 23 Q20.5 9.5 32 9.5 Q43.5 9.5 45.8 23 Q39.5 15.2 32 15.2 Q24.5 15.2 18.2 23 Z"
            fill={HAIR}
          />
          <ellipse className="ch-blink ch-self" cx={26.6} cy={27} rx={2} ry={2.7} fill={LINE} />
          <ellipse className="ch-blink ch-self" cx={37.4} cy={27} rx={2} ry={2.7} fill={LINE} />
          <circle cx={27.4} cy={25.9} r={0.8} fill="#ffffff" />
          <circle cx={38.2} cy={25.9} r={0.8} fill="#ffffff" />
          <ellipse cx={21.4} cy={31} rx={3} ry={2} fill="#ff9fb0" opacity={0.6} />
          <ellipse cx={42.6} cy={31} rx={3} ry={2} fill="#ff9fb0" opacity={0.6} />
          <path
            d="M29.3 33 Q32 35.8 34.7 33"
            fill="none"
            stroke={LINE}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
