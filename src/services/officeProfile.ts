import { supabase } from "../lib/supabase";
import { displayTime } from "../utils/time";
import { DEFAULT_LUNCH, type Lunch } from "../utils/lunch";
import type { CharacterOverrides } from "../types";

/**
 * 오늘의 한마디 · 캐릭터 관리 값 (profiles.daily_message / profiles.office_characters).
 * 0003 마이그레이션 전에는 컬럼이 없으므로 available=false 로 돌려준다.
 */

export interface OfficeProfile {
  available: boolean;
  dailyMessage: string | null;
  characters: CharacterOverrides;
}

export async function getOfficeProfile(userId: string): Promise<OfficeProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("daily_message, office_characters")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { available: false, dailyMessage: null, characters: {} };
  return {
    available: true,
    dailyMessage: data?.daily_message ?? null,
    characters: (data?.office_characters as CharacterOverrides | null) ?? {},
  };
}

export async function updateOfficeProfile(
  userId: string,
  patch: {
    daily_message?: string | null;
    office_characters?: CharacterOverrides;
  }
): Promise<void> {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

/**
 * 점심시간 (profiles.lunch_start / lunch_end).
 * 0008 마이그레이션 전에는 컬럼이 없으므로 기본값(12:00~13:00)을 쓰고 available=false 로 돌려준다.
 */
export async function getLunch(userId: string): Promise<{ available: boolean; lunch: Lunch | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("lunch_start, lunch_end")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { available: false, lunch: DEFAULT_LUNCH };
  if (!data?.lunch_start || !data?.lunch_end) return { available: true, lunch: null };
  return { available: true, lunch: { start: displayTime(data.lunch_start), end: displayTime(data.lunch_end) } };
}

export async function updateLunch(userId: string, lunch: Lunch | null): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ lunch_start: lunch?.start ?? null, lunch_end: lunch?.end ?? null })
    .eq("id", userId);
  if (error) throw error;
}
