import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useWallet } from "@/lib/wallet";

export function NotificationsMenu() {
  const { notifications, unread, markAllRead } = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Уведомления"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) void markAllRead();
        }}
        className="relative text-foreground/90 hover:text-foreground"
      >
        <Bell className="h-[22px] w-[22px]" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-80 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl">
          <p className="border-b border-border px-4 py-3 font-display text-sm font-semibold uppercase tracking-wide">
            Уведомления
          </p>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-5 text-sm text-muted-foreground">Пока ничего нового.</p>
            )}
            {notifications.map((note) => (
              <div key={note.id} className="border-b border-border/60 px-4 py-3 last:border-0">
                <p className="text-sm font-medium">{note.title}</p>
                {note.body && <p className="text-xs text-muted-foreground">{note.body}</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(note.created_at).toLocaleString("ru-RU")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
