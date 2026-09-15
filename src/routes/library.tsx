import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Download,
  Globe,
  Heart,
  LibraryBig,
  ListFilter,
  Play,
  Plus,
  Settings,
} from "lucide-react";
import { GameActions } from "@/components/GameActions";
import { games } from "@/lib/games";
import { useLibrary } from "@/lib/library";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Моя библиотека — Nebula" },
      {
        name: "description",
        content: "Библиотека Nebula: установленные игры, очередь загрузок, пауза, удаление и запуск.",
      },
      { property: "og:title", content: "Моя библиотека — Nebula" },
      {
        property: "og:description",
        content: "Управляйте установленными играми и загрузками в библиотеке Nebula.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

const statusLabel: Record<string, string> = {
  owned: "Не установлена",
  downloading: "Загружается",
  paused: "На паузе",
  installed: "Установлена",
};

function LibraryPage() {
  const { entries, ready } = useLibrary();
  const [query, setQuery] = useState("");

  const owned = games.filter((g) => entries[g.id]);
  const filtered = owned.filter((g) => g.title.toLowerCase().includes(query.toLowerCase()));
  const quickLaunch = filtered.slice(0, 3);
  const playNext = games.filter((g) => !entries[g.id]).slice(0, 5);

  return (
    <div className="grid gap-6 px-5 pb-8 xl:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <h1 className="sr-only">Моя библиотека Nebula</h1>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold">
            <Play className="h-4 w-4" aria-hidden /> Быстрый запуск
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLaunch.map((game) => {
            const entry = entries[game.id]!;
            return (
              <Link
                key={game.id}
                to="/game/$gameId"
                params={{ gameId: game.id }}
                className="group relative overflow-hidden rounded-lg border border-border bg-surface"
              >
                <img
                  src={game.image}
                  alt={`Обложка игры ${game.title}`}
                  loading="lazy"
                  width={1088}
                  height={608}
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-background via-background/80 to-transparent p-3">
                  <span className="rounded bg-primary/25 px-2 py-1 text-[11px] text-foreground">
                    Наиграно: {entry.hoursPlayed.toFixed(1)} ч
                  </span>
                  <span className="ml-auto flex h-7 w-7 items-center justify-center rounded bg-surface-2 text-muted-foreground">
                    <Settings className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-surface-2 text-muted-foreground">
                    <Play className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
          <Link
            to="/"
            className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-8 w-8" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold">
            <LibraryBig className="h-4 w-4" aria-hidden /> Моя библиотека
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по библиотеке"
            aria-label="Поиск по библиотеке"
            className="h-9 w-56 rounded-full bg-surface-2 px-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Все игры ({owned.length})</span>
          <span className="ml-auto flex items-center gap-2">
            Сортировка
            <span className="flex items-center gap-1 rounded bg-surface-2 px-3 py-1.5 normal-case text-foreground">
              По последним <ChevronDown className="h-3 w-3" aria-hidden />
            </span>
          </span>
        </div>

        {!ready ? null : owned.length === 0 ? (
          <div className="mt-8 rounded-xl surface-panel p-10 text-center">
            <p className="text-muted-foreground">В библиотеке пока пусто.</p>
            <Link
              to="/"
              className="mt-4 inline-flex rounded-md bg-primary px-5 py-2 font-display text-sm font-semibold uppercase text-primary-foreground hover:opacity-90"
            >
              Перейти в магазин
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {filtered.map((game) => {
                const entry = entries[game.id]!;
                return (
                  <div key={game.id}>
                    <Link
                      to="/game/$gameId"
                      params={{ gameId: game.id }}
                      className="group block overflow-hidden rounded-lg border border-border bg-surface"
                    >
                      <img
                        src={game.image}
                        alt={`Обложка игры ${game.title}`}
                        loading="lazy"
                        width={1088}
                        height={608}
                        className="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm">{game.title}</span>
                      {entry.status === "installed" ? (
                        <Play className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      ) : (
                        <Download className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {statusLabel[entry.status]}
                      {entry.status === "downloading" ? ` · ${Math.floor(entry.progress)}%` : ""}
                    </p>
                  </div>
                );
              })}
            </div>

            <section className="mt-10 rounded-xl surface-panel p-5">
              <h2 className="mb-4 font-display text-xl font-bold">Загрузки и установки</h2>
              <ul className="space-y-5">
                {filtered.map((game) => (
                  <li
                    key={game.id}
                    className="flex flex-col gap-3 border-b border-border pb-5 last:border-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <img
                      src={game.image}
                      alt=""
                      loading="lazy"
                      width={1088}
                      height={608}
                      className="h-16 w-28 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold">{game.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {game.studio} · {game.sizeGb} ГБ
                      </p>
                    </div>
                    <div className="w-full sm:w-80">
                      <GameActions game={game} compact />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      <aside className="space-y-5">
        <div className="flex justify-end">
          <span className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
            <ListFilter className="h-4 w-4" aria-hidden /> Управление
          </span>
        </div>

        <div className="rounded-xl surface-panel p-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-xs font-semibold uppercase">
              <Plus className="h-3.5 w-3.5" aria-hidden /> Добавить полку
            </span>
            <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-md bg-surface-2 text-muted-foreground">
              <Settings className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Выберите, что показывать в библиотеке. Каждую полку можно настроить отдельно.
          </p>
          <div className="mt-4 space-y-2">
            <span className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-3 text-sm font-semibold uppercase">
              <CircleDot className="h-4 w-4 text-accent" aria-hidden /> Недавние игры
            </span>
            <span className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-3 text-sm font-semibold uppercase">
              <Heart className="h-4 w-4 text-destructive" aria-hidden /> Избранное
            </span>
            <span className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-3 text-sm font-semibold uppercase">
              <Globe className="h-4 w-4 text-primary" aria-hidden /> Все игры
            </span>
          </div>
        </div>

        <span className="flex w-fit items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
          <Play className="h-4 w-4" aria-hidden /> Что дальше
        </span>

        <div className="space-y-4 rounded-xl border border-dashed border-primary/50 p-3">
          {playNext.map((game) => (
            <Link
              key={game.id}
              to="/game/$gameId"
              params={{ gameId: game.id }}
              className="flex gap-3 rounded-md p-1 transition-colors hover:bg-secondary"
            >
              <img
                src={game.image}
                alt=""
                loading="lazy"
                width={1088}
                height={608}
                className="h-14 w-12 rounded object-cover"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{game.title}</span>
                <span className="line-clamp-2 text-[11px] text-muted-foreground">{game.description}</span>
              </span>
            </Link>
          ))}
          <Link
            to="/"
            className="block rounded bg-surface-2 px-3 py-2 text-center text-xs font-semibold uppercase"
          >
            Смотреть ещё
          </Link>
        </div>
      </aside>
    </div>
  );
}
