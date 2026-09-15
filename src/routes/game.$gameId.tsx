import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  Compass,
  Crosshair,
  Flame,
  Moon,
  Play,
  Shield,
  Skull,
  Star,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import { getGame } from "@/lib/games";
import { useLibrary } from "@/lib/library";
import { useAchievements } from "@/lib/achievements";
import { getGameOwners, isPublisher } from "@/lib/social";
import { GameActions } from "@/components/GameActions";


export const Route = createFileRoute("/game/$gameId")({
  loader: ({ params }) => {
    const game = getGame(params.gameId);
    if (!game) throw notFound();
    return { title: game.title, description: game.description };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — Nebula` : "Игра — Nebula";
    const description = loaderData?.description ?? "Страница игры в библиотеке Nebula.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: GamePage,
});

const iconMap: Record<string, typeof Trophy> = {
  target: Target,
  shield: Shield,
  swords: Swords,
  flame: Flame,
  skull: Skull,
  moon: Moon,
  star: Star,
  crosshair: Crosshair,
  compass: Compass,
  trophy: Trophy,
};

function AchIcon({ icon, className }: { icon: string; className?: string }) {
  const Cmp = iconMap[icon];
  if (Cmp) return <Cmp className={className ?? "h-5 w-5"} aria-hidden />;
  return <span className="text-lg">{icon}</span>;
}

const links = [
  "Сообщество",
  "Достижения",
  "Обсуждения",
  "Связанные группы",
  "Руководства",
  "Новости",
  "Страница в магазине",
  "DLC",
  "Поддержка",
  "Написать обзор",
];

const news = [
  {
    title: "Крупное обновление сезона: новые зоны и режим испытаний",
    text: "Разработчики добавили две новые локации, переработали баланс оружия и запустили еженедельные испытания с уникальными наградами для всех владельцев игры.",
  },
  {
    title: "Патч 1.4.2: исправления и производительность",
    text: "Улучшена стабильность на слабых конфигурациях, исправлены зависания при загрузке сохранений и ошибки синхронизации облака.",
  },
  {
    title: "Интервью с командой: как создавался мир игры",
    text: "Арт-директор рассказал о референсах, работе со светом и о том, почему финальная локация переделывалась четыре раза.",
  },
  {
    title: "Скидка выходного дня и бесплатные выходные",
    text: "До конца недели игра доступна бесплатно всем пользователям Nebula, а прогресс сохранится при покупке.",
  },
];

function GamePage() {
  const { gameId } = Route.useParams();
  const game = getGame(gameId);
  const { entries, play, downloadToPc, uninstall } = useLibrary();
  const { getAchievements, addAchievement, removeAchievement } = useAchievements();
  const [form, setForm] = useState({ title: "", description: "", icon: "trophy" });
  const [open, setOpen] = useState(false);

  if (!game) return null;

  const entry = entries[game.id];
  const achievements = getAchievements(game.id);
  const unlocked = achievements.filter((a) => a.unlockedAt);
  const latest = unlocked[unlocked.length - 1];
  const percent = Math.round((unlocked.length / Math.max(1, achievements.length)) * 100);
  const { owners, playing, totalOwners } = getGameOwners(game.id);
  const canEdit = isPublisher(game.id);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addAchievement({
      gameId: game.id,
      title: form.title.trim(),
      description: form.description.trim(),
      icon: form.icon || "trophy",
    });
    setForm({ title: "", description: "", icon: "trophy" });
  };

  const lastPlayed = entry?.lastPlayed
    ? new Date(entry.lastPlayed).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "ещё не запускалась";

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Фон-баннер */}
      <div className="absolute inset-0">
        <img src={game.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
      </div>

      <div className="relative grid gap-8 px-6 pb-12 pt-7 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 space-y-5">
          <Link to="/library" className="text-xs text-muted-foreground hover:text-foreground">
            ← Библиотека
          </Link>

          <div className="flex items-center gap-4">
            <img
              src={game.image}
              alt=""
              className="h-14 w-14 rounded object-cover"
            />
            <h1 className="font-display text-4xl font-semibold tracking-tight">{game.title}</h1>
          </div>

          {/* Загрузка / Играть */}
          <section className="rounded-sm border border-border/60 bg-surface/70 p-4">
            {entry?.status === "installed" ? (
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => play(game.id)}
                  className="flex h-14 w-14 items-center justify-center border border-foreground/70 text-foreground transition-colors hover:bg-foreground hover:text-background"
                  aria-label="Запустить игру"
                >
                  <Play className="h-6 w-6" aria-hidden />
                </button>
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Вы уже играли: <span className="text-foreground">{(entry?.hoursPlayed ?? 0).toFixed(1)} ч</span>
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Последний запуск: <span className="text-foreground">{lastPlayed}</span>
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void downloadToPc(game.id)}
                    className="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    Скачать установщик
                  </button>
                  <button
                    type="button"
                    onClick={() => uninstall(game.id)}
                    className="rounded-md border border-border bg-secondary px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                  >
                    Удалить
                  </button>
                </div>

              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {entry
                    ? entry.status === "owned"
                      ? "Игра в вашей библиотеке. Установите её, чтобы играть."
                      : "Идёт установка. Кнопка «Играть» появится после завершения."
                    : "Добавьте игру в библиотеку, чтобы установить её."}
                </p>
                <GameActions game={game} />
              </div>
            )}
          </section>


          {/* Друзья */}
          <section className="flex gap-5">
            <h2 className="w-24 shrink-0 pt-4 text-right font-display text-lg font-semibold">Друзья</h2>
            <div className="flex-1 rounded-sm border border-border/60 bg-surface/70 p-4">
              <p className="text-sm text-muted-foreground">
                Игра куплена у {owners.length} ваших друзей · всего владельцев: {totalOwners}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {owners.slice(0, 7).map((o) => (
                  <div key={o.friend.id} className="relative" title={`${o.friend.name} · ${o.hours} ч`}>
                    <img
                      src={o.friend.avatar}
                      alt={o.friend.name}
                      className={`h-11 w-11 rounded-full object-cover ring-2 ${
                        o.playingNow ? "ring-success" : "ring-border"
                      }`}
                    />
                    {o.playingNow ? (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-success" />
                    ) : null}
                  </div>
                ))}
                {owners.length > 7 ? (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-xs text-muted-foreground">
                    +{totalOwners - 7}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm">
                {playing.length > 0 ? (
                  <span className="text-success">
                    Сейчас играют: {playing.map((p) => p.friend.name).join(", ")}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Сейчас в игру никто из друзей не играет</span>
                )}
              </p>
            </div>
          </section>

          {/* Достижения */}
          <section className="flex gap-5">
            <h2 className="w-24 shrink-0 pt-4 text-right font-display text-lg font-semibold">Достижения</h2>
            <div className="flex-1 space-y-3">
              <div className="rounded-sm border border-border/60 bg-surface/70 p-4">
                {latest ? (
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded bg-surface-2">
                      <AchIcon icon={latest.icon} className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Последнее полученное достижение</p>
                      <p className="font-semibold">{latest.title}</p>
                    </div>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {new Date(latest.unlockedAt!).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Достижения ещё не получены</p>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-sm border border-border/60 bg-surface/70 p-3">
                {achievements.slice(0, 8).map((a) => (
                  <span
                    key={a.id}
                    title={`${a.title} — ${a.description}`}
                    className={`flex h-10 w-10 items-center justify-center rounded bg-surface-2 ${
                      a.unlockedAt ? "" : "opacity-35 grayscale"
                    }`}
                  >
                    <AchIcon icon={a.icon} />
                  </span>
                ))}
                {achievements.length > 8 ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded bg-surface-2 text-xs text-muted-foreground">
                    +{achievements.length - 8}
                  </span>
                ) : null}
                <span className="ml-auto text-sm text-muted-foreground">
                  {unlocked.length} / {achievements.length} ({percent}%)
                </span>
              </div>

              {canEdit ? (
                <div className="rounded-sm border border-primary/40 bg-surface/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm">
                      <span className="font-semibold">Вы владелец этой игры в магазине.</span>{" "}
                      <span className="text-muted-foreground">Можно добавлять достижения.</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpen((v) => !v)}
                      className="rounded bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                    >
                      {open ? "Закрыть" : "Добавить достижение"}
                    </button>
                  </div>

                  {open ? (
                    <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[70px_1fr_1fr_auto]">
                      <input
                        value={form.icon}
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                        aria-label="Иконка достижения"
                        className="rounded bg-surface-2 px-3 py-2 text-center text-lg outline-none"
                      />
                      <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Название"
                        aria-label="Название достижения"
                        className="rounded bg-surface-2 px-3 py-2 text-sm outline-none"
                      />
                      <input
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Условие получения"
                        aria-label="Описание достижения"
                        className="rounded bg-surface-2 px-3 py-2 text-sm outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded bg-foreground px-4 py-2 text-sm font-semibold text-background"
                      >
                        Создать
                      </button>
                    </form>
                  ) : null}

                  {achievements.some((a) => a.custom) ? (
                    <ul className="mt-4 space-y-2">
                      {achievements
                        .filter((a) => a.custom)
                        .map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center gap-3 rounded bg-surface-2/60 px-3 py-2 text-sm"
                          >
                            <AchIcon icon={a.icon} />
                            <span className="font-medium">{a.title}</span>
                            <span className="truncate text-muted-foreground">{a.description}</span>
                            <button
                              type="button"
                              onClick={() => removeAchievement(a.id)}
                              className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                            >
                              Удалить
                            </button>
                          </li>
                        ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          {/* Новости */}
          <section className="flex gap-5">
            <h2 className="w-24 shrink-0 pt-4 text-right font-display text-lg font-semibold leading-tight">
              Последние новости
            </h2>
            <div className="flex-1 divide-y divide-border/60 rounded-sm border border-border/60 bg-surface/70">
              {news.map((item) => (
                <article key={item.title} className="p-4">
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  <p className="mt-1 text-right text-xs text-muted-foreground underline">Узнать больше</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* Правая колонка */}
        <aside className="hidden xl:block">
          <h2 className="font-display text-2xl font-semibold">
            Ссылки <span className="text-xs uppercase tracking-widest text-muted-foreground">links</span>
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {links.map((l) => (
              <li key={l} className="cursor-pointer hover:text-foreground">
                {l}
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-display text-2xl font-semibold">
            Тип <span className="text-xs uppercase tracking-widest text-muted-foreground">category</span>
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {game.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
            <li className="cursor-pointer hover:text-foreground">Настроить категории…</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
