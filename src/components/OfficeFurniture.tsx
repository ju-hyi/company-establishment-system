/**
 * LIVE OFFICE 맵의 가구 — ZEP / 게더타운 맵처럼 납작한 단색 도형만 쓴다.
 * 그림자도, 윗면·앞면 구분도 없다. 책상 · 의자 · 노트북이 기본이고 그 외는 최소한만 둔다.
 */

interface At {
  x: number;
  y: number;
}

const DESK = "#e9cfa6";
const DESK_LINE = "#d8b684";
const CHAIR = "#b9c2d0";
const LAPTOP = "#8e99ab";
const SCREEN = "#dcecf7";

/** 1인 책상 + 노트북. 캐릭터는 (x + w/2, y + 6) 에 앉힌다. */
export function Desk({ x, y, w = 76 }: At & { w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={30} rx={7} fill={DESK} stroke={DESK_LINE} strokeWidth={2} />
      <rect x={x + w / 2 - 15} y={y + 7} width={30} height={16} rx={2.5} fill={LAPTOP} />
      <rect x={x + w / 2 - 11} y={y + 10} width={22} height={11} rx={1.5} fill={SCREEN} />
    </g>
  );
}

/** 의자 — 캐릭터 뒤에 깔린다 */
export function Chair({ x, y }: At) {
  return <rect x={x} y={y} width={26} height={22} rx={7} fill={CHAIR} />;
}

/** 회의 테이블 */
export function MeetingTable({ x, y, w = 200, h = 62 }: At & { w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill="#dcd2ef" stroke="#c6b9e2" strokeWidth={2} />
      <rect x={x + w / 2 - 26} y={y + h / 2 - 9} width={52} height={18} rx={4} fill="#efe9fa" />
    </g>
  );
}

/** 소파 */
export function Sofa({ x, y, w = 120 }: At & { w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={44} rx={12} fill="#f4a9bd" />
      <rect x={x + 8} y={y + 16} width={w - 16} height={24} rx={9} fill="#f9c6d4" />
    </g>
  );
}

/** 둥근 탁자 */
export function RoundTable({ x, y, r = 22 }: At & { r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={DESK} stroke={DESK_LINE} strokeWidth={2} />
      <circle cx={x} cy={y} r={r - 9} fill="#f3e2c8" />
    </g>
  );
}

/** 책장 */
export function Bookshelf({ x, y, w = 120 }: At & { w?: number }) {
  const books = ["#e08b91", "#88b0e2", "#efc576", "#94d0a0", "#bd95dc", "#7fc3d4"];
  const bw = (w - 14) / books.length - 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={34} rx={5} fill="#d9b78c" stroke="#c39a6a" strokeWidth={2} />
      {books.map((c, i) => (
        <rect key={i} x={x + 7 + i * (bw + 2)} y={y + 7} width={bw} height={20} rx={1.5} fill={c} />
      ))}
    </g>
  );
}

/** 창고 선반 */
export function Shelf({ x, y, w = 110 }: At & { w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={52} rx={5} fill="#cfd6e0" stroke="#b6bfcc" strokeWidth={2} />
      <rect x={x + 6} y={y + 24} width={w - 12} height={3} fill="#b6bfcc" />
      <rect x={x + 9} y={y + 6} width={26} height={16} rx={2} fill="#e0b47f" />
      <rect x={x + 41} y={y + 8} width={22} height={14} rx={2} fill="#9ed3b0" />
      <rect x={x + 69} y={y + 6} width={26} height={16} rx={2} fill="#8fb7e8" />
      <rect x={x + 12} y={y + 30} width={34} height={16} rx={2} fill="#f0a6bd" />
      <rect x={x + 54} y={y + 30} width={40} height={16} rx={2} fill="#e0b47f" />
    </g>
  );
}

/** 박스 더미 */
export function Boxes({ x, y }: At) {
  return (
    <g>
      <rect x={x} y={y + 22} width={34} height={30} rx={3} fill="#e6bd8b" stroke="#c9975f" strokeWidth={2} />
      <rect x={x + 38} y={y + 16} width={38} height={36} rx={3} fill="#e6bd8b" stroke="#c9975f" strokeWidth={2} />
      <rect x={x + 8} y={y} width={32} height={24} rx={3} fill="#efd0a8" stroke="#c9975f" strokeWidth={2} />
    </g>
  );
}

/** 출입문 */
export function Door({ x, y, w = 96 }: At & { w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={26} rx={6} fill="#d9b78c" stroke="#c39a6a" strokeWidth={2} />
      <rect x={x + 6} y={y + 6} width={w / 2 - 9} height={14} rx={3} fill="#eed7b6" />
      <rect x={x + w / 2 + 3} y={y + 6} width={w / 2 - 9} height={14} rx={3} fill="#eed7b6" />
    </g>
  );
}

/** 바닥 매트 */
export function Mat({ x, y, w = 80, h = 34 }: At & { w?: number; h?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={8} fill="#f0dcc2" />;
}

/** 화분 — 레퍼런스처럼 초록 동그라미 하나면 충분하다 */
export function Plant({ x, y, r = 11 }: At & { r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#8ac79a" />
      <circle cx={x} cy={y} r={r - 4} fill="#a3d6ad" />
    </g>
  );
}
