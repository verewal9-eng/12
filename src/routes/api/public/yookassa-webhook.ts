import { createFileRoute } from "@tanstack/react-router";

/**
 * Уведомления ЮKassa об оплате. Данные из тела запроса не принимаются на веру:
 * платёж перепроверяется напрямую через API ЮKassa.
 */
export const Route = createFileRoute("/api/public/yookassa-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const shopId = process.env["YOOKASSA_SHOP_ID"];
        const secretKey = process.env["YOOKASSA_SECRET_KEY"];
        if (!shopId || !secretKey) return new Response("not configured", { status: 503 });

        let body: { event?: string; object?: { id?: string } };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("bad request", { status: 400 });
        }

        const paymentId = body.object?.id;
        if (!paymentId || typeof paymentId !== "string") {
          return new Response("bad request", { status: 400 });
        }

        const auth = btoa(`${shopId}:${secretKey}`);
        const verifyResponse = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
          headers: { Authorization: `Basic ${auth}` },
        });
        if (!verifyResponse.ok) {
          console.error("[yookassa] verify failed", verifyResponse.status);
          return new Response("cannot verify", { status: 502 });
        }

        const payment = (await verifyResponse.json()) as {
          id: string;
          status: string;
          paid: boolean;
          amount?: { value?: string; currency?: string };
          metadata?: { user_id?: string };
        };

        if (payment.status !== "succeeded" || !payment.paid) {
          return new Response("ok");
        }

        const userId = payment.metadata?.user_id;
        const amount = Number(payment.amount?.value ?? 0);
        if (!userId || !(amount > 0)) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.rpc("credit_wallet", {
          _user_id: userId,
          _amount: amount,
          _payment_id: payment.id,
          _description: "Пополнение через ЮKassa",
        });
        if (error) {
          console.error("[yookassa] credit failed", error.message);
          return new Response("credit failed", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
