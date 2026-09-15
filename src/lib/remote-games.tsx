import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { setRemoteGames, type Game } from "@/lib/games";
import { signedUrl } from "@/lib/storage";
import { useAuth } from "@/lib/auth";

type Ctx = { reload: () => Promise<void>; version: number };

const RemoteGamesContext = createContext<Ctx | null>(null);

export function RemoteGamesProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const { user } = useAuth();

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    const list: Game[] = await Promise.all(
      (data ?? []).map(async (row) => {
        const image = (await signedUrl("game-covers", row.cover_url)) ?? "";
        const base: Game = {
          id: row.slug,
          title: row.title,
          studio: row.studio,
          description: row.description,
          tags: row.tags,
          price: row.price,
          discount: row.discount,
          sizeGb: Number(row.size_gb),
          rating: row.rating,
          image,
          fileName: row.installer_name ?? `${row.slug}.zip`,
          remote: true,
        };
        return row.installer_url ? { ...base, installerPath: row.installer_url } : base;
      }),
    );

    setRemoteGames(list);
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, user?.id]);

  const value = useMemo<Ctx>(() => ({ reload, version }), [reload, version]);

  return <RemoteGamesContext.Provider value={value}>{children}</RemoteGamesContext.Provider>;
}

export function useRemoteGames() {
  const ctx = useContext(RemoteGamesContext);
  if (!ctx) throw new Error("useRemoteGames must be used inside RemoteGamesProvider");
  return ctx;
}
