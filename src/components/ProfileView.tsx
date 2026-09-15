import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/lib/auth";
import { useSignedUrl } from "@/lib/storage";
import { fetchLibrary, useLibrary, type LibraryEntry } from "@/lib/library";
import { getGame } from "@/lib/games";


const card = "rounded-lg border border-border/70 bg-surface/70 p-5";

export function ProfileView({ userId }: { userId: string }) {
  const { user, profile: mine } = useAuth();
  const isMe = user?.id === userId;
  const [profile, setProfile] = useState<Profile | null>(isMe ? mine : null);
  const [loading, setLoading] = useState(!isMe);
  const [others, setOthers] = useState<Profile[]>([]);
  const avatarUrl = useSignedUrl("avatars", profile?.avatar_url);
  const { entries } = useLibrary();
  const [theirGames, setTheirGames] = useState<LibraryEntry[]>([]);

  useEffect(() => {
    if (isMe) {
      setProfile(mine);
      return;
    }
    let active = true;
    setLoading(true);
    void supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setProfile((data as Profile) ?? null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isMe, mine, userId]);

  useEffect(() => {
    let active = true;
    void supabase
      .from("profiles")
      .select("*")
      .neq("id", userId)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (active) setOthers((data ?? []) as Profile[]);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const libraryVisible = isMe || profile?.show_library !== false;

  useEffect(() => {
    if (isMe || !libraryVisible) {
      setTheirGames([]);
      return;
    }
    let active = true;
    void fetchLibrary(userId).then((list) => {
      if (active) setTheirGames(list);
    });
    return () => {
      active = false;
    };
  }, [isMe, libraryVisible, userId]);

  if (loading) {
    return <p className="px-6 pt-8 text-sm text-muted-foreground">Загружаем профиль…</p>;
  }

  if (!profile) {
    return (
      <div className="px-6 pt-8">
        <p className="text-sm text-muted-foreground">Профиль не найден.</p>
        <Link to="/" className="mt-3 inline-block text-sm text-primary">
          ← На главную
        </Link>
      </div>
    );
  }

  const owned = isMe ? Object.values(entries) : theirGames;
  const installed = owned.filter((e) => e.status === "installed");
  const hours = owned.reduce((sum, e) => sum + e.hoursPlayed, 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-6 pb-14 pt-6">
      <section className="relative overflow-hidden rounded-lg border border-border/70">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-surface to-surface" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-5 p-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Аватар ${profile.display_name}`}
              className="h-24 w-24 rounded-xl object-cover ring-2 ring-border"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-surface-2 text-3xl font-bold">
              {(profile.display_name || "N").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {profile.display_name || "Игрок"}
            </h1>
            {profile.tagline ? (
              <p className="mt-1 text-sm text-muted-foreground">{profile.tagline}</p>
            ) : null}
            <p className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="rounded bg-surface-2 px-2 py-1 font-semibold text-foreground">
                Уровень {profile.level}
              </span>
              {profile.country ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> {profile.country}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden /> В сети
              </span>
            </p>
          </div>
          {isMe ? (
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-semibold"
            >
              <Pencil className="h-4 w-4" aria-hidden /> Редактировать профиль
            </Link>
          ) : null}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-5">
          <section className={card}>
            <h2 className="font-display text-xl font-semibold">О себе</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {profile.bio || "Пользователь пока ничего не рассказал о себе."}
            </p>
          </section>

          {libraryVisible ? (
            <section className={card}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">
                  {isMe ? "Моя библиотека" : "Игры игрока"}
                </h2>
                {isMe ? (
                  <Link to="/library" className="text-sm text-primary">
                    Все игры →
                  </Link>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm sm:grid-cols-3">
                <Stat label="Игр в аккаунте" value={owned.length} />
                <Stat label="Установлено" value={installed.length} />
                <Stat label="Часов в играх" value={hours.toFixed(1)} />
              </div>
              <ul className="mt-4 space-y-2">
                {owned.slice(0, 6).map((entry) => {
                  const game = getGame(entry.id);
                  if (!game) return null;
                  return (
                    <li key={entry.id} className="flex items-center gap-3 rounded bg-surface-2/60 p-2">
                      <img src={game.image} alt="" className="h-11 w-20 rounded object-cover" />
                      <span className="min-w-0 flex-1">
                        <Link
                          to="/game/$gameId"
                          params={{ gameId: game.id }}
                          className="block truncate text-sm font-semibold hover:text-primary"
                        >
                          {game.title}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {entry.status === "installed"
                            ? "Установлена"
                            : entry.status === "downloading"
                              ? `Загрузка ${Math.floor(entry.progress)}%`
                              : entry.status === "paused"
                                ? "Загрузка на паузе"
                                : "В аккаунте"}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {entry.hoursPlayed.toFixed(1)} ч
                      </span>
                    </li>
                  );
                })}
                {owned.length === 0 ? (
                  <li className="text-sm text-muted-foreground">
                    {isMe ? "Пока нет игр в аккаунте." : "У игрока пока нет игр."}
                  </li>
                ) : null}
              </ul>
            </section>
          ) : (
            <section className={card}>
              <h2 className="font-display text-xl font-semibold">Игры игрока</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Игрок скрыл свою библиотеку игр.
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className={card}>
            <h2 className="font-display text-lg font-semibold">Игроки Nebula</h2>
            <ul className="mt-3 space-y-2">
              {others.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/players/$userId"
                    params={{ userId: p.id }}
                    className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-surface-2"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold">
                      {(p.display_name || "N").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {p.display_name || "Игрок"}
                      </span>
                      {p.tagline ? (
                        <span className="block truncate text-xs text-muted-foreground">{p.tagline}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
              {others.length === 0 ? (
                <li className="text-sm text-muted-foreground">Других игроков ещё нет.</li>
              ) : null}
            </ul>
          </section>

          <section className={card}>
            <h2 className="font-display text-lg font-semibold">Статистика</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">На Nebula с</dt>
                <dd>
                  {new Date(profile.created_at).toLocaleDateString("ru-RU", {
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Уровень</dt>
                <dd>{profile.level}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Страна</dt>
                <dd>{profile.country || "—"}</dd>
              </div>
            </dl>
          </section>

        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-surface-2/60 p-3">
      <p className="font-display text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
