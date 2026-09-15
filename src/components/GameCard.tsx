import { Link } from "@tanstack/react-router";
import { finalPrice, formatPrice, type Game } from "@/lib/games";

export function GameCard({ game }: { game: Game }) {
  const price = finalPrice(game);

  return (
    <Link
      to="/game/$gameId"
      params={{ gameId: game.id }}
      className="group block overflow-hidden rounded-xl surface-panel transition-transform duration-200 hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={game.image}
          alt={`Обложка игры ${game.title}`}
          loading="lazy"
          width={1088}
          height={608}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {game.discount > 0 && (
          <span className="absolute left-3 top-3 rounded bg-accent px-2 py-1 font-display text-sm font-bold text-accent-foreground">
            -{game.discount}%
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-display text-lg font-semibold">{game.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{game.description}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {game.tags.map((tag) => (
            <span key={tag} className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">{game.sizeGb} ГБ</span>
          <div className="flex items-center gap-2">
            {game.discount > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(game.price)}
              </span>
            )}
            <span className="font-display text-lg font-bold text-primary">{formatPrice(price)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
