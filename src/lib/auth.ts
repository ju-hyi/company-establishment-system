import { supabase } from "./supabase";

/**
 * 아이디(username) + 비밀번호 인증.
 *
 * 사용자는 아이디만 입력한다. Supabase Auth의 password provider가 내부적으로
 * 이메일 형식의 식별자를 요구하므로 그 식별자는 이 파일 안에서만 만들어 쓰고
 * 화면 어디에도 노출하지 않는다. 인증 메일은 발송되지 않는다(Confirm email OFF).
 *
 * 기존 계정은 profiles.username → profiles.email 매핑(RPC)으로 식별자를 찾아
 * 로그인하므로 auth.users.id 와 기존 데이터의 user_id 는 그대로 유지된다.
 */

/** 내부 전용 식별자 도메인. 메일을 보내지 않으므로 실제로 수신되는 주소가 아니다. */
const INTERNAL_EMAIL_DOMAIN = "mylifeoffice.local";

/** 가입과 로그인이 항상 같은 값을 쓰도록 정규화는 이 함수 하나로만 한다. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** 회원가입에서만 검사한다. (기존 계정의 아이디까지 막지 않기 위해 로그인은 검사하지 않는다) */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{2,29}$/.test(username);
}

function internalIdentifier(username: string): string {
  return `${username}@${INTERNAL_EMAIL_DOMAIN}`;
}

/** 화면에 보여줄 메시지를 코드로 구분하기 위한 오류 타입. */
export class AuthFailure extends Error {}

interface Lookup {
  /** RPC 호출이 성공했는지. 실패하면 "아이디 없음"과 구분할 수 없다. */
  checked: boolean;
  /** 해당 아이디에 연결된 내부 식별자. 없으면 null. */
  identifier: string | null;
}

async function lookupIdentifier(username: string): Promise<Lookup> {
  const { data, error } = await supabase.rpc("auth_email_for_username", {
    p_username: username,
  });
  // 마이그레이션 전이라 함수가 없으면 규칙으로 만든 식별자를 그대로 쓴다.
  if (error) return { checked: false, identifier: null };
  return { checked: true, identifier: (data as string | null) ?? null };
}

/** 아이디가 이미 쓰이고 있으면 true. 확인할 수 없으면 false(가입을 막지 않는다). */
export async function isUsernameTaken(rawUsername: string): Promise<boolean> {
  const { checked, identifier } = await lookupIdentifier(normalizeUsername(rawUsername));
  return checked && identifier !== null;
}

export async function signInWithUsername(rawUsername: string, password: string): Promise<void> {
  const username = normalizeUsername(rawUsername);
  const { identifier } = await lookupIdentifier(username);

  const { error } = await supabase.auth.signInWithPassword({
    email: identifier ?? internalIdentifier(username),
    password,
  });
  if (error) throw error;
}

export async function signUpWithUsername(
  rawUsername: string,
  password: string,
  rawName: string
): Promise<void> {
  const username = normalizeUsername(rawUsername);
  if (await isUsernameTaken(username)) throw new AuthFailure("USERNAME_TAKEN");

  const email = internalIdentifier(username);
  const name = rawName.trim() || username;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // profiles 행을 만드는 handle_new_user() 트리거가 이 값을 읽는다.
    options: { data: { username, name } },
  });
  if (error) throw error;

  // Confirm email 이 꺼져 있으면 가입 즉시 세션이 발급된다.
  if (data.session) return;

  // 세션이 없으면 곧바로 로그인해 가입 직후 진입을 보장한다.
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
}
