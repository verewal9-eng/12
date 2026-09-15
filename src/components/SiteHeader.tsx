import { Link } from "@tanstack/react-router";
import { Bell, Copy, Search, ShoppingCart } from "lucide-react";
import { useLibrary } from "@/lib/library";
import { UserMenu } from "@/components/UserMenu";

export function SiteHeader() {
  const { entries } = useLibrary();
  const downloading = Object.values(entries).filter((e) => e.status === "downloading").length;

  return (
    <header className="flex items-center justify-end gap-6 px-6 pb-6 pt-7">
      <button
        aria-label="Поиск"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-surface-2"
      >
        <Search className="h-[18px] w-[18px]" aria-hidden />
      </button>

      <div className="flex items-center gap-5">
        <Link to="/library" aria-label="Корзина" className="relative text-foreground/90 hover:text-foreground">
          <ShoppingCart className="h-[22px] w-[22px]" aria-hidden />
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {Object.keys(entries).length || 3}
          </span>
        </Link>
        <span className="relative text-foreground/90">
          <Bell className="h-[22px] w-[22px]" aria-hidden />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" aria-hidden />
        </span>
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
