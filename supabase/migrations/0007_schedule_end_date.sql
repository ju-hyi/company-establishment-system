-- company-establishment-system : 캘린더 일정 종료일 (여행처럼 여러 날 이어지는 일정)
--
-- 기존 일정 행 / 컬럼 / RLS 정책은 바꾸지 않는다. 비어 있어도 되는 컬럼 하나만 추가한다.
--   · schedules.end_date   여러 날 일정의 마지막 날. 비어 있으면(null) 기존처럼 schedule_date 하루짜리 일정.
--                          start_time 은 시작일의 시간, end_time 은 종료일의 시간이다.
-- 기존 일정은 end_date 가 비어 있으므로 지금과 똑같이 하루 일정으로 보인다.
-- 여러 번 실행해도 안전하다(idempotent).

alter table public.schedules
  add column if not exists end_date date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'schedules_end_date_check') then
    alter table public.schedules
      add constraint schedules_end_date_check
      check (end_date is null or end_date >= schedule_date);
  end if;
end;
$$;
