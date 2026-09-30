-- company-establishment-system : 업무 구분 · 오늘의 한마디 · 캐릭터 관리
--
-- 기존 테이블 / 기존 행 / RLS 정책은 그대로 두고 컬럼만 추가한다.
--   · tasks.category             기존 업무는 기본값 'work'(회사 업무)로 채워진다
--   · profiles.daily_message     오늘의 한마디 문구
--   · profiles.office_characters 회사 맵 캐릭터 이름·상태·사항 { "<캐릭터id>": { "name": "...", "status": "...", "note": "..." } }
--
-- 새 컬럼은 기존 행 단위 RLS(본인 행만)에 그대로 포함된다.
-- 여러 번 실행해도 안전하다(idempotent).

-- ─────────────────────────────────────────────
-- 1) tasks.category : 회사 업무 / 공부 및 개인 활동 / MX 인스타
-- ─────────────────────────────────────────────
alter table public.tasks
  add column if not exists category text not null default 'work';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tasks_category_check') then
    alter table public.tasks
      add constraint tasks_category_check
      check (category in ('work', 'personal', 'mx_instagram'));
  end if;
end;
$$;

create index if not exists idx_tasks_user_category on public.tasks (user_id, category);

-- ─────────────────────────────────────────────
-- 2) profiles : 오늘의 한마디 · 캐릭터 관리
-- ─────────────────────────────────────────────
alter table public.profiles add column if not exists daily_message text;
alter table public.profiles
  add column if not exists office_characters jsonb not null default '{}'::jsonb;

-- PostgREST 가 새 컬럼을 바로 인식하도록 스키마 캐시를 갱신한다.
notify pgrst, 'reload schema';
