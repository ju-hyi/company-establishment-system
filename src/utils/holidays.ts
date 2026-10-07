/**
 * 대한민국 공휴일 (「공휴일에 관한 법률」 · 「관공서의 공휴일에 관한 규정」 기준).
 *
 * 날짜가 매년 같은 공휴일과 대체공휴일은 규칙으로 계산하고,
 * 해마다 정부 발표로 정해지는 것(음력 명절의 양력 날짜 · 선거일 · 임시공휴일)만 아래 YEARLY 에 적는다.
 * 새 해를 지원하려면 우주항공청 월력요항(매년 6월 발표)을 보고 YEARLY 에 한 줄만 추가하면 된다.
 * YEARLY 에 없는 해는 음력 공휴일을 알 수 없으므로 아무것도 표시하지 않는다(틀린 정보를 보여주지 않기 위해).
 */

export interface Holiday {
  date: string; // yyyy-MM-dd
  name: string;
  substitute?: boolean;
}

interface YearData {
  /** 설날 당일 · 부처님오신날 · 추석 당일 (양력) */
  seollal: string;
  buddha: string;
  chuseok: string;
  /** 선거일 · 임시공휴일 등 그 해에만 지정된 공휴일 (대체공휴일 없음) */
  extra?: { date: string; name: string }[];
}

// 출처: 우주항공청 · 한국천문연구원 월력요항, 인사혁신처 발표
const YEARLY: Record<number, YearData> = {
  2025: {
    seollal: "2025-01-29",
    buddha: "2025-05-05",
    chuseok: "2025-10-06",
    extra: [
      { date: "2025-01-27", name: "임시공휴일" },
      { date: "2025-06-03", name: "대통령선거" },
    ],
  },
  2026: {
    seollal: "2026-02-17",
    buddha: "2026-05-24",
    chuseok: "2026-09-25",
    extra: [{ date: "2026-06-03", name: "전국동시지방선거" }],
  },
  2027: {
    seollal: "2027-02-07",
    buddha: "2027-05-13",
    chuseok: "2027-09-15",
  },
};

export const HOLIDAY_YEARS = Object.keys(YEARLY).map(Number);

/**
 * 대체공휴일이 생기는 조건
 * - weekend: 토 · 일요일과 겹칠 때 (국경일 · 부처님오신날 · 성탄절)
 * - weekendOrHoliday: 토 · 일요일 또는 다른 공휴일과 겹칠 때 (어린이날 · 노동절 · 제헌절)
 * - sundayOrHoliday: 연휴 중 하루가 일요일 또는 다른 공휴일과 겹칠 때 (설날 · 추석)
 */
type SubRule = "none" | "weekend" | "weekendOrHoliday" | "sundayOrHoliday";

interface Group {
  name: string;
  dates: string[];
  rule: SubRule;
}

const FIXED: { md: string; name: string; rule: SubRule; since?: number }[] = [
  { md: "01-01", name: "신정", rule: "none" },
  { md: "03-01", name: "삼일절", rule: "weekend" },
  { md: "05-01", name: "노동절", rule: "weekendOrHoliday", since: 2026 },
  { md: "05-05", name: "어린이날", rule: "weekendOrHoliday" },
  { md: "06-06", name: "현충일", rule: "none" },
  { md: "07-17", name: "제헌절", rule: "weekendOrHoliday", since: 2026 },
  { md: "08-15", name: "광복절", rule: "weekend" },
  { md: "10-03", name: "개천절", rule: "weekend" },
  { md: "10-09", name: "한글날", rule: "weekend" },
  { md: "12-25", name: "성탄절", rule: "weekend" },
];

// 날짜 문자열 ↔ UTC 자정 Date (시간대 영향 없이 요일 · 날짜 계산)
const parse = (key: string) => new Date(`${key}T00:00:00Z`);
const toKey = (d: Date) => d.toISOString().slice(0, 10);
const shift = (key: string, days: number) => {
  const d = parse(key);
  d.setUTCDate(d.getUTCDate() + days);
  return toKey(d);
};
const dow = (key: string) => parse(key).getUTCDay();

const cache = new Map<number, Holiday[]>();

/** 해당 연도의 공휴일 목록 (날짜순). 데이터가 없는 해는 빈 배열. */
export function getHolidays(year: number): Holiday[] {
  const cached = cache.get(year);
  if (cached) return cached;

  const data = YEARLY[year];
  if (!data) return [];

  const groups: Group[] = [
    ...FIXED.filter((f) => !f.since || year >= f.since).map((f) => ({
      name: f.name,
      dates: [`${year}-${f.md}`],
      rule: f.rule,
    })),
    { name: "설날", dates: [-1, 0, 1].map((n) => shift(data.seollal, n)), rule: "sundayOrHoliday" },
    { name: "부처님오신날", dates: [data.buddha], rule: "weekend" },
    { name: "추석", dates: [-1, 0, 1].map((n) => shift(data.chuseok, n)), rule: "sundayOrHoliday" },
    ...(data.extra ?? []).map((e) => ({ name: e.name, dates: [e.date], rule: "none" as SubRule })),
  ];

  // 같은 날에 걸린 공휴일 수 — "다른 공휴일과 겹침" 판단용
  const count = new Map<string, number>();
  groups.forEach((g) => g.dates.forEach((d) => count.set(d, (count.get(d) ?? 0) + 1)));
  const overlapsOther = (d: string) => (count.get(d) ?? 0) > 1;

  const triggered = (g: Group) =>
    g.rule === "weekend"
      ? g.dates.some((d) => dow(d) === 0 || dow(d) === 6)
      : g.rule === "weekendOrHoliday"
        ? g.dates.some((d) => dow(d) === 0 || dow(d) === 6 || overlapsOther(d))
        : g.rule === "sundayOrHoliday"
          ? g.dates.some((d) => dow(d) === 0 || overlapsOther(d))
          : false;

  const taken = new Set(count.keys());
  const subs: Holiday[] = [];
  // 날짜가 빠른 공휴일부터 차례로 "다음 첫 번째 비공휴일(토 · 일 · 공휴일이 아닌 날)"을 대체공휴일로 정한다.
  [...groups]
    .sort((a, b) => a.dates[0].localeCompare(b.dates[0]))
    .filter(triggered)
    .forEach((g) => {
      let d = shift(g.dates[g.dates.length - 1], 1);
      while (dow(d) === 0 || dow(d) === 6 || taken.has(d)) d = shift(d, 1);
      taken.add(d);
      subs.push({ date: d, name: `대체공휴일(${g.name})`, substitute: true });
    });

  const list = [
    ...groups.flatMap((g) => g.dates.map((date) => ({ date, name: g.name }))),
    ...subs,
  ].sort((a, b) => a.date.localeCompare(b.date));
  cache.set(year, list);
  return list;
}

/** 날짜(yyyy-MM-dd) → 그날 공휴일 이름들. 여러 해에 걸친 달력 화면용. */
export function holidayMap(years: number[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  years.forEach((y) =>
    getHolidays(y).forEach((h) => map.set(h.date, [...(map.get(h.date) ?? []), h.name]))
  );
  return map;
}
