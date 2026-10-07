/**
 * 점심시간 — 근무 시간에서 빼고, 그 시간 동안은 상태를 "점심시간"으로 보여준다.
 * 시각은 "HH:mm"(24시간제), 브라우저 현지 시각(한국 표준시) 기준이다.
 * 설정 값은 profiles.lunch_start / lunch_end (0008 마이그레이션). null 이면 점심시간을 쓰지 않는다.
 */

export interface Lunch {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export const DEFAULT_LUNCH: Lunch = { start: "12:00", end: "13:00" };

// 근무 기록 화면(history)은 여러 화면에서 따로 계산하므로, 불러온 설정을 여기 한 곳에 둔다.
let activeLunch: Lunch | null = DEFAULT_LUNCH;
export const setActiveLunch = (lunch: Lunch | null) => {
  activeLunch = lunch;
};
export const getActiveLunch = () => activeLunch;

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const atLocal = (day: Date, hhmm: string) => {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutesOf(hhmm));
  return d.getTime();
};

/** [from, to] 구간이 점심시간과 겹치는 초. 여러 날에 걸친 구간도 날마다 계산한다. */
export function lunchOverlapSeconds(from: number, to: number, lunch: Lunch | null): number {
  if (!lunch || to <= from) return 0;
  let total = 0;
  const day = new Date(from);
  day.setHours(0, 0, 0, 0);
  while (day.getTime() <= to) {
    const s = Math.max(from, atLocal(day, lunch.start));
    const e = Math.min(to, atLocal(day, lunch.end));
    if (e > s) total += e - s;
    day.setDate(day.getDate() + 1);
  }
  return Math.floor(total / 1000);
}

/** 출근 ~ to 사이 근무 시간(초) — 점심시간을 뺀다. */
export function workSecondsBetween(checkInIso: string, to: number, lunch: Lunch | null): number {
  const from = new Date(checkInIso).getTime();
  const raw = Math.max(0, Math.floor((to - from) / 1000));
  return Math.max(0, raw - lunchOverlapSeconds(from, to, lunch));
}

/** 지금이 점심시간인지 */
export function isLunchTime(now: Date, lunch: Lunch | null): boolean {
  if (!lunch) return false;
  const t = now.getTime();
  return t >= atLocal(now, lunch.start) && t < atLocal(now, lunch.end);
}
