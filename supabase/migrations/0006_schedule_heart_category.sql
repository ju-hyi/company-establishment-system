-- company-establishment-system : 캘린더 일정 분류에 '❤️'(heart) 추가
--
-- 기존 일정 행 / 컬럼 / RLS 정책은 바꾸지 않는다. 허용 값 목록에 'heart' 하나만 더한다.
-- 기존 분류(work, personal, study, exercise, etc)는 그대로 허용된다.
-- 여러 번 실행해도 안전하다(idempotent).

alter table public.schedules
  drop constraint if exists schedules_category_check;

alter table public.schedules
  add constraint schedules_category_check
  check (category in ('work', 'personal', 'study', 'exercise', 'etc', 'heart'));
