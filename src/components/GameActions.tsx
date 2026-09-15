import { Download, Pause, Play, Play as PlayIcon, Trash2 } from "lucide-react";
import { finalPrice, formatPrice, type Game } from "@/lib/games";
import { useLibrary } from "@/lib/library";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide transition-colors disabled:opacity-60";

export function GameActions({ game, compact = false }: { game: Game; compact?: boolean }) {
  const { entries, ready, own, install, pause, resume, cancel, uninstall, play, downloadToPc } =
    useLibrary();
  const entry = entries[game.id];

  if (!ready) {
    return (
      <button disabled className={`${btn} border border-border bg-secondary text-muted-foreground`}>
        Загружаем библиотеку…
      </button>
    );
  }

  if (!entry) {
    return (
      <button
        onClick={() => own(game.id)}
        className={`${btn} bg-accent text-accent-foreground hover:opacity-90`}
      >
        {game.price === 0 ? "Забрать бесплатно" : `Купить — ${formatPrice(finalPrice(game))}`}
      </button>
    );
  }

  if (entry.status === "owned") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => install(game.id)}
          className={`${btn} bg-primary text-primary-foreground hover:opacity-90`}
        >
          <Download className="h-4 w-4" aria-hidden /> Установить ({game.sizeGb} ГБ)
        </button>
        {!compact && (
          <button
            onClick={() => downloadToPc(game.id)}
            className={`${btn} border border-border bg-secondary text-foreground hover:bg-muted`}
          >
            Скачать установщик на ПК
          </button>
        )}
      </div>
    );
  }

  if (entry.status === "downloading" || entry.status === "paused") {
    const done = ((entry.progress / 100) * game.sizeGb).toFixed(1);
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {entry.status === "paused" ? "Пауза" : "Загрузка"} · {done} / {game.sizeGb} ГБ
          </span>
          <span>
            {entry.status === "downloading" ? `${entry.speedMbs} МБ/с · ` : ""}
            {Math.floor(entry.progress)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${entry.progress}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {entry.status === "downloading" ? (
            <button
              onClick={() => pause(game.id)}
              className={`${btn} border border-border bg-secondary hover:bg-muted`}
            >
              <Pause className="h-4 w-4" aria-hidden /> Пауза
            </button>
          ) : (
            <button
              onClick={() => resume(game.id)}
              className={`${btn} bg-primary text-primary-foreground hover:opacity-90`}
            >
              <Play className="h-4 w-4" aria-hidden /> Продолжить
            </button>
          )}
          <button
            onClick={() => cancel(game.id)}
            className={`${btn} border border-border bg-secondary text-muted-foreground hover:bg-muted`}
          >
            Отменить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => play(game.id)}
        className={`${btn} bg-success px-8 text-success-foreground hover:opacity-90`}
      >
        <PlayIcon className="h-4 w-4" aria-hidden /> Играть
      </button>
      <button
        onClick={() => downloadToPc(game.id)}
        className={`${btn} border border-border bg-secondary hover:bg-muted`}
      >
        <Download className="h-4 w-4" aria-hidden /> Скачать на ПК
      </button>
      <button
        onClick={() => uninstall(game.id)}
        className={`${btn} border border-border bg-secondary text-muted-foreground hover:bg-muted`}
        aria-label="Удалить игру"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
