import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/lib/auth";
import { useSignedUrl } from "@/lib/storage";

export function PlayersPanel() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Profile[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(8);
      if (!active) return;
      setPlayers((data ?? []) as Profile[]);
      setLoaded(true);
    };
    void load();
    const t = setInterval(() => void load(), 60000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [user?.id]);

  const others = players.filter((p) => p.id !== user?.id);

  return (
    <div className="mx-6 mt-7 border-t border-border/70 pt-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Игроки
        </p>
        {others.length > 0 ? (
          <span className="text-[11px] text-muted-foreground">{others.length}</span>
        ) : null}
      </div>

      {others.length === 0 ? (
        <p className="text-xs leading-snug text-muted-foreground">
          {loaded
            ? "Других игроков пока нет — здесь появятся те, кто зарегистрируется на Nebula."
            : "Загружаем список игроков…"}
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {others.map((player) => (
            <PlayerRow key={player.id} player={player} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PlayerRow({ player }: { player: Profile }) {
  const avatarUrl = useSignedUrl("avatars", player.avatar_url);
  const name = player.display_name || "Игрок";

  return (
    <li>
      <Link
        to="/players/$userId"
        params={{ userId: player.id }}
        className="flex items-center justify-end gap-3 rounded-full py-0.5 pl-2 pr-1 transition-colors hover:bg-surface-2"
      >
        <span className="min-w-0 text-right">
          <span className="block truncate text-sm font-semibold leading-tight">{name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            Уровень {player.level}
          </span>
        </span>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Аватар ${name}`}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </Link>
    </li>
  );
}
