-- company-establishment-system : 아이디(username) + 비밀번호 로그인 전환
--
-- 기존 계정 / 기존 데이터 / RLS 는 그대로 두고 username 매핑만 추가한다.
--   · auth.users        건드리지 않는다 (user_id 그대로)
--   · profiles          username 컬럼만 추가 (기존 행 삭제/변경 없음)
--   · tasks / work_sessions / activities / schedules  전혀 건드리지 않는다
--   · RLS 정책          변경하지 않는다
--
-- 여러 번 실행해도 안전하다(idempotent).

-- ─────────────────────────────────────────────
-- 1) profiles.username 컬럼 추가
-- ─────────────────────────────────────────────
alter table public.profiles add column if not exists username text;

-- ─────────────────────────────────────────────
-- 2) 기존 계정 backfill : 기존 이메일의 앞부분을 아이디로 사용
--    예) kim@naver.com 으로 가입했던 계정 → 아이디 "kim"
--    중복이 생기면 뒤에 번호를 붙여, 기존 행을 하나도 잃지 않는다.
-- ─────────────────────────────────────────────
do $$
declare
  r         record;
  base      text;
  candidate text;
  n         integer;
begin
  for r in
    select id, email
    from public.profiles
    where username is null or btrim(username) = ''
    order by created_at, id
  loop
    base := regexp_replace(lower(split_part(r.email, '@', 1)), '[^a-z0-9._-]', '', 'g');
    if base = '' then
      base := 'user';
    end if;

    candidate := base;
    n := 1;
    while exists (
      select 1 from public.profiles
      where lower(username) = candidate and id <> r.id
    ) loop
      n := n + 1;
      candidate := base || n::text;
    end loop;

    update public.profiles set username = candidate where id = r.id;
  end loop;
end;
$$;

-- ─────────────────────────────────────────────
-- 3) 아이디 중복 금지 (대소문자 구분 없이)
-- ─────────────────────────────────────────────
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username));

do $$
begin
  if not exists (select 1 from public.profiles where username is null) then
    alter table public.profiles alter column username set not null;
  end if;
end;
$$;

-- ─────────────────────────────────────────────
-- 4) 회원가입 트리거 : 가입할 때 받은 아이디를 profiles 에 저장
--    (기존 트리거 on_auth_user_created 를 그대로 쓰고 함수 본문만 갱신한다)
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_name     text;
begin
  v_username := lower(btrim(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1)
  )));

  v_name := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), v_username);

  insert into public.profiles (id, email, name, username)
  values (new.id, new.email, v_name, v_username)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- 5) 아이디 → 내부 인증 식별자 조회
--    로그인 화면에서 아이디만 받아 기존 계정까지 찾아내기 위한 함수.
--    profiles 전체를 열어주지 않고, 정확히 일치하는 아이디 하나만 응답한다.
-- ─────────────────────────────────────────────
create or replace function public.auth_email_for_username(p_username text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select p.email
  from public.profiles p
  where lower(p.username) = lower(btrim(p_username))
  limit 1;
$$;

revoke all on function public.auth_email_for_username(text) from public;
grant execute on function public.auth_email_for_username(text) to anon, authenticated;

-- ─────────────────────────────────────────────
-- 6) 확인용 : 실행 후 결과가 화면에 표시된다
-- ─────────────────────────────────────────────
select
  (select count(*) from public.profiles)      as profiles,
  (select count(*) from public.tasks)         as tasks,
  (select count(*) from public.work_sessions) as work_sessions,
  (select count(*) from public.activities)    as activities,
  (select count(*) from public.schedules)     as schedules;
