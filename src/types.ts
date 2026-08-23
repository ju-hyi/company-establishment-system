export type TaskStatus = "pending" | "in_progress" | "completed" | "on_hold";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type ActivityType = "study" | "exercise" | "break" | "personal";
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
  task_date: string;
  due_date: string | null;
  estimated_minutes: number | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
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
