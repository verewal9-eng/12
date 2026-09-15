import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { games, getGame } from "@/lib/games";
import { signedUrl } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type EntryStatus = "owned" | "downloading" | "paused" | "installed";

export type LibraryEntry = {
  id: string;
  status: EntryStatus;
  progress: number; // 0..100
  speedMbs: number;
  lastPlayed?: string;
  hoursPlayed: number;
};

type LibraryState = Record<string, LibraryEntry>;

type Row = {
  game_id: string;
  status: string;
  progress: number | string;
  hours_played: number | string;
  last_played: string | null;
};

function toEntry(row: Row): LibraryEntry {
  const status = (["owned", "downloading", "paused", "installed"] as const).includes(
    row.status as EntryStatus,
  )
    ? (row.status as EntryStatus)
    : "owned";
  const entry: LibraryEntry = {
    id: row.game_id,
    // Незавершённая загрузка при новом входе — считаем поставленной на паузу.
    status: status === "downloading" ? "paused" : status,
    progress: Number(row.progress) || 0,
    speedMbs: 0,
    hoursPlayed: Number(row.hours_played) || 0,
  };
  return row.last_played ? { ...entry, lastPlayed: row.last_played } : entry;
}

/** Библиотека любого игрока — используется на странице профиля. */
export async function fetchLibrary(userId: string): Promise<LibraryEntry[]> {
  const { data } = await supabase
    .from("user_library")
    .select("game_id,status,progress,hours_played,last_played")
    .eq("user_id", userId);
  return ((data ?? []) as Row[]).map(toEntry);
}

type Ctx = {
  entries: LibraryState;
  ready: boolean;
  own: (id: string) => void;
  install: (id: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  cancel: (id: string) => void;
  uninstall: (id: string) => void;
  play: (id: string) => void;
  downloadToPc: (id: string) => Promise<void>;
};

const LibraryContext = createContext<Ctx | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [entries, setEntries] = useState<LibraryState>({});
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Изменения, сделанные до готовности аккаунта, ждут здесь и сохраняются позже.
  const pending = useRef<LibraryEntry[]>([]);
  const ready = loaded && !authLoading;

  // Библиотека принадлежит аккаунту: при смене пользователя загружаем его игры.
  useEffect(() => {
    let active = true;
    setLoaded(false);
    setEntries({});
    if (!userId) {
      setLoaded(true);
      return;
    }
    void fetchLibrary(userId).then((list) => {
      if (!active) return;
      const next: LibraryState = {};
      for (const entry of list) next[entry.id] = entry;
      setEntries(next);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const persist = useCallback(
    (entry: LibraryEntry) => {
      if (!userId) {
        pending.current = [...pending.current.filter((e) => e.id !== entry.id), entry];
        return;
      }
      void supabase
        .from("user_library")
        .upsert(
          {
            user_id: userId,
            game_id: entry.id,
            status: entry.status,
            progress: entry.progress,
            hours_played: entry.hoursPlayed,
            last_played: entry.lastPlayed ?? null,
          },
          { onConflict: "user_id,game_id" },
        )
        .then(({ error }) => {
          if (error) console.error("[library] save failed", entry.id, error.message);
        });
    },
    [userId],
  );

  // Как только аккаунт загрузился — досохраняем отложенные покупки.
  useEffect(() => {
    if (!userId || !loaded || pending.current.length === 0) return;
    const queued = pending.current;
    pending.current = [];
    setEntries((prev) => {
      const next = { ...prev };
      for (const entry of queued) next[entry.id] = { ...entry, ...next[entry.id] };
      return next;
    });
    for (const entry of queued) persist(entry);
  }, [userId, loaded, persist]);

  const upsert = useCallback(
    (id: string, patch: Partial<LibraryEntry>) => {
      setEntries((prev) => {
        const base: LibraryEntry = prev[id] ?? {
          id,
          status: "owned",
          progress: 0,
          speedMbs: 0,
          hoursPlayed: 0,
        };
        const next = { ...base, ...patch };
        persist(next);
        return { ...prev, [id]: next };
      });
    },
    [persist],
  );

  // Download tick
  useEffect(() => {
    if (!ready) return;
    timer.current = setInterval(() => {
      setEntries((prev) => {
        let changed = false;
        const next: LibraryState = { ...prev };
        for (const entry of Object.values(prev)) {
          if (entry.status !== "downloading") continue;
          const game = getGame(entry.id);
          if (!game) continue;
          const speed = 18 + Math.random() * 42; // MB/s
          const step = (speed / (game.sizeGb * 1024)) * 100 * 0.5;
          const progress = Math.min(100, entry.progress + step);
          const updated: LibraryEntry = {
            ...entry,
            progress,
            speedMbs: Math.round(speed),
            status: progress >= 100 ? "installed" : "downloading",
          };
          next[entry.id] = updated;
          if (updated.status === "installed") persist(updated);
          changed = true;
        }
        return changed ? next : prev;
      });
    }, 500);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [ready, persist]);

  const value = useMemo<Ctx>(
    () => ({
      entries,
      ready,
      own: (id) => upsert(id, { status: "owned" }),
      install: (id) => upsert(id, { status: "downloading" }),
      pause: (id) => upsert(id, { status: "paused", speedMbs: 0 }),
      resume: (id) => upsert(id, { status: "downloading" }),
      cancel: (id) => upsert(id, { status: "owned", progress: 0, speedMbs: 0 }),
      uninstall: (id) => upsert(id, { status: "owned", progress: 0, speedMbs: 0 }),
      play: (id) =>
        upsert(id, {
          lastPlayed: new Date().toISOString(),
          hoursPlayed: (entries[id]?.hoursPlayed ?? 0) + 0.5,
        }),
      downloadToPc: async (id) => {
        const game = getGame(id);
        if (!game || typeof window === "undefined") return;

        // Настоящий установщик, загруженный в хранилище администратором.
        if (game.installerPath) {
          const url = await signedUrl("game-installers", game.installerPath, 600);
          if (url) {
            const a = document.createElement("a");
            a.href = url;
            a.download = game.fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            return;
          }
        }

        const content = [
          `# ${game.title} — установщик Nebula`,
          `Студия: ${game.studio}`,
          `Размер сборки: ${game.sizeGb} ГБ`,
          `Идентификатор: ${game.id}`,
          `Дата загрузки: ${new Date().toLocaleString("ru-RU")}`,
          "",
          "Это демонстрационный файл витрины. Запустите его через клиент Nebula.",
        ].join("\n");
        const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${game.fileName}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
    }),
    [entries, ready, upsert],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
  return ctx;
}

export function useOwnedGames() {
  const { entries } = useLibrary();
  return games.filter((g) => entries[g.id]);
}
