-- company-establishment-system : 점심시간 설정
--
-- 기존 테이블 / 기존 행 / RLS 정책은 바꾸지 않는다. profiles 에 컬럼 두 개만 추가한다.
--   · profiles.lunch_start / lunch_end   점심시간 (24시간제). 둘 다 비어 있으면(null) 점심시간을 쓰지 않는다.
--                                        기존 사용자는 기본값 12:00 ~ 13:00 으로 채워진다.
-- 점심시간은 퇴근할 때 근무 시간(work_sessions.duration_seconds)에서 빠진다.
-- 이미 저장된 지난 근무 기록은 바뀌지 않는다.
-- 새 컬럼은 기존 행 단위 RLS(본인 행만)에 그대로 포함된다.
-- 여러 번 실행해도 안전하다(idempotent).

alter table public.profiles
  add column if not exists lunch_start time default '12:00',
  add column if not exists lunch_end   time default '13:00';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_lunch_check') then
    alter table public.profiles
      add constraint profiles_lunch_check
      check (
        (lunch_start is null and lunch_end is null)
        or (lunch_start is not null and lunch_end is not null and lunch_end > lunch_start)
      );
  end if;
end;
$$;
