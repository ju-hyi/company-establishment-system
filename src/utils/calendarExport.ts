import { parseTime } from "./time";
import type { Schedule } from "../types";

/**
 * 일정을 외부 캘린더 앱으로 보내기.
 * 웹앱은 기기의 캘린더 앱에 직접 쓸 수 없으므로 표준 방식 두 가지를 쓴다.
 * - .ics 파일(iCalendar, RFC 5545): Apple 캘린더 · Outlook 등 대부분의 캘린더 앱이 열어서 추가한다.
 * - Google 캘린더 "일정 추가" 링크: 로그인한 Google 캘린더에 값이 채워진 추가 화면을 연다.
 * 시간은 한국 표준시(UTC+9, 서머타임 없음) 기준으로 UTC 로 바꿔 넣는다.
 */

const SEOUL_OFFSET_HOURS = 9;
const DEFAULT_MINUTES = 60; // 하루 일정에 끝나는 시간이 없으면 1시간짜리 일정으로 보낸다.

const pad = (n: number) => String(n).padStart(2, "0");

interface Range {
  allDay: boolean;
  /** 종일: yyyyMMdd, 시간 일정: yyyyMMddTHHmmssZ (UTC) */
  start: string;
  end: string;
}

function toUtcStamp(date: string, hhmm: string, addMinutes = 0) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d, h - SEOUL_OFFSET_HOURS, mi + addMinutes));
  return (
    `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}` +
    `T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00Z`
  );
}

const nextDay = (date: string) => {
  const [y, mo, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d + 1));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
};

/** 시작 시간은 시작일, 끝나는 시간은 종료일(없으면 시작일) 기준이다. */
function rangeOf(s: Schedule): Range {
  const lastDay = s.end_date && s.end_date > s.schedule_date ? s.end_date : s.schedule_date;
  const start = s.start_time ? parseTime(s.start_time) : null;
  if (!start) {
    return {
      allDay: true,
      start: s.schedule_date.replace(/-/g, ""),
      end: nextDay(lastDay).replace(/-/g, ""), // 종일 일정의 끝은 마지막 날 다음 날(포함 안 됨)
    };
  }
  const end = s.end_time ? parseTime(s.end_time) : null;
  const multiDay = lastDay !== s.schedule_date;
  return {
    allDay: false,
    start: toUtcStamp(s.schedule_date, start),
    end: end && (multiDay || end > start)
      ? toUtcStamp(lastDay, end)
      : multiDay
        ? toUtcStamp(nextDay(lastDay), "00:00") // 끝나는 시간이 없으면 마지막 날 하루가 끝날 때까지
        : toUtcStamp(s.schedule_date, start, DEFAULT_MINUTES),
  };
}

// RFC 5545: 텍스트의 \ ; , 줄바꿈 이스케이프
const escapeText = (v: string) =>
  v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// RFC 5545: 한 줄은 75바이트 이하 — 넘으면 줄바꿈 + 공백으로 접는다 (한글은 3바이트라 글자 단위로 자른다)
function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (out.length === 0 ? 75 : 74)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function buildIcs(s: Schedule): string {
  const r = rangeOf(s);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MY LIFE OFFICE//Calendar//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${s.id}@mylifeoffice`,
    `DTSTAMP:${stamp}`,
    r.allDay ? `DTSTART;VALUE=DATE:${r.start}` : `DTSTART:${r.start}`,
    r.allDay ? `DTEND;VALUE=DATE:${r.end}` : `DTEND:${r.end}`,
    `SUMMARY:${escapeText(s.title)}`,
    ...(s.memo ? [`DESCRIPTION:${escapeText(s.memo)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** .ics 파일을 내려받는다. 캘린더 앱이 있는 기기에서는 파일을 열면 일정 추가 화면이 뜬다. */
export function downloadIcs(s: Schedule) {
  const blob = new Blob([buildIcs(s)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${s.schedule_date}-${s.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "일정"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Google 캘린더의 "일정 추가" 화면 주소. 사용자가 그 화면에서 저장해야 실제로 추가된다. */
export function googleCalendarUrl(s: Schedule): string {
  const r = rangeOf(s);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: s.title,
    dates: `${r.start}/${r.end}`,
    ctz: "Asia/Seoul",
  });
  if (s.memo) params.set("details", s.memo);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
