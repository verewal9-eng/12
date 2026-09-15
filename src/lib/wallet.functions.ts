import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { staticGames, finalPrice } from "@/lib/games";

type TopUpInput = { amount: number; returnUrl: string };

/** Создаёт платёж в ЮKassa и возвращает ссылку на оплату (карты, ЮMoney, SBP). */
export const createTopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TopUpInput) => {
    const amount = Math.round(Number(input?.amount));
    if (!Number.isFinite(amount) || amount < 50 || amount > 100000) {
      throw new Error("Сумма пополнения должна быть от 50 до 100 000 ₽");
    }
    const returnUrl = String(input?.returnUrl ?? "");
    if (!/^https?:\/\//.test(returnUrl)) throw new Error("Некорректный адрес возврата");
    return { amount, returnUrl };
  })
  .handler(async ({ data, context }): Promise<{ url: string | null; error: string | null }> => {
    const shopId = process.env["YOOKASSA_SHOP_ID"];
    const secretKey = process.env["YOOKASSA_SECRET_KEY"];
    if (!shopId || !secretKey) {
      return { url: null, error: "Платёжный сервис ещё не подключён администратором." };
    }

    const auth = btoa(`${shopId}:${secretKey}`);
    const idempotenceKey = crypto.randomUUID();

    try {
      const response = await fetch("https://api.yookassa.ru/v3/payments", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Idempotence-Key": idempotenceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: { value: data.amount.toFixed(2), currency: "RUB" },
          capture: true,
          confirmation: { type: "redirect", return_url: data.returnUrl },
          description: `Пополнение баланса Nebula на ${data.amount} ₽`,
          metadata: { user_id: context.userId },
        }),
      });

      if (!response.ok) {
        console.error("[yookassa] create payment failed", response.status, await response.text());
        return { url: null, error: "Не удалось создать платёж. Попробуйте позже." };
      }

      const payment = (await response.json()) as {
        confirmation?: { confirmation_url?: string };
      };
      const url = payment.confirmation?.confirmation_url ?? null;
      if (!url) return { url: null, error: "Платёжный сервис не вернул ссылку на оплату." };
      return { url, error: null };
    } catch (error) {
      console.error("[yookassa] network error", error);
      return { url: null, error: "Платёжный сервис недоступен. Попробуйте позже." };
    }
  });

/** Оплачивает корзину с баланса: списывает деньги и добавляет игры в библиотеку. */
export const checkoutCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ ok: boolean; error: string | null; total: number; gameIds: string[] }> => {
      const { supabase, userId } = context;

      const { data: cart } = await supabase.from("cart_items").select("game_id");
      const gameIds = (cart ?? []).map((row) => row.game_id as string);
      if (gameIds.length === 0) {
        return { ok: false, error: "Корзина пуста", total: 0, gameIds: [] };
      }

      const { data: dbGames } = await supabase
        .from("games")
        .select("id,title,price,discount")
        .in("id", gameIds);

      const prices = new Map<string, { title: string; price: number }>();
      for (const row of dbGames ?? []) {
        prices.set(row.id as string, {
          title: row.title as string,
          price: Math.round((Number(row.price) * (100 - Number(row.discount))) / 100),
        });
      }
      for (const game of staticGames) {
        if (gameIds.includes(game.id) && !prices.has(game.id)) {
          prices.set(game.id, { title: game.title, price: finalPrice(game) });
        }
      }

      const known = gameIds.filter((id) => prices.has(id));
      if (known.length === 0) {
        return { ok: false, error: "Игры из корзины больше недоступны", total: 0, gameIds: [] };
      }

      const total = known.reduce((sum, id) => sum + (prices.get(id)?.price ?? 0), 0);
      const titles = known.map((id) => prices.get(id)?.title ?? id).join(", ");

      const { data: spent, error: spendError } = await supabase.rpc("spend_balance", {
        _amount: total,
        _description: `Покупка: ${titles}`,
      });

      if (spendError) {
        console.error("[checkout] spend failed", spendError.message);
        return { ok: false, error: "Не удалось списать средства", total, gameIds: [] };
      }
      if (!spent) {
        return { ok: false, error: "Недостаточно средств на балансе", total, gameIds: [] };
      }

      await supabase.from("user_library").upsert(
        known.map((id) => ({ user_id: userId, game_id: id, status: "owned", progress: 0 })),
        { onConflict: "user_id,game_id" },
      );
      await supabase.from("cart_items").delete().in("game_id", known);
      await supabase.from("notifications").insert({
        user_id: userId,
        kind: "purchase",
        title: known.length === 1 ? "Игра куплена" : `Куплено игр: ${known.length}`,
        body: `${titles} — списано ${total.toLocaleString("ru-RU")} ₽`,
      });

      return { ok: true, error: null, total, gameIds: known };
    },
  );
