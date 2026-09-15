import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { finalPrice, formatPrice, games, getGame } from "@/lib/games";
import { GameActions } from "@/components/GameActions";
import { useRemoteGames } from "@/lib/remote-games";
import { freeCountdown, usePlatformSettings } from "@/lib/platform";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nebula — магазин игр с библиотекой и загрузками" },
      {
        name: "description",
        content:
          "Nebula: витрина игр со скидками, личная библиотека, установка и загрузка игр на ПК с прогрессом и паузой.",
      },
      { property: "og:title", content: "Nebula — магазин игр с библиотекой и загрузками" },
      {
        property: "og:description",
        content: "Покупайте игры, устанавливайте их и следите за прогрессом загрузки в библиотеке Nebula.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { version } = useRemoteGames();
  const { settings } = usePlatformSettings();
  const catalogue = games.slice();
  const slides = catalogue.slice(0, Math.min(5, catalogue.length));
  const [index, setIndex] = useState(0);
  const news = catalogue.slice(0, 3);

  const freeGame = settings.free_enabled && settings.free_game_slug
    ? getGame(settings.free_game_slug)
    : undefined;
  const countdown = freeCountdown(settings.free_until);

  useEffect(() => {
    setIndex(0);
  }, [version]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const featured = slides[Math.min(index, slides.length - 1)];

  return (
    <div className="grid gap-8 px-6 pb-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <h1 className="sr-only">Магазин игр Nebula</h1>

        {/* Баннер с новинками */}
        {featured ? (
          <section className="relative overflow-hidden rounded-[18px]">
            <img
              key={featured.id}
              src={featured.image}
              alt={`Обложка игры ${featured.title}`}
              className="h-[340px] w-full animate-in fade-in object-cover duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/60" />
            <div className="absolute inset-0 flex flex-col justify-center px-10">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                {featured.studio}
              </p>
              <h2 className="mt-3 max-w-[520px] font-display text-5xl font-bold uppercase leading-[0.95] tracking-wide text-white lg:text-6xl">
                {featured.title}
              </h2>
              <div className="mt-6 max-w-[280px]">
                <GameActions game={featured} />
              </div>
            </div>

            {slides.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Предыдущая новинка"
                  onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
                  className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/75"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Следующая новинка"
                  onClick={() => setIndex((i) => (i + 1) % slides.length)}
                  className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/75"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
                <div className="absolute right-8 top-7 flex items-center gap-2">
                  {slides.map((slide, i) => (
                    <button
                      key={slide.id}
                      type="button"
                      aria-label={`Показать ${slide.title}`}
                      onClick={() => setIndex(i)}
                      className={`h-1 w-8 rounded-full transition-colors ${
                        i === index ? "bg-white/90" : "bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {/* Все игры платформы */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Все игры</h2>
            <span className="text-xs text-muted-foreground">{catalogue.length} шт.</span>
          </div>

          {catalogue.length === 0 ? (
            <p className="text-sm text-muted-foreground">На платформе пока нет игр.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {catalogue.map((game) => (
                <Link
                  key={game.id}
                  to="/game/$gameId"
                  params={{ gameId: game.id }}
                  className="group relative block overflow-hidden rounded-[14px]"
                >
                  <img
                    src={game.image}
                    alt={`Обложка игры ${game.title}`}
                    className="h-[250px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  {game.discount > 0 && (
                    <span className="absolute left-3 top-3 rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">
                      -{game.discount}%
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-display text-base font-bold leading-tight text-white">
                      {game.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatPrice(finalPrice(game))}
                    </p>
                    {game.discount > 0 && (
                      <p className="text-[11px] text-white/50 line-through">{formatPrice(game.price)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Правая колонка */}
      <div className="flex min-w-0 flex-col gap-8">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Бесплатно</h2>
            <Link to="/library" className="text-xs text-muted-foreground hover:text-foreground">
              Все
            </Link>
          </div>

          {freeGame ? (
            <div className="overflow-hidden rounded-[14px] bg-surface">
              <div className="relative">
                <img
                  src={freeGame.image}
                  alt={`Обложка игры ${freeGame.title}`}
                  className="h-[190px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-xs text-white/70">
                    {countdown ? "Бесплатно ещё" : "Бесплатная раздача"}
                  </p>
                  {countdown ? (
                    <div className="mt-1 flex items-end gap-5">
                      {countdown.map(([value, label]) => (
                        <div key={label}>
                          <p className="font-display text-2xl font-bold leading-none text-white">
                            {value}
                          </p>
                          <p className="text-[10px] text-white/60">{label}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 font-display text-xl font-bold text-white">{freeGame.title}</p>
                  )}
                </div>
              </div>
              <Link
                to="/game/$gameId"
                params={{ gameId: freeGame.id }}
                className="block bg-primary py-3 text-center text-sm font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Забрать бесплатно
              </Link>
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-border bg-surface/50 p-6 text-center">
              <p className="text-sm font-semibold">Сейчас раздач нет</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Как только начнётся бесплатная раздача, игра появится здесь.
              </p>
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Новости</h2>
            <Link to="/library" className="text-xs text-muted-foreground hover:text-foreground">
              Все
            </Link>
          </div>
          <ul className="flex flex-col gap-4">
            {news.map((game) => (
              <li key={game.id} className="flex gap-3">
                <img
                  src={game.image}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{game.title}</p>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-muted-foreground">
                    {game.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
