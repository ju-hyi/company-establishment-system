import { useCallback, useEffect, useState } from "react";
import * as officeProfile from "../services/officeProfile";
import type { CharacterOverrides } from "../types";

export function useOfficeProfile(userId: string | null) {
  const [state, setState] = useState<officeProfile.OfficeProfile>({
    available: true,
    dailyMessage: null,
    characters: {},
  });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    officeProfile.getOfficeProfile(userId).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const saveDailyMessage = useCallback(
    async (message: string) => {
      if (!userId) return;
      const value = message.trim() || null;
      await officeProfile.updateOfficeProfile(userId, { daily_message: value });
      setState((prev) => ({ ...prev, dailyMessage: value }));
    },
    [userId]
  );

  /** 캐릭터 한 명의 이름/상태를 바꾼다. 빈 이름은 원래 이름으로 되돌린다. */
  const updateCharacter = useCallback(
    async (id: string, patch: Omit<CharacterOverrides[string], never>) => {
      if (!userId) return;
      const current = state.characters[id] ?? {};
      const merged = { ...current, ...patch };
      if (merged.name !== undefined && !merged.name.trim()) delete merged.name;
      else if (merged.name) merged.name = merged.name.trim();
      if (merged.note !== undefined && !merged.note.trim()) delete merged.note;
      else if (merged.note) merged.note = merged.note.trim();
      const next: CharacterOverrides = { ...state.characters, [id]: merged };
      await officeProfile.updateOfficeProfile(userId, { office_characters: next });
      setState((prev) => ({ ...prev, characters: next }));
    },
    [userId, state.characters]
  );

  return { ...state, saveDailyMessage, updateCharacter };
}
