import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId, newToken } from "./ids";
import { mapSettings } from "./map";
import { emailConfigured, sendPurchaseEmail } from "./email.server";
import { DEFAULT_SETTINGS, ORDER_STATUS } from "./types";

export function appBaseUrl(requestUrl?: string): string {
  const fromEnv = env("APP_URL");
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (requestUrl) {
    try {
      const u = new URL(requestUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      /* ignore */
    }
  }
  return "";
}

export async function fulfillPaidOrder(orderId: string, requestUrl?: string) {
  const sql = await getSql();
  const orders = await sql.query<{
    id: string;
    customer_name: string;
    customer_email: string;
    product_id: string;
    amount_kobo: number;
    currency: string;
    payment_reference: string;
    status: string;
    email_sent_at: string | null;
    product_title: string;
  }>(
    `select o.*, p.title as product_title
     from orders o join products p on p.id = o.product_id
     where o.id = $1`,
    [orderId],
  );
  const order = orders[0];
  if (!order) throw new Error("Order not found");
  if (order.status === ORDER_STATUS.rejected) throw new Error("Order was rejected");

  if (order.status !== ORDER_STATUS.paid) {
    await sql`update orders set status = ${ORDER_STATUS.paid}, paid_at = now(), updated_at = now() where id = ${orderId}`;
  }

  let tokens = await sql<{ token: string; id: string }>`
    select id, token from download_tokens where order_id = ${orderId} limit 1`;
  if (!tokens[0]) {
    const token = newToken();
    const tokenId = newId("tok");
    await sql`insert into download_tokens (id, order_id, product_id, token, expires_at, max_downloads)
      values (${tokenId}, ${orderId}, ${order.product_id}, ${token}, now() + interval '90 days', 20)`;
    tokens = [{ id: tokenId, token }];
  }

  const token = tokens[0].token;
  const base = appBaseUrl(requestUrl);
  const downloadUrl = base ? `${base}/download/${token}` : `/download/${token}`;

  let emailed = Boolean(order.email_sent_at);
  if (!emailed && emailConfigured()) {
    const settingsRow = await sql<{ value: unknown }>`select value from settings where key = 'store'`;
    const settings = settingsRow[0] ? mapSettings(settingsRow[0].value) : DEFAULT_SETTINGS;
    const ok = await sendPurchaseEmail({
      settings,
      to: order.customer_email,
      name: order.customer_name,
      productTitle: order.product_title,
      amountKobo: Number(order.amount_kobo),
      currency: order.currency,
      reference: order.payment_reference,
      downloadUrl: base ? downloadUrl : `${env("APP_URL") ?? ""}${downloadUrl}`,
    });
    if (ok) {
      await sql`update orders set email_sent_at = now() where id = ${orderId}`;
      emailed = true;
    }
  }

  return {
    orderId,
    token,
    downloadPath: `/download/${token}`,
    emailed,
    productTitle: order.product_title,
    customerEmail: order.customer_email,
    customerName: order.customer_name,
    reference: order.payment_reference,
  };
}
