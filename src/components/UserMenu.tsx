import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, Shield, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSignedUrl } from "@/lib/storage";

export function UserMenu() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const avatarUrl = useSignedUrl("avatars", profile?.avatar_url);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        to="/auth"
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Войти
      </Link>
    );
  }

  const name = profile?.display_name || user.email?.split("@")[0] || "Игрок";

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-full pl-2 transition-colors hover:bg-surface-2"
      >
        <span className="hidden text-right sm:block">
          <span className="block text-sm font-semibold leading-tight">{name}</span>
          <span className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden /> В сети
          </span>
        </span>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Ваш аватар"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 font-semibold ring-2 ring-border">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]"
        >
          <div className="border-b border-border/70 px-4 py-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="p-1.5">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-surface-2"
            >
              <User className="h-4 w-4" aria-hidden /> Мой профиль
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-surface-2"
            >
              <Settings className="h-4 w-4" aria-hidden /> Настройки
            </Link>
            {isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-surface-2"
              >
                <Shield className="h-4 w-4" aria-hidden /> Раздел администратора
              </Link>
            ) : null}
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await signOut();
                await navigate({ to: "/auth", replace: true });
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-surface-2 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Выйти
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
