-- company-establishment-system : 관리자 회원 관리 (회원 목록 · 기록 삭제 · 계정 삭제)
--
-- 기존 테이블 / 기존 행 / RLS 정책은 바꾸지 않는다.
--   · app_admins      관리자 목록. RLS 를 켜고 정책을 두지 않아 브라우저에서 직접 읽거나 쓸 수 없다.
--   · admin_* 함수     security definer — 호출한 사람이 관리자인지 함수 안에서 확인한 뒤에만 동작한다.
--
-- 계정 삭제는 auth.users 행을 지운다. profiles 가 auth.users 에 on delete cascade 로,
-- work_sessions / tasks / activities / schedules 가 profiles 에 on delete cascade 로 묶여 있어
-- 그 계정의 모든 기록이 함께 삭제된다. 되돌릴 수 없다.
--
-- 여러 번 실행해도 안전하다(idempotent).

-- ─────────────────────────────────────────────
-- 1) 관리자 목록
-- ─────────────────────────────────────────────
create table if not exists public.app_admins (
  user_id     uuid primary key references auth.users on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.app_admins enable row level security;
-- 정책을 만들지 않는다 → anon / authenticated 는 이 테이블에 접근할 수 없다.

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

-- ─────────────────────────────────────────────
-- 2) 첫 관리자 등록 — 관리자가 한 명도 없을 때만 동작한다.
--    (배포 직후 설정 화면에서 본인이 한 번 누르면 이후로는 잠긴다)
-- ─────────────────────────────────────────────
create or replace function public.admin_claim_first()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  -- 동시에 두 명이 누르는 경우를 막는다
  lock table public.app_admins in exclusive mode;
  if exists (select 1 from public.app_admins) then
    return false;
  end if;
  insert into public.app_admins (user_id) values (auth.uid());
  return true;
end;
$$;

create or replace function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_admins);
$$;

-- ─────────────────────────────────────────────
-- 3) 회원 목록 (관리자만)
-- ─────────────────────────────────────────────
create or replace function public.admin_list_users()
returns table (
  id            uuid,
  username      text,
  name          text,
  created_at    timestamptz,
  task_count    bigint,
  session_count bigint,
  is_admin      boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'admin only';
  end if;

  return query
    select
      p.id,
      p.username,
      p.name,
      p.created_at,
      (select count(*) from public.tasks t where t.user_id = p.id),
      (select count(*) from public.work_sessions w where w.user_id = p.id),
      exists (select 1 from public.app_admins a where a.user_id = p.id)
    from public.profiles p
    order by p.created_at;
end;
$$;

-- ─────────────────────────────────────────────
-- 4) 기록만 삭제 (계정은 남긴다) — 관리자만
--    업무 · 출퇴근 · 활동 · 일정 · 오늘의 한마디 · 캐릭터 설정을 지운다.
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

  delete from public.tasks         where user_id = p_user_id;
  delete from public.work_sessions where user_id = p_user_id;
  delete from public.activities    where user_id = p_user_id;
  delete from public.schedules     where user_id = p_user_id;
  update public.profiles
     set daily_message = null, office_characters = '{}'::jsonb
   where id = p_user_id;
end;
$$;

-- ─────────────────────────────────────────────
-- 5) 계정 삭제 (아이디 + 모든 기록) — 관리자만, 자기 자신은 지울 수 없다
-- ─────────────────────────────────────────────
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_app_admin() then
    raise exception 'admin only';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot delete yourself';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

-- ─────────────────────────────────────────────
-- 6) 실행 권한 — 로그인한 사용자만 호출 가능 (관리자 여부는 함수 안에서 검사)
-- ─────────────────────────────────────────────
revoke all on function public.is_app_admin()                from public, anon;
revoke all on function public.admin_claim_first()           from public, anon;
revoke all on function public.admin_exists()                from public, anon;
revoke all on function public.admin_list_users()            from public, anon;
revoke all on function public.admin_clear_user_data(uuid)   from public, anon;
revoke all on function public.admin_delete_user(uuid)       from public, anon;

grant execute on function public.is_app_admin()              to authenticated;
grant execute on function public.admin_claim_first()         to authenticated;
grant execute on function public.admin_exists()              to authenticated;
grant execute on function public.admin_list_users()          to authenticated;
grant execute on function public.admin_clear_user_data(uuid) to authenticated;
grant execute on function public.admin_delete_user(uuid)     to authenticated;

notify pgrst, 'reload schema';
