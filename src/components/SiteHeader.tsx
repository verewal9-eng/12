import { Link } from "@tanstack/react-router";
import { Copy, Search, ShoppingCart, Wallet } from "lucide-react";
import { useLibrary } from "@/lib/library";
import { formatRub, useWallet } from "@/lib/wallet";
import { useAuth } from "@/lib/auth";
import { UserMenu } from "@/components/UserMenu";
import { NotificationsMenu } from "@/components/NotificationsMenu";

export function SiteHeader() {
  const { entries } = useLibrary();
  const { user } = useAuth();
  const { cart, balance, setCartOpen } = useWallet();
  const downloading = Object.values(entries).filter((e) => e.status === "downloading").length;

  return (
    <header className="flex items-center justify-end gap-6 px-6 pb-6 pt-7">
      <button
        aria-label="Поиск"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-surface-2"
      >
        <Search className="h-[18px] w-[18px]" aria-hidden />
      </button>

      {user && (
        <Link
          to="/wallet"
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-2"
        >
          <Wallet className="h-4 w-4 text-accent" aria-hidden />
          {formatRub(balance)}
        </Link>
      )}

      <div className="flex items-center gap-5">
        <button
          onClick={() => setCartOpen(true)}
          aria-label="Открыть корзину"
          className="relative text-foreground/90 hover:text-foreground"
        >
          <ShoppingCart className="h-[22px] w-[22px]" aria-hidden />
          {cart.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {cart.length}
            </span>
          )}
        </button>
        <NotificationsMenu />
        <span className="relative text-foreground/90">
          <Copy className="h-[22px] w-[22px]" aria-hidden />
          {downloading > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success" aria-hidden />
          )}
        </span>
      </div>

      <UserMenu />
    </header>
  );
}
