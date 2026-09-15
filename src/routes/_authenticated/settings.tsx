import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Shield, ShieldCheck, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useSignedUrl } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Настройки аккаунта — Nebula" },
      { name: "description", content: "Аватар, никнейм, пароль и двухфакторная аутентификация в Nebula." },
      { property: "og:title", content: "Настройки аккаунта — Nebula" },
      { property: "og:description", content: "Управляйте профилем и безопасностью аккаунта Nebula." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const input =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-primary";
const card = "rounded-lg border border-border/70 bg-surface/70 p-5";
const primaryBtn =
  "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60";

type Factor = { id: string; status: string; friendly_name?: string | undefined };

function SettingsPage() {
  const { user, profile, isAdmin, refresh } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [showLibrary, setShowLibrary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarUrl = useSignedUrl("avatars", profile?.avatar_url);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setTagline(profile.tagline);
    setBio(profile.bio);
    setCountry(profile.country);
    setShowLibrary(profile.show_library !== false);
  }, [profile]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, tagline, bio, country, show_library: showLibrary })
      .eq("id", user.id);
    setSaving(false);
    setMsg(error ? error.message : "Профиль сохранён");
    if (!error) await refresh();
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setMsg(null);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setMsg(error.message);
      return;
    }
    await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
    await refresh();
    setMsg("Аватар обновлён");
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-6 pb-14 pt-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Настройки</h1>

      {isAdmin ? (
        <Link
          to="/admin"
          className="flex items-center justify-between rounded-lg border border-primary/50 bg-primary/10 p-5 transition-colors hover:bg-primary/15"
        >
          <span>
            <span className="block font-display text-lg font-semibold">Раздел администратора</span>
            <span className="text-sm text-muted-foreground">
              Данные платформы, магазин, публикация и управление играми
            </span>
          </span>
          <span className="text-sm font-semibold text-primary">Открыть →</span>
        </Link>
      ) : null}

      <section className={card}>
        <h2 className="font-display text-xl font-semibold">Профиль</h2>
        <div className="mt-4 flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Ваш аватар" className="h-20 w-20 rounded-lg object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-surface-2 text-2xl font-bold">
              {(profile?.display_name ?? "N").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className={primaryBtn}>
              <Upload className="mr-2 inline h-4 w-4" aria-hidden /> Загрузить аватар
            </button>
            <p className="mt-2 text-xs text-muted-foreground">PNG или JPG, до 5 МБ</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-5 space-y-3">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Никнейм" aria-label="Никнейм" className={input} />
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Короткий статус" aria-label="Короткий статус" className={input} />
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Страна" aria-label="Страна" className={input} />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="О себе" aria-label="О себе" rows={3} className={input} />
          <label className="flex items-start gap-3 rounded-md border border-border bg-surface-2/60 p-3 text-sm">
            <input
              type="checkbox"
              checked={showLibrary}
              onChange={(e) => setShowLibrary(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              Показывать мои игры в профиле
              <span className="block text-xs text-muted-foreground">
                Если выключить, другие игроки не увидят купленные вами игры.
              </span>
            </span>
          </label>
          <button type="submit" disabled={saving} className={primaryBtn}>
            Сохранить
          </button>
          {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        </form>
      </section>

      <PasswordSection />
      <TwoFactorSection />
    </div>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({
      password: next,
      ...(current ? ({ current_password: current } as { current_password: string }) : {}),
    } as Parameters<typeof supabase.auth.updateUser>[0]);
    setBusy(false);
    setMsg(error ? error.message : "Пароль обновлён");
    if (!error) {
      setCurrent("");
      setNext("");
    }
  };

  return (
    <section className={card}>
      <h2 className="font-display text-xl font-semibold">Смена пароля</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Текущий пароль" aria-label="Текущий пароль" className={input} />
        <input type="password" required minLength={6} value={next} onChange={(e) => setNext(e.target.value)} placeholder="Новый пароль" aria-label="Новый пароль" className={input} />
        <button type="submit" disabled={busy} className={primaryBtn}>
          Обновить пароль
        </button>
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </form>
    </section>
  );
}

function TwoFactorSection() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.all ?? []) as Factor[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const enroll = async () => {
    setMsg(null);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Nebula ${Date.now()}`,
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setMsg(null);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr || !challenge) {
      setMsg(cErr?.message ?? "Ошибка проверки");
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    setQr(null);
    setSecret(null);
    setFactorId(null);
    setCode("");
    setMsg("Двухфакторная аутентификация включена");
    await load();
  };

  const unenroll = async (id: string) => {
    await supabase.auth.mfa.unenroll({ factorId: id });
    await load();
  };

  const active = factors.filter((f) => f.status === "verified");

  return (
    <section className={card}>
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
        {active.length ? <ShieldCheck className="h-5 w-5 text-success" aria-hidden /> : <Shield className="h-5 w-5" aria-hidden />}
        Двухфакторная аутентификация
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Приложение-аутентификатор (Google Authenticator, 1Password и другие) будет запрашивать код при входе.
      </p>

      {active.length ? (
        <ul className="mt-4 space-y-2">
          {active.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded bg-surface-2/60 px-3 py-2 text-sm">
              <span>{f.friendly_name ?? "Аутентификатор"} · включён</span>
              <button type="button" onClick={() => void unenroll(f.id)} className="text-xs text-muted-foreground hover:text-destructive">
                Отключить
              </button>
            </li>
          ))}
        </ul>
      ) : qr ? (
        <form onSubmit={verify} className="mt-4 space-y-3">
          <img src={qr} alt="QR-код для приложения-аутентификатора" className="h-44 w-44 rounded bg-white p-2" />
          <p className="text-xs text-muted-foreground">Или введите ключ вручную: {secret}</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Код из приложения" aria-label="Код из приложения" className={input} />
          <button type="submit" className={primaryBtn}>
            Подтвердить
          </button>
        </form>
      ) : (
        <button type="button" onClick={enroll} className={`${primaryBtn} mt-4`}>
          Включить 2FA
        </button>
      )}
      {msg ? <p className="mt-3 text-sm text-muted-foreground">{msg}</p> : null}
    </section>
  );
}
