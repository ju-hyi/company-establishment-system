-- company-establishment-system : 초기 스키마 + RLS
-- 통계는 원본 기록(work_sessions / tasks / activities)에서 계산하므로 집계 테이블을 두지 않는다.

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  name        text not null default '사용자',
  level       integer not null default 1,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 회원가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- work_sessions : 출퇴근
-- ─────────────────────────────────────────────
create table if not exists public.work_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  work_date         date not null default (now() at time zone 'Asia/Seoul')::date,
  check_in_at       timestamptz not null default now(),
  check_out_at      timestamptz,
  duration_seconds  integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 하루에 진행 중인 세션은 하나만 허용
create unique index if not exists work_sessions_open_per_day
  on public.work_sessions (user_id, work_date)
  where check_out_at is null;

-- ─────────────────────────────────────────────
-- tasks : 업무
-- ─────────────────────────────────────────────
create table if not exists public.tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  description       text,
  status            text not null default 'pending'
                    check (status in ('pending', 'in_progress', 'completed', 'on_hold')),
  priority          text not null default 'normal'
                    check (priority in ('low', 'normal', 'high', 'urgent')),
  task_date         date not null default (now() at time zone 'Asia/Seoul')::date,
  due_date          date,
  estimated_minutes integer,
  started_at        timestamptz,
  completed_at      timestamptz,
  duration_seconds  integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- activities : 공부 / 운동 / 휴식 / 개인일
-- ─────────────────────────────────────────────
create table if not exists public.activities (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  type              text not null
                    check (type in ('study', 'exercise', 'break', 'personal')),
  activity_date     date not null default (now() at time zone 'Asia/Seoul')::date,
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  duration_seconds  integer,
  description       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- schedules : 캘린더 일정
-- ─────────────────────────────────────────────
create table if not exists public.schedules (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  category       text not null default 'work'
                 check (category in ('work', 'personal', 'study', 'exercise', 'etc')),
  schedule_date  date not null,
  start_time     time,
  end_time       time,
  memo           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 인덱스
-- ─────────────────────────────────────────────
create index if not exists idx_work_sessions_user_date on public.work_sessions (user_id, work_date desc);
create index if not exists idx_tasks_user_date         on public.tasks (user_id, task_date desc);
create index if not exists idx_tasks_user_status       on public.tasks (user_id, status);
create index if not exists idx_activities_user_date    on public.activities (user_id, activity_date desc);
create index if not exists idx_schedules_user_date     on public.schedules (user_id, schedule_date);

-- ─────────────────────────────────────────────
-- updated_at 자동 갱신
-- ─────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'work_sessions', 'tasks', 'activities', 'schedules']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at()', t);
  end loop;
end;
$$;

-- ─────────────────────────────────────────────
-- Row Level Security : 본인 데이터만 접근
-- ─────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.work_sessions enable row level security;
alter table public.tasks         enable row level security;
alter table public.activities    enable row level security;
alter table public.schedules     enable row level security;

-- profiles : 본인 행만 (id = auth.uid())
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 나머지 테이블 : user_id = auth.uid()
do $$
declare t text;
begin
  foreach t in array array['work_sessions', 'tasks', 'activities', 'schedules']
  loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$s', t);
    execute format(
      'create policy "%1$s_select_own" on public.%1$s
       for select using (auth.uid() = user_id)', t);

    execute format('drop policy if exists "%1$s_insert_own" on public.%1$s', t);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$s
       for insert with check (auth.uid() = user_id)', t);

    execute format('drop policy if exists "%1$s_update_own" on public.%1$s', t);
    execute format(
      'create policy "%1$s_update_own" on public.%1$s
       for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);

    execute format('drop policy if exists "%1$s_delete_own" on public.%1$s', t);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$s
       for delete using (auth.uid() = user_id)', t);
  end loop;
end;
$$;
