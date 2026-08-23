export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  level: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface WorkLog {
  id: string;
  user_id: string;
  log_type: string;
  description?: string;
  duration_minutes: number;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  status: "working" | "break" | "away" | "offline";
  last_location?: string;
  arrival_time?: string;
  created_at: string;
}

export interface WorkSession {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string;
  check_out_time?: string;
  duration_minutes?: number;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: "work" | "study" | "exercise" | "break" | "personal";
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
  created_at: string;
}

export interface CharacterState {
  location: "entrance" | "desk" | "meeting" | "break_room" | "storage" | "outside";
  activity: "idle" | "walking" | "working" | "studying" | "exercising" | "resting" | "leaving";
  message: string;
  messageEndTime?: number;
}
