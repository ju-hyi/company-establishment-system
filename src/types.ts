export type TaskStatus = "pending" | "in_progress" | "completed" | "on_hold";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type ActivityType = "study" | "exercise" | "break" | "personal";
/** 업무 구분 — 메인 화면 왼쪽의 세 블럭에 대응한다. */
export type TaskCategory = "work" | "personal" | "mx_instagram";
export type ScheduleCategory = "work" | "personal" | "study" | "exercise" | "etc";

export interface Profile {
  id: string;
  /** 로그인 아이디 */
  username: string | null;
  /** Supabase Auth 내부 식별자. 화면에 노출하지 않는다. */
  email: string;
  name: string;
  level: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkSession {
  id: string;
  user_id: string;
  work_date: string;
  check_in_at: string;
  check_out_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** 0003 마이그레이션 전 행에는 없을 수 있다 → 회사 업무로 본다 (categoryOf 사용) */
  category?: TaskCategory;
  /** 업무 날짜 = 기간의 시작일 */
  task_date: string;
  /** 기간의 종료일 (없으면 하루짜리 업무) */
  due_date: string | null;
  estimated_minutes: number | null;
  /** 가장 최근에 시작(재시작)한 시각 */
  started_at: string | null;
  completed_at: string | null;
  /**
   * 실제 업무시간(초). 진행중이면 이전 구간까지의 합이고, 지금 구간은 started_at 부터 더한다.
   * 완료되면 전체 합계.
   */
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

/** 업무 진행 기록 종류 — 시작 · 중지 · 재시작 · 완료 · 완료 취소 */
export type TaskEventType = "start" | "pause" | "resume" | "complete" | "reopen";

/**
 * 업무 진행 기록 (task_events, 0005 마이그레이션).
 * tasks 행은 지금 상태만 갖고, "그날 실제로 한 일" 은 이 기록으로 남는다.
 * 업무가 삭제되면 task_id 는 null 이 되고 업무명은 task_title 로 남는다.
 */
export interface TaskEvent {
  id: string;
  user_id: string;
  task_id: string | null;
  task_title: string;
  task_category: TaskCategory | null;
  event_type: TaskEventType;
  event_date: string;
  occurred_at: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  activity_date: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  title: string;
  category: ScheduleCategory;
  schedule_date: string;
  start_time: string | null;
  end_time: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export type CharacterLocation =
  | "entrance"
  | "desk"
  | "marketing"
  | "meeting"
  | "break_room"
  | "storage"
  | "outside";

export type CharacterActivity =
  | "idle"
  | "walking"
  | "working"
  | "studying"
  | "exercising"
  | "resting"
  | "leaving";

export interface CharacterState {
  location: CharacterLocation;
  activity: CharacterActivity;
  message: string;
  messageEndTime?: number;
}

/** 회사 맵 캐릭터에 표시하는 상태 */
export type StaffStatus = "working" | "moving" | "resting" | "meeting" | "studying" | "away";

/** 캐릭터 관리에서 바꾼 값 (profiles.office_characters) */
export type CharacterOverrides = Record<
  string,
  {
    name?: string;
    status?: StaffStatus;
    /** 캐릭터별 사항(메모) */
    note?: string;
    /** 내 캐릭터 꾸미기 (components/appearance.ts 의 옵션 id) */
    appearance?: { hair?: string; outfit?: string; point?: string; illustration?: string };
  }
>;
