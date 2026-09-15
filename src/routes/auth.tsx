import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход и регистрация — Nebula" },
      { name: "description", content: "Войдите в Nebula, чтобы покупать игры, собирать библиотеку и публиковать свои проекты." },
      { property: "og:title", content: "Вход и регистрация — Nebula" },
      { property: "og:description", content: "Аккаунт Nebula: библиотека, достижения и загрузки игр." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const input =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-primary";

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) void navigate({ to: "/", replace: true });
  }, [user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (err) throw err;
        if (!data.session) {
          setNotice("Мы отправили письмо для подтверждения. Проверьте почту и перейдите по ссылке.");
        } else {
          await refresh();
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        await refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Не удалось войти через Google");
      return;
    }
    if (result.redirected) return;
    await refresh();
    void navigate({ to: "/", replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-md px-6 py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {mode === "signin" ? "Вход в Nebula" : "Регистрация в Nebula"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Библиотека, достижения, загрузки и публикация собственных игр.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-3">
        {mode === "signup" ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Никнейм"
            aria-label="Никнейм"
            className={input}
          />
        ) : null}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Почта"
          aria-label="Почта"
          className={input}
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          aria-label="Пароль"
          className={input}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {notice ? <p className="text-sm text-success">{notice}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-primary px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
        >
          {mode === "signin" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> или <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={google}
        className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-semibold hover:bg-muted"
      >
        Войти через Google
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-6 w-full text-sm text-muted-foreground hover:text-foreground"
      >
        {mode === "signin" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>
    </div>
  );
}
