import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlatformSettings = {
  free_enabled: boolean;
  free_game_slug: string | null;
  free_until: string | null;
};

const empty: PlatformSettings = { free_enabled: false, free_game_slug: null, free_until: null };

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(empty);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("free_enabled,free_game_slug,free_until")
      .maybeSingle();
    setSettings((data as PlatformSettings) ?? empty);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { settings, loading, reload };
}

export async function saveFreeGiveaway(next: Partial<PlatformSettings>) {
  const { error } = await supabase
    .from("platform_settings")
    .update({
      free_enabled: next.free_enabled ?? false,
      free_game_slug: next.free_game_slug ?? null,
      free_until: next.free_until ?? null,
    })
    .eq("id", true);
  return error?.message ?? null;
}

/** Осталось до конца раздачи. */
export function freeCountdown(until: string | null) {
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return [
    [String(days), "дней"],
    [String(hours), "часов"],
    [String(minutes), "минут"],
  ] as const;
}
