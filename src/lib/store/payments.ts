import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "./ids";
import { ensureSeeded } from "./seed";
import { appBaseUrl, fulfillPaidOrder } from "./fulfill";
import { mapSettings } from "./map";
import { DEFAULT_SETTINGS, ORDER_STATUS } from "./types";

const checkoutSchema = z.object({
  slug: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  method: z.enum(["paystack", "bank_transfer", "demo"]),
  origin: z.string().optional(),
});

async function loadPurchasable(slug: string) {
  const sql = await getSql();
  const rows = await sql.query<{
    id: string;
    title: string;
    slug: string;
    price_kobo: number;
    currency: string;
    is_placeholder: boolean;
    published: boolean;
    archived: boolean;
    has_pdf: boolean;
  }>(
    `select p.id, p.title, p.slug, p.price_kobo, p.currency, p.is_placeholder, p.published, p.archived,
            exists(select 1 from product_files f where f.product_id = p.id) as has_pdf
     from products p where p.slug = $1 limit 1`,
    [slug],
  );
  const product = rows[0];
  if (!product || !product.published || product.archived) {
    throw new Error("This guide is not available.");
  }
  if (product.is_placeholder) {
    throw new Error("This listing is a demo placeholder and cannot be purchased.");
  }
  if (!product.has_pdf) {
    throw new Error("This guide is not ready for download yet.");
  }
  return product;
}

