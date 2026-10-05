-- company-establishment-system : 업무 진행 기록(task_events) — 날짜별 업무 히스토리
--
-- 기존 테이블 / 기존 행 / 기존 컬럼 / RLS 정책은 바꾸지 않는다. 테이블 하나만 추가한다.
--   · task_events   업무 시작 · 중지 · 재시작 · 완료 · 완료 취소를 한 줄씩 쌓는다 (수정하지 않고 추가만).
--                   tasks 행은 "지금 상태", task_events 는 "그날 실제로 한 일" 을 담당한다.
--                   업무를 삭제해도 기록은 남는다 (task_id 만 비우고 업무명은 task_title 에 보존).
--
-- 기간은 기존 컬럼을 그대로 쓴다: tasks.task_date = 시작일, tasks.due_date = 종료일.
-- 중지는 기존 상태값 'on_hold' 를 그대로 쓴다.
--
-- 여러 번 실행해도 안전하다(idempotent).

-- ─────────────────────────────────────────────
-- 1) task_events
-- ─────────────────────────────────────────────
create table if not exists public.task_events (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  task_id        uuid references public.tasks(id) on delete set null,
  task_title     text not null,
  task_category  text,
  event_type     text not null
                 check (event_type in ('start', 'pause', 'resume', 'complete', 'reopen')),
  event_date     date not null default (now() at time zone 'Asia/Seoul')::date,
  occurred_at    timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index if not exists idx_task_events_user_date on public.task_events (user_id, event_date);
create index if not exists idx_task_events_task      on public.task_events (task_id);

-- ─────────────────────────────────────────────
-- 2) RLS : 본인 기록만 조회 · 추가. 기록은 고치지 않는다(update 정책 없음).
-- ─────────────────────────────────────────────
alter table public.task_events enable row level security;

drop policy if exists "task_events_select_own" on public.task_events;
create policy "task_events_select_own" on public.task_events
  for select using (auth.uid() = user_id);

drop policy if exists "task_events_insert_own" on public.task_events;
create policy "task_events_insert_own" on public.task_events
  for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 3) 관리자 "기록만 삭제" 에 업무 진행 기록도 포함 (0004 함수 본문에 한 줄 추가)
-- ─────────────────────────────────────────────
create or replace function public.admin_clear_user_data(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'admin only';
  end if;

  delete from public.task_events   where user_id = p_user_id;
  delete from public.tasks         where user_id = p_user_id;
  delete from public.work_sessions where user_id = p_user_id;
  delete from public.activities    where user_id = p_user_id;
  delete from public.schedules     where user_id = p_user_id;
  update public.profiles
     set daily_message = null, office_characters = '{}'::jsonb
   where id = p_user_id;
end;
$$;

revoke all on function public.admin_clear_user_data(uuid) from public, anon;
grant execute on function public.admin_clear_user_data(uuid) to authenticated;

notify pgrst, 'reload schema';

-- 확인용
select
  (select count(*) from public.tasks)       as tasks,
  (select count(*) from public.task_events) as task_events;
