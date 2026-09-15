import { Link, useRouterState } from "@tanstack/react-router";
import { Folder, Hash, Home, LayoutGrid, Settings } from "lucide-react";
import { PlayersPanel } from "@/components/PlayersPanel";

const nav = [
  { title: "Главная", to: "/", icon: Home },
  { title: "Категории", to: "/", icon: LayoutGrid },
  { title: "Библиотека", to: "/library", icon: Folder },
  { title: "Сообщество", to: "/", icon: Hash },
  { title: "Настройки", to: "/settings", icon: Settings },
] as const;



export function SiteSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col bg-background pb-6 lg:flex">
      <Link to="/" className="flex items-center gap-3 px-6 pb-8 pt-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50 font-display text-lg font-bold text-primary-foreground">
          N
        </span>
        <span className="font-display text-xl font-bold tracking-[0.12em]">NEBULA</span>
      </Link>

      <nav className="flex flex-col gap-1 pr-5">
        {nav.map((item, i) => {
          const active =
            i === 0 ? pathname === "/" : item.to === "/library" && pathname === "/library";
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to={item.to}
              className={`flex items-center gap-4 rounded-r-full py-3.5 pl-6 pr-4 text-[15px] transition-colors ${
                active
                  ? "bg-foreground font-semibold text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <PlayersPanel />
    </aside>
  );
}

