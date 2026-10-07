/**
 * 시간은 화면 · 입력 · 저장 모두 24시간제 "HH:mm" 으로 다룬다.
 * DB(schedules.start_time/end_time)는 Postgres time 이라 "HH:mm:ss" 로 돌려주므로
 * 읽을 때 앞 5자리만 쓰면 되고, 쓸 때는 "HH:mm" 을 그대로 넣으면 된다.
 */

const pad = (n: number) => String(n).padStart(2, "0");

const toKey = (h: number, m: number) =>
  Number.isInteger(h) && Number.isInteger(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59
    ? `${pad(h)}:${pad(m)}`
    : null;

/**
 * 사용자가 입력한 시간을 "HH:mm" 으로 바꾼다. 해석할 수 없거나 범위를 벗어나면 null.
 * 930 · 0930 → 09:30, 9 → 09:00, 9:5 → 09:05, 13:00:00 → 13:00,
 * 오후 1:30 · 1:30 PM → 13:30 (예전 12시간제 표기 호환)
 */
export function parseTime(raw: string): string | null {
  let s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;

  let meridiem: "am" | "pm" | null = null;
  const marker = s.match(/(오전|오후|am|pm|a\.m\.|p\.m\.)/);
  if (marker) {
    meridiem = marker[1] === "오전" || marker[1].startsWith("a") ? "am" : "pm";
    s = s.replace(marker[1], "").trim();
  }

  let h: number;
  let m: number;
  const colon = s.match(/^(\d{1,2})[:시.]\s*(\d{1,2})?(?:분)?(?::\d{1,2}(?:\.\d+)?)?$/);
  if (colon) {
    h = Number(colon[1]);
    m = colon[2] === undefined ? 0 : Number(colon[2]);
  } else if (/^\d{1,4}$/.test(s)) {
    // 숫자만: 1~2자리는 시, 3~4자리는 앞이 시 · 뒤 2자리가 분
    if (s.length <= 2) {
      h = Number(s);
      m = 0;
    } else {
      h = Number(s.slice(0, -2));
      m = Number(s.slice(-2));
    }
  } else {
    return null;
  }

  if (meridiem) {
    if (h < 1 || h > 12) return null;
    if (meridiem === "am" && h === 12) h = 0;
    if (meridiem === "pm" && h !== 12) h += 12;
  }
  return toKey(h, m);
}

/** DB 값("HH:mm:ss" 등)을 화면용 "HH:mm" 으로. 해석이 안 되면 원래 값을 그대로 보여준다. */
export const displayTime = (value: string | null | undefined) =>
  value ? (parseTime(value) ?? value) : "";

/** 입력 중인 값 — 숫자와 콜론만 남기고, 숫자 4자리를 넘지 않게 자른다. */
export function sanitizeTimeTyping(raw: string): string {
  const cleaned = raw.replace(/[^\d:]/g, "");
  const [head, ...rest] = cleaned.split(":");
  if (rest.length === 0) return head.slice(0, 4);
  return `${head.slice(0, 2)}:${rest.join("").slice(0, 2)}`;
}
