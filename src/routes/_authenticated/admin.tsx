import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePlatformSettings, saveFreeGiveaway } from "@/lib/platform";
import { useRemoteGames } from "@/lib/remote-games";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Админ-панель — Nebula" },
      { name: "description", content: "Управление каталогом игр: публикация, загрузка обложек и установщиков." },
      { property: "og:title", content: "Админ-панель — Nebula" },
      { property: "og:description", content: "Управление каталогом игр Nebula." },
    ],
  }),
  component: AdminPage,
});

type GameRow = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
};

function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { reload } = useRemoteGames();
  const [rows, setRows] = useState<GameRow[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [studio, setStudio] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [installer, setInstaller] = useState<File | null>(null);

  const { settings, reload: reloadSettings } = usePlatformSettings();
  const [freeEnabled, setFreeEnabled] = useState(false);
  const [freeSlug, setFreeSlug] = useState("");
  const [freeUntil, setFreeUntil] = useState("");
  const [freeMsg, setFreeMsg] = useState("");
  const [freeBusy, setFreeBusy] = useState(false);

  useEffect(() => {
    setFreeEnabled(settings.free_enabled);
    setFreeSlug(settings.free_game_slug ?? "");
    setFreeUntil(settings.free_until ? new Date(settings.free_until).toISOString().slice(0, 16) : "");
  }, [settings]);

  const saveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    setFreeBusy(true);
    setFreeMsg("");
    if (freeEnabled && !freeSlug) {
      setFreeBusy(false);
      setFreeMsg("Выберите игру для раздачи");
      return;
    }
    const err = await saveFreeGiveaway({
      free_enabled: freeEnabled,
      free_game_slug: freeEnabled ? freeSlug : null,
      free_until: freeEnabled && freeUntil ? new Date(freeUntil).toISOString() : null,
    });
    setFreeBusy(false);
    setFreeMsg(err ?? "Сохранено");
    await reloadSettings();
  };

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("games")
      .select("id,slug,title,published")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pt-10">
        <h1 className="font-display text-2xl font-semibold">Доступ только для администраторов</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-primary">
          На главную
        </Link>
      </div>
    );
  }

  const togglePublished = async (row: GameRow) => {
    await supabase.from("games").update({ published: !row.published }).eq("id", row.id);
    await load();
    await reload();
  };

  const removeGame = async (row: GameRow) => {
    await supabase.from("games").delete().eq("id", row.id);
    await load();
    await reload();
  };

  const createGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cover) {
      setMsg("Нужны обложка и заполненные поля");
      return;
    }
    setBusy(true);
    setMsg("");

    const safeSlug = slug.trim() || title.trim().toLowerCase().replace(/\s+/g, "-");
    const coverPath = `${safeSlug}/${Date.now()}-${cover.name}`;
    const up = await supabase.storage.from("game-covers").upload(coverPath, cover, { upsert: true });
    if (up.error) {
      setMsg(up.error.message);
      setBusy(false);
      return;
    }

    let installerPath: string | null = null;
    if (installer) {
      const path = `${safeSlug}/${Date.now()}-${installer.name}`;
      const res = await supabase.storage
        .from("game-installers")
        .upload(path, installer, { upsert: true });
      if (res.error) {
        setMsg(res.error.message);
        setBusy(false);
        return;
      }
      installerPath = path;
    }

    const { error } = await supabase.from("games").insert({
      slug: safeSlug,
      title: title.trim(),
      studio: studio.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      cover_url: coverPath,
      installer_url: installerPath,
      installer_name: installer?.name ?? null,
      published: true,
      publisher_id: user.id,
    });

    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }

    setTitle("");
    setSlug("");
    setStudio("");
    setDescription("");
    setPrice("0");
    setTags("");
    setCover(null);
    setInstaller(null);
    setMsg("Игра добавлена");
    await load();
    await reload();
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-6 pb-14 pt-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Раздел администратора</h1>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Каталог</h2>
        <div className="divide-y divide-border rounded-lg border border-border">
          {rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Игр пока нет.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.slug} · {row.published ? "опубликована" : "черновик"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => void togglePublished(row)}>
                    {row.published ? "Снять" : "Опубликовать"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => void removeGame(row)}>
                    Удалить
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Бесплатная раздача</h2>
        <form className="space-y-4 rounded-lg border border-border p-4" onSubmit={saveGiveaway}>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={freeEnabled}
              onChange={(e) => setFreeEnabled(e.target.checked)}
            />
            Раздача включена
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="free-game">Игра</Label>
              <select
                id="free-game"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={freeSlug}
                onChange={(e) => setFreeSlug(e.target.value)}
                disabled={!freeEnabled}
              >
                <option value="">— не выбрана —</option>
                {rows.map((row) => (
                  <option key={row.id} value={row.slug}>
                    {row.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="free-until">Раздача до</Label>
              <Input
                id="free-until"
                type="datetime-local"
                value={freeUntil}
                onChange={(e) => setFreeUntil(e.target.value)}
                disabled={!freeEnabled}
              />
            </div>
          </div>
          <Button type="submit" disabled={freeBusy}>
            {freeBusy ? "Сохранение…" : "Сохранить раздачу"}
          </Button>
          {freeMsg ? <p className="text-sm text-muted-foreground">{freeMsg}</p> : null}
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Новая игра</h2>
        <form className="space-y-4" onSubmit={createGame}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Идентификатор</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studio">Студия</Label>
              <Input id="studio" value={studio} onChange={(e) => setStudio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Цена</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Теги через запятую</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cover">Обложка</Label>
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCover(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installer">Установщик</Label>
              <Input
                id="installer"
                type="file"
                onChange={(e) => setInstaller(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Сохранение…" : "Добавить игру"}
          </Button>
          {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        </form>
      </section>
    </div>
  );
}
