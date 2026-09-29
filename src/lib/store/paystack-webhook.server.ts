import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { hmacSha512, newId, safeEqual } from "./ids";
import { fulfillPaidOrder } from "./fulfill.server";

/**
 * Server-only Paystack webhook handler.
 * Must not live in payments.ts — that module is imported by client routes
 * (createServerFn stubs), and TanStack's import-protection plugin rejects
 * bare env() / secret usage outside createServerFn handlers.
 */
export async function processPaystackWebhook(
  rawBody: string,
  signature: string | null,
): Promise<void> {
  const secret = env("PAYSTACK_SECRET_KEY");
  if (!secret) throw new Error("Paystack is not configured.");
  if (!signature || !safeEqual(hmacSha512(secret, rawBody), signature)) {
    throw new Error("Invalid webhook signature");
  }
  const payload = JSON.parse(rawBody) as {
    event?: string;
    data?: {
      reference?: string;
      status?: string;
      amount?: number;
      currency?: string;
      id?: number;
    };
  };
  const eventKey = `${payload.event ?? "event"}:${payload.data?.id ?? payload.data?.reference ?? newId()}`;
  const sql = await getSql();
  try {
    await sql`insert into webhook_events (id, provider, event_key) values (${newId("wh")}, ${"paystack"}, ${eventKey})`;
  } catch {
    return;
  }
  if (
    payload.event !== "charge.success" ||
    payload.data?.status !== "success" ||
    !payload.data.reference
  ) {
    return;
  }
  const orders = await sql.query<{ id: string; amount_kobo: number; currency: string }>(
    `select id, amount_kobo, currency from orders
     where payment_reference = $1 or paystack_reference = $1 limit 1`,
    [payload.data.reference],
  );
  const order = orders[0];
  if (!order) return;
  if (Number(order.amount_kobo) !== Number(payload.data.amount)) return;
  if (order.currency !== payload.data.currency) return;
  await fulfillPaidOrder(order.id, env("APP_URL"));
}