export const startCheckout = createServerFn({ method: "POST" })
  .validator(checkoutSchema)
  .handler(async ({ data }) => {
    await ensureSeeded();
    const product = await loadPurchasable(data.slug);
    const sql = await getSql();
    const orderId = newId("ord");
    const reference = `FN-${Date.now().toString(36)}-${newId().slice(0, 8)}`.toUpperCase();
    const method = data.method;
    const paystackReady = Boolean(env("PAYSTACK_SECRET_KEY"));

    if (method === "paystack" && !paystackReady) {
      throw new Error("Card payments are not configured yet. Use bank transfer or the test checkout.");
    }
    if (method === "demo" && paystackReady) {
      throw new Error("Test checkout is disabled when Paystack is configured.");
    }

    await sql.query(
      `insert into orders (
        id, customer_name, customer_email, customer_phone, product_id,
        amount_kobo, currency, payment_method, payment_reference, status
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        orderId,
        data.name,
        data.email.toLowerCase(),
        data.phone || null,
        product.id,
        Number(product.price_kobo),
        product.currency,
        method,
        reference,
        ORDER_STATUS.pending,
      ],
    );

    if (method === "demo") {
      const fulfilled = await fulfillPaidOrder(orderId, data.origin);
      return {
        kind: "download" as const,
        downloadPath: fulfilled.downloadPath,
        emailed: fulfilled.emailed,
        reference,
      };
    }

    if (method === "bank_transfer") {
      return {
        kind: "bank" as const,
        orderId,
        reference,
        amountKobo: Number(product.price_kobo),
        currency: product.currency,
      };
    }

    const secret = env("PAYSTACK_SECRET_KEY");
    if (!secret) throw new Error("Paystack is not configured.");
    const callbackBase = appBaseUrl(data.origin);
    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email.toLowerCase(),
        amount: Number(product.price_kobo),
        currency: product.currency,
        reference,
        callback_url: callbackBase ? `${callbackBase}/checkout/verify` : undefined,
        metadata: {
          order_id: orderId,
          product_id: product.id,
          product_slug: product.slug,
        },
      }),
    });
    const initJson = (await initRes.json()) as {
      status: boolean;
      message?: string;
      data?: { authorization_url: string; access_code: string; reference: string };
    };
    if (!initJson.status || !initJson.data?.authorization_url) {
      await sql`update orders set status = ${ORDER_STATUS.failed}, updated_at = now() where id = ${orderId}`;
      throw new Error(initJson.message || "Could not start payment.");
    }
    await sql`update orders set paystack_reference = ${initJson.data.reference}, updated_at = now() where id = ${orderId}`;
    return {
      kind: "paystack" as const,
      authorizationUrl: initJson.data.authorization_url,
      reference,
      orderId,
    };
  });

export const verifyPaystack = createServerFn({ method: "POST" })
  .validator(z.object({ reference: z.string().min(3), origin: z.string().optional() }))
  .handler(async ({ data }) => {
    const secret = env("PAYSTACK_SECRET_KEY");
    if (!secret) throw new Error("Paystack is not configured.");
    const sql = await getSql();
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const body = (await verifyRes.json()) as {
      status: boolean;
      message?: string;
      data?: {
        status: string;
        amount: number;
        currency: string;
        reference: string;
        metadata?: { order_id?: string; product_id?: string };
      };
    };
    if (!body.status || !body.data) {
      throw new Error(body.message || "Could not verify payment.");
    }
    if (body.data.status !== "success") {
      throw new Error("Payment was not successful.");
    }

    const orders = await sql.query<{
      id: string;
      product_id: string;
      amount_kobo: number;
      currency: string;
      status: string;
    }>(
      `select id, product_id, amount_kobo, currency, status from orders
       where payment_reference = $1 or paystack_reference = $1 limit 1`,
      [data.reference],
    );
    const order = orders[0];
    if (!order) throw new Error("No matching order for this payment.");
    if (Number(order.amount_kobo) !== Number(body.data.amount)) {
      throw new Error("Paid amount does not match this order.");
    }
    if (order.currency !== body.data.currency) {
      throw new Error("Payment currency does not match this order.");
    }
    if (body.data.metadata?.product_id && body.data.metadata.product_id !== order.product_id) {
      throw new Error("Payment does not match this product.");
    }

    const fulfilled = await fulfillPaidOrder(order.id, data.origin);
    return {
      downloadPath: fulfilled.downloadPath,
      emailed: fulfilled.emailed,
      reference: data.reference,
    };
  });

const transferSchema = z.object({
  orderId: z.string(),
  transferReference: z.string().trim().min(3).max(80),
  note: z.string().trim().max(500).optional(),
  proofName: z.string().min(1).max(180),
  proofMime: z.string().min(1).max(120),
  proofBase64: z.string().min(20),
});

export const submitBankTransfer = createServerFn({ method: "POST" })
  .validator(transferSchema)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const orders = await sql.query<{ id: string; status: string }>(
      `select id, status from orders where id = $1 and payment_method = 'bank_transfer' limit 1`,
      [data.orderId],
    );
    const order = orders[0];
    if (!order) throw new Error("Order not found.");
    if (order.status === ORDER_STATUS.paid) {
      throw new Error("This order is already paid.");
    }
    const raw = Buffer.from(data.proofBase64, "base64");
    if (raw.length > 6 * 1024 * 1024) throw new Error("Proof file is too large (max 6MB).");
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(data.proofMime)) throw new Error("Upload a JPG, PNG, WebP or PDF receipt.");

    await sql.query(
      `insert into transfer_proofs (order_id, filename, mime, data, byte_size)
       values ($1,$2,$3,$4,$5)
       on conflict (order_id) do update set filename = excluded.filename, mime = excluded.mime, data = excluded.data, byte_size = excluded.byte_size`,
      [data.orderId, data.proofName, data.proofMime, raw, raw.length],
    );
    await sql`update orders
      set status = ${ORDER_STATUS.pendingVerification},
          transfer_note = ${data.note || null},
          paystack_reference = ${data.transferReference},
          updated_at = now()
      where id = ${data.orderId}`;
    return { ok: true as const };
  });

export const getBankDetails = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string() }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const settingsRow = await sql<{ value: unknown }>`select value from settings where key = 'store'`;
    const settings = settingsRow[0] ? mapSettings(settingsRow[0].value) : DEFAULT_SETTINGS;
    const orders = await sql.query<{
      id: string;
      customer_name: string;
      customer_email: string;
      amount_kobo: number;
      currency: string;
      payment_reference: string;
      status: string;
      title: string;
      slug: string;
    }>(
      `select o.id, o.customer_name, o.customer_email, o.amount_kobo, o.currency, o.payment_reference, o.status,
              p.title, p.slug
       from orders o join products p on p.id = o.product_id
       where o.id = $1`,
      [data.orderId],
    );
    const order = orders[0];
    if (!order) return { settings, order: null };
    return {
      settings,
      order: {
        id: order.id,
        name: order.customer_name,
        email: order.customer_email,
        amountKobo: Number(order.amount_kobo),
        currency: order.currency,
        reference: order.payment_reference,
        status: order.status,
        title: order.title,
        slug: order.slug,
      },
    };
  });
