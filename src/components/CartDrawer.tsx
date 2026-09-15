import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { finalPrice, formatPrice, getGame } from "@/lib/games";
import { formatRub, useWallet } from "@/lib/wallet";
import { useAuth } from "@/lib/auth";

export function CartDrawer() {
  const { user } = useAuth();
  const { cart, cartOpen, setCartOpen, removeFromCart, checkout, balance } = useWallet();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const items = cart.map((id) => ({ id, game: getGame(id) }));
  const total = items.reduce((sum, item) => sum + (item.game ? finalPrice(item.game) : 0), 0);
  const enough = balance >= total;

  const onCheckout = async () => {
    setBusy(true);
    setMessage(null);
    const result = await checkout();
    setBusy(false);
    setMessage(result.ok ? "Покупка оформлена — игры в библиотеке." : result.error);
  };

  return (
    <>
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
          aria-hidden
        />
      )}
      <aside
        aria-label="Корзина"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-surface-2 shadow-2xl transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide">
            <ShoppingCart className="h-5 w-5" aria-hidden /> Корзина
          </h2>
          <button
            onClick={() => setCartOpen(false)}
            aria-label="Закрыть корзину"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {!user && (
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary underline">
                Войдите
              </Link>{" "}
              , чтобы покупать игры.
            </p>
          )}
          {user && items.length === 0 && (
            <p className="text-sm text-muted-foreground">Корзина пуста.</p>
          )}
          {items.map(({ id, game }) =>
            game ? (
              <div key={id} className="flex items-center gap-3 rounded-lg bg-background p-3">
                <img
                  src={game.image}
                  alt={game.title}
                  className="h-12 w-20 rounded object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{game.title}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(finalPrice(game))}</p>
                </div>
                <button
                  onClick={() => void removeFromCart(id)}
                  aria-label={`Убрать ${game.title} из корзины`}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : null,
          )}
        </div>

        <footer className="space-y-3 border-t border-border px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Баланс</span>
            <span className="font-semibold">{formatRub(balance)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Итого</span>
            <span className="font-display text-xl font-bold">{formatRub(total)}</span>
          </div>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
          {user && items.length > 0 && !enough && (
            <p className="text-xs text-accent">
              Не хватает {formatRub(total - balance)} — пополните баланс.
            </p>
          )}
          <div className="flex gap-2">
            <button
              disabled={!user || items.length === 0 || busy || !enough}
              onClick={() => void onCheckout()}
              className="flex-1 rounded-md bg-primary px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Оплачиваем…" : "Оплатить с баланса"}
            </button>
            <Link
              to="/wallet"
              onClick={() => setCartOpen(false)}
              className="rounded-md border border-border px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide hover:bg-muted"
            >
              Пополнить
            </Link>
          </div>
        </footer>
      </aside>
    </>
  );
}
