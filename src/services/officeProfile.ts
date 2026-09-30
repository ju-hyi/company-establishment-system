import { supabase } from "../lib/supabase";
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
