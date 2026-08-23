# 🏢 MY LIFE OFFICE — company-establishment-system

귀여운 2D 게임형 **LIVE OFFICE** 컨셉의 개인용 업무·공부·생활 관리 대시보드.
캐릭터가 사무실 안을 이동하며 현재 활동 상태를 보여주고, 출퇴근·업무·개인 활동 시간은
Supabase에 실제 기록으로 저장된다.

**Production:** https://company-establishment-system.vercel.app

---

## 주요 기능

| 영역 | 기능 |
|---|---|
| LIVE OFFICE | 캐릭터 이동, 말풍선, 위치/활동 표시, 시간 표시 |
| 출퇴근 | 출근/퇴근 기록, 실시간 근무시간, 새로고침 후 복구 |
| 업무 | 추가 / 시작 / 완료 / 되돌리기 / 삭제, 업무별 타이머, 실제 소요시간 저장 |
| 개인 활동 | 공부·운동·휴식·개인일 시작/종료, 활동별 시간 기록 |
| 통계 | 주간 근무시간, 업무 완료율, 공부·운동 시간 (원본 기록에서 계산) |
| 인증 | 아이디 + 비밀번호 로그인 / 회원가입 / 세션 유지 (이메일·인증메일 없음) |

---

## 기술 스택

- React 19 + TypeScript + Vite
- Supabase (PostgreSQL, Auth, Row Level Security)
- Tailwind CSS (CDN), lucide-react, date-fns
- GitHub + Vercel

---

## 설치 및 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # Production 빌드
npm run preview  # 빌드 결과 미리보기
```

## 환경변수

`.env.example`을 복사해 `.env.local`을 만들고 값을 채운다.

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

> ⚠️ **Secret key는 절대 `VITE_` 변수나 브라우저 코드에 넣지 않는다.**
> `.env.local`은 `.gitignore`에 포함되어 있으며 커밋되지 않는다.

---

## Supabase 설정

1. Supabase에서 새 프로젝트 생성 (Region: Northeast Asia — Seoul)
2. **SQL Editor**에서 [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) →
   [`supabase/migrations/0002_username_auth.sql`](supabase/migrations/0002_username_auth.sql) 순서로 실행
3. **Settings → API Keys**의 Publishable key를 `.env.local`에 등록

### DB 구조

| 테이블 | 용도 | 주요 컬럼 |
|---|---|---|
| `profiles` | 사용자 프로필 | `id`(auth.users FK), `username`(UNIQUE), `name`, `level` |
| `work_sessions` | 출퇴근 | `work_date`, `check_in_at`, `check_out_at`, `duration_seconds` |
| `tasks` | 업무 | `title`, `status`, `priority`, `started_at`, `completed_at`, `duration_seconds` |
| `activities` | 개인 활동 | `type`(study/exercise/break/personal), `started_at`, `ended_at`, `duration_seconds` |
| `schedules` | 캘린더 일정 | `title`, `category`, `schedule_date`, `start_time`, `end_time` |

설계 원칙:

- 통계는 **원본 기록에서 계산**한다. 집계 전용 테이블을 두지 않아 중복 데이터가 생기지 않는다.
- 시각은 `timestamptz`, 날짜 구분은 `Asia/Seoul` 기준 `date` 컬럼으로 저장한다.
- 회원가입 시 `handle_new_user()` 트리거가 `profiles` 행을 자동 생성한다.
- 로그인은 아이디만 입력받는다. Supabase Auth가 요구하는 내부 식별자는 `src/lib/auth.ts`
  안에서만 만들어 쓰고 화면에 노출하지 않으며, 기존 계정은 `auth_email_for_username()`
  으로 매핑해 `auth.users.id`(= 모든 데이터의 `user_id`)를 그대로 유지한다.
- 하루에 진행 중인 근무 세션은 부분 유니크 인덱스로 하나만 허용한다.

### RLS

모든 테이블에 Row Level Security가 활성화되어 있고, 본인 데이터만 접근 가능하다.

- `profiles` → `auth.uid() = id`
- 그 외 테이블 → `auth.uid() = user_id` (select / insert / update / delete)

검증 결과 (미인증 요청):

```
SELECT tasks    → []                          # 타인 데이터 노출 없음
INSERT tasks    → 42501 row-level security    # 쓰기 거부
```

프론트엔드에서 숨기는 방식이 아니라 **DB 레벨에서 차단**한다.

---

## 폴더 구조

```
src/
├── components/     Header, LeftSidebar, MainContent(LIVE OFFICE), RightSidebar
├── pages/          LoginPage, MainDashboard
├── hooks/          useAuth, useTasks, useWorkSession, useActivities, useStats
├── services/       tasks, workSessions, activities  (Supabase 접근 계층)
├── lib/            supabase.ts (클라이언트), auth.ts (아이디 인증)
├── utils/          helpers.ts (날짜·시간 포맷)
└── types.ts        DB 스키마와 1:1 대응하는 타입
supabase/
└── migrations/     0001_init.sql, 0002_username_auth.sql
```

데이터 흐름: **UI → hooks → services → Supabase → PostgreSQL(RLS)**
컴포넌트에서 Supabase를 직접 호출하지 않는다.

---

## 배포

- **GitHub:** https://github.com/ju-hyi/company-establishment-system (`main`)
- **Vercel:** `company-establishment-system` / Framework: Vite / Build: `npm run build` / Output: `dist`
- Vercel 환경변수에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를
  Production / Preview / Development 모두 등록

### 자동 배포

`main` 브랜치에 push하면 Vercel이 자동으로 Production 배포를 생성한다.

```
git push origin main   →   Vercel Production 배포
```

Production Branch는 `main`으로 설정되어 있으며, 수동 배포가 필요한 경우에만
`vercel deploy --prod`를 사용한다.

---

## 향후 개선사항

- 캘린더 화면 구현 (`schedules` 테이블은 이미 준비됨)
- 기록/통계 전용 페이지 — 일간·주간·월간 보기와 그래프
- 캐릭터 랜덤 행동 및 시간대(아침/점심/저녁/밤) 연출
- 주말 모드 — 개인 활동 중심 화면
- 업무 우선순위·마감일 UI 노출
- 활동 종류 사용자 정의 추가
