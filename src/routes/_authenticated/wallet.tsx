import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, Wallet as WalletIcon } from "lucide-react";
import { formatRub, useWallet } from "@/lib/wallet";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Баланс и пополнение — Nebula" },
      {
        name: "description",
        content: "Баланс в рублях, пополнение картой или ЮMoney и история операций Nebula.",
      },
      { property: "og:title", content: "Баланс и пополнение — Nebula" },
      {
        property: "og:description",
        content: "Пополняйте баланс банковской картой или ЮMoney и покупайте игры в один клик.",
      },
    ],
  }),
  component: WalletPage,
});

const presets = [500, 1000, 2500, 5000];

function WalletPage() {
  const { balance, transactions, topUp, loading } = useWallet();
  const [amount, setAmount] = useState(1000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onTopUp = async () => {
    setBusy(true);
    setError(null);
    const message = await topUp(amount);
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <div className="space-y-8 px-6 pb-12">
      <header>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Баланс</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Пополняйте счёт банковской картой или кошельком ЮMoney и оплачивайте игры мгновенно.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-border bg-surface-2 p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <WalletIcon className="h-5 w-5" aria-hidden />
            <span className="text-sm">Доступно</span>
          </div>
          <p className="mt-2 font-display text-4xl font-bold">
            {loading ? "…" : formatRub(balance)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2 p-6">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide">Пополнение</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((value) => (
              <button
                key={value}
                onClick={() => setAmount(value)}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                  amount === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {value.toLocaleString("ru-RU")} ₽
              </button>
            ))}
          </div>
          <label className="mt-4 block text-sm text-muted-foreground" htmlFor="amount">
            Своя сумма (от 50 до 100 000 ₽)
          </label>
          <input
            id="amount"
            type="number"
            min={50}
            max={100000}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="mt-1 w-40 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {error && <p className="mt-3 text-sm text-accent">{error}</p>}
          <button
            onClick={() => void onTopUp()}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            {busy ? "Переходим к оплате…" : "Пополнить"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Оплата проходит на защищённой странице ЮKassa: банковские карты, ЮMoney, SBP.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
          История операций
        </h2>
        <div className="mt-4 space-y-2">
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground">Операций пока нет.</p>
          )}
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {tx.description || (tx.kind === "deposit" ? "Пополнение" : "Покупка")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.created_at).toLocaleString("ru-RU")}
                </p>
              </div>
              <span
                className={`font-display text-sm font-bold ${
                  tx.kind === "deposit" ? "text-success" : "text-foreground"
                }`}
              >
                {tx.kind === "deposit" ? "+" : "−"}
                {formatRub(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
