import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "./ids";
import {
  normalizeNigerianWhatsapp,
  REQUEST_MAX_LENGTH,
  VOUCHER_ACTIVE_DAYS,
  VOUCHER_ALPHABET,
  VOUCHER_DISCOUNT_KOBO,
} from "./waitlist-config";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function normalizeTopicName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s+-]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, REQUEST_MAX_LENGTH);
}

export function generateVoucherCode(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += VOUCHER_ALPHABET[bytes[i]! % VOUCHER_ALPHABET.length];
  }
  return `FN-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

function sanitizeTopicDisplay(raw: string): string {
  return raw
    .trim()
    .replace(/[<>"'`]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, REQUEST_MAX_LENGTH);
}

const joinSchema = z.object({
  topic: z.string().trim().min(2).max(REQUEST_MAX_LENGTH),
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  whatsapp: z
    .string()
    .trim()
    .max(40)
    .refine((v) => normalizeNigerianWhatsapp(v) !== null, "Enter a Nigerian WhatsApp number, like 0803 123 4567."),
  consent: z.literal(true),
  honeypot: z.string().max(0).optional().or(z.literal("")),
  clientIp: z.string().max(80).optional(),
});

export const joinWaitlist = createServerFn({ method: "POST" })
  .validator(joinSchema)
  .handler(async ({ data }) => {
    if (data.honeypot) {
      return { ok: true as const, duplicate: false, code: "FN-XXXX-XXXX", position: 1, topicName: "Thanks" };
    }
    const ip = data.clientIp || "unknown";
    if (!rateLimit(`waitlist:${ip}`, 8, 60_000)) {
      throw new Error("Too many attempts. Please wait a minute and try again.");
    }

    const displayName = sanitizeTopicDisplay(data.topic);
    const normalized = normalizeTopicName(displayName);
    if (normalized.length < 2) throw new Error("Please tell us what you need help with.");

    const number = normalizeNigerianWhatsapp(data.whatsapp)!;
    const realEmail = data.email?.trim().toLowerCase() || null;
    // waitlist_entries.email is NOT NULL and unique per topic, and there is no
    // name column. Without changing the schema: people who skip email are keyed
    // by their WhatsApp number, and the optional name rides along with it.
    const email = realEmail ?? `whatsapp:${number}`;
    const name = data.name ? sanitizeTopicDisplay(data.name).slice(0, 80) : "";
    const whatsapp = name ? `${number} (${name})` : number;
    const sql = await getSql();

    let topics = await sql.query<{ id: string; name: string; status: string }>(
      `select id, name, status from waitlist_topics where normalized_name = $1 limit 1`,
      [normalized],
    );
    let topic = topics[0];
    if (!topic) {
      const topicId = newId("top");
      await sql.query(
        `insert into waitlist_topics (id, name, normalized_name, status)
         values ($1, $2, $3, 'requested')
         on conflict (normalized_name) do nothing`,
        [topicId, displayName, normalized],
      );
      topics = await sql.query(`select id, name, status from waitlist_topics where normalized_name = $1 limit 1`, [
        normalized,
      ]);
      topic = topics[0]!;
    }

    const existing = await sql.query<{
      id: string;
      position: number;
      code: string;
    }>(
      `select e.id, e.position, v.code
       from waitlist_entries e
       join vouchers v on v.waitlist_entry_id = e.id
       where e.email = $1 and e.topic_id = $2
       limit 1`,
      [email, topic.id],
    );
    if (existing[0]) {
      return {
        ok: true as const,
        duplicate: true,
        code: existing[0].code,
        position: existing[0].position,
        topicName: topic.name,
      };
    }

    const countRows = await sql.query<{ cnt: number }>(
      `select count(*)::int as cnt from waitlist_entries where topic_id = $1`,
      [topic.id],
    );
    const position = Number(countRows[0]?.cnt ?? 0) + 1;
    const entryId = newId("wle");
    const voucherId = newId("vch");
    let code = generateVoucherCode();

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await sql.query(
          `insert into waitlist_entries (id, topic_id, email, whatsapp, consent_at, position)
           values ($1, $2, $3, $4, now(), $5)`,
          [entryId, topic.id, email, whatsapp, position],
        );
        await sql.query(
          `insert into vouchers (id, code, waitlist_entry_id, topic_id, discount_kobo, status)
           values ($1, $2, $3, $4, $5, 'reserved')`,
          [voucherId, code, entryId, topic.id, VOUCHER_DISCOUNT_KOBO],
        );
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("waitlist_entries") && msg.includes("unique")) {
          const again = await sql.query<{ position: number; code: string }>(
            `select e.position, v.code from waitlist_entries e
             join vouchers v on v.waitlist_entry_id = e.id
             where e.email = $1 and e.topic_id = $2 limit 1`,
            [email, topic.id],
          );
          if (again[0]) {
            return {
              ok: true as const,
              duplicate: true,
              code: again[0].code,
              position: again[0].position,
              topicName: topic.name,
            };
          }
        }
        if (msg.includes("vouchers") && msg.includes("unique")) {
          code = generateVoucherCode();
          continue;
        }
        throw err;
      }
    }

    if (realEmail) {
      try {
        const { sendWaitlistConfirmEmail } = await import("./email.server");
        await sendWaitlistConfirmEmail({ to: realEmail, topicName: topic.name });
      } catch {
        /* email is best-effort */
      }
    }

    return {
      ok: true as const,
      duplicate: false,
      code,
      position,
      topicName: topic.name,
    };
  });

const validateSchema = z.object({
  code: z.string().trim().min(6).max(24),
  productId: z.string().min(1),
});

export const validateVoucher = createServerFn({ method: "POST" })
  .validator(validateSchema)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const code = data.code.trim().toUpperCase();
    const rows = await sql.query<{
      id: string;
      status: string;
      discount_kobo: number;
      product_id: string | null;
      expires_at: string | null;
      topic_name: string;
    }>(
      `select v.id, v.status, v.discount_kobo, v.product_id, v.expires_at, t.name as topic_name
       from vouchers v
       join waitlist_topics t on t.id = v.topic_id
       where upper(v.code) = $1
       limit 1`,
      [code],
    );
    const v = rows[0];
    if (!v) {
      return { ok: false as const, message: "That code is not valid." };
    }
    if (v.status === "reserved") {
      return {
        ok: false as const,
        message: "This code unlocks when your guide launches.",
      };
    }
    if (v.status === "redeemed") {
      return { ok: false as const, message: "This code has already been used." };
    }
    if (v.status === "expired" || (v.expires_at && new Date(v.expires_at) < new Date())) {
      return { ok: false as const, message: "This code has expired." };
    }
    if (v.status !== "active") {
      return { ok: false as const, message: "This code cannot be used right now." };
    }
    if (!v.product_id || v.product_id !== data.productId) {
      return {
        ok: false as const,
        message: "This code is for a different guide.",
      };
    }

    const products = await sql.query<{ price_kobo: number; currency: string }>(
      `select price_kobo, currency from products where id = $1 limit 1`,
      [data.productId],
    );
    const product = products[0];
    if (!product) return { ok: false as const, message: "Guide not found." };

    const discount = Math.min(Number(v.discount_kobo), Number(product.price_kobo));
    const finalKobo = Math.max(0, Number(product.price_kobo) - discount);

    return {
      ok: true as const,
      voucherId: v.id,
      code,
      discountKobo: discount,
      originalKobo: Number(product.price_kobo),
      finalKobo,
      currency: product.currency,
      topicName: v.topic_name,
    };
  });

export async function redeemVoucherForOrder(orderId: string, voucherId: string | null): Promise<void> {
  if (!voucherId) return;
  const sql = await getSql();
  const updated = await sql.query<{ id: string }>(
    `update vouchers
     set status = 'redeemed',
         redeemed_at = now(),
         redeemed_order_id = $1
     where id = $2
       and status = 'active'
       and (expires_at is null or expires_at > now())
       and redeemed_order_id is null
     returning id`,
    [orderId, voucherId],
  );
  if (!updated[0]) {
    // Order may have been created with a discount; do not fail fulfillment if race lost
    // but log nothing client-side.
  }
}

const launchSchema = z.object({
  topicId: z.string().min(1),
  productId: z.string().min(1),
  dryRun: z.boolean().optional(),
  adminSecret: z.string().optional(),
});

export const launchTopic = createServerFn({ method: "POST" })
  .validator(launchSchema)
  .handler(async ({ data }) => {
    await assertAdmin(data.adminSecret);
    const sql = await getSql();
    const topics = await sql.query<{ id: string; name: string; status: string }>(
      `select id, name, status from waitlist_topics where id = $1 limit 1`,
      [data.topicId],
    );
    const topic = topics[0];
    if (!topic) throw new Error("Topic not found.");

    const products = await sql.query<{ id: string; title: string; slug: string; published: boolean }>(
      `select id, title, slug, published from products where id = $1 limit 1`,
      [data.productId],
    );
    const product = products[0];
    if (!product) throw new Error("Product not found.");

    const recipients = await sql.query<{ email: string; code: string }>(
      `select e.email, v.code
       from waitlist_entries e
       join vouchers v on v.waitlist_entry_id = e.id
       where e.topic_id = $1 and v.status in ('reserved', 'active')`,
      [topic.id],
    );

    if (data.dryRun) {
      return {
        dryRun: true as const,
        topicName: topic.name,
        productTitle: product.title,
        wouldEmail: recipients.length,
        emails: recipients.map((r) => r.email),
      };
    }

    await sql.query(
      `update waitlist_topics set status = 'launched', product_id = $1 where id = $2`,
      [product.id, topic.id],
    );
    await sql.query(
      `update vouchers
       set status = 'active',
           product_id = $1,
           activated_at = now(),
           expires_at = now() + ($2 || ' days')::interval
       where topic_id = $3 and status = 'reserved'`,
      [product.id, String(VOUCHER_ACTIVE_DAYS), topic.id],
    );

    const { sendWaitlistLaunchEmail } = await import("./email.server");
    const { appBaseUrl } = await import("./fulfill.server");
    const base = appBaseUrl();
    let emailed = 0;
    for (const r of recipients) {
      const checkoutUrl = base
        ? `${base}/checkout/${product.slug}?code=${encodeURIComponent(r.code)}`
        : `/checkout/${product.slug}?code=${encodeURIComponent(r.code)}`;
      const ok = await sendWaitlistLaunchEmail({
        to: r.email,
        topicName: topic.name,
        productTitle: product.title,
        code: r.code,
        expiresInDays: VOUCHER_ACTIVE_DAYS,
        checkoutUrl,
      });
      if (ok) emailed += 1;
    }

    return {
      dryRun: false as const,
      topicName: topic.name,
      productTitle: product.title,
      activated: recipients.length,
      emailed,
    };
  });

export const listAdminWaitlist = createServerFn({ method: "GET" })
  .validator(z.object({ adminSecret: z.string().optional() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminSecret);
    const sql = await getSql();
    const topics = await sql.query<{
      id: string;
      name: string;
      status: string;
      product_id: string | null;
      created_at: string;
      cnt: number;
    }>(
      `select t.id, t.name, t.status, t.product_id, t.created_at, count(e.id)::int as cnt
       from waitlist_topics t
       left join waitlist_entries e on e.topic_id = t.id
       group by t.id
       order by cnt desc, t.created_at desc`,
    );
    const products = await sql.query<{ id: string; title: string; slug: string }>(
      `select id, title, slug from products where published = true and archived = false and is_placeholder = false order by title`,
    );
    return {
      topics: topics.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        productId: t.product_id,
        createdAt: t.created_at,
        count: Number(t.cnt),
      })),
      products: products.map((p) => ({ id: p.id, title: p.title, slug: p.slug })),
    };
  });

export const exportWaitlistCsv = createServerFn({ method: "POST" })
  .validator(z.object({ topicId: z.string().min(1), adminSecret: z.string().optional() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminSecret);
    const sql = await getSql();
    const rows = await sql.query<{
      email: string;
      whatsapp: string | null;
      position: number;
      code: string;
      status: string;
      created_at: string;
    }>(
      `select e.email, e.whatsapp, e.position, v.code, v.status, e.created_at::text
       from waitlist_entries e
       join vouchers v on v.waitlist_entry_id = e.id
       where e.topic_id = $1
       order by e.position asc`,
      [data.topicId],
    );
    const header = "email,whatsapp,position,code,voucher_status,joined_at\n";
    const body = rows
      .map((r) =>
        [r.email, r.whatsapp ?? "", r.position, r.code, r.status, r.created_at]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    return { csv: header + body };
  });

export const mergeTopics = createServerFn({ method: "POST" })
  .validator(
    z.object({
      sourceTopicId: z.string().min(1),
      targetTopicId: z.string().min(1),
      adminSecret: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminSecret);
    if (data.sourceTopicId === data.targetTopicId) throw new Error("Pick two different topics.");
    const sql = await getSql();

    // Move vouchers first, then entries; drop conflicting email+topic pairs on source
    const sourceEntries = await sql.query<{ id: string; email: string }>(
      `select id, email from waitlist_entries where topic_id = $1`,
      [data.sourceTopicId],
    );
    for (const entry of sourceEntries) {
      const clash = await sql.query<{ id: string }>(
        `select id from waitlist_entries where topic_id = $1 and email = $2 limit 1`,
        [data.targetTopicId, entry.email],
      );
      if (clash[0]) {
        await sql.query(`delete from vouchers where waitlist_entry_id = $1`, [entry.id]);
        await sql.query(`delete from waitlist_entries where id = $1`, [entry.id]);
      } else {
        await sql.query(`update vouchers set topic_id = $1 where waitlist_entry_id = $2`, [
          data.targetTopicId,
          entry.id,
        ]);
        await sql.query(`update waitlist_entries set topic_id = $1 where id = $2`, [
          data.targetTopicId,
          entry.id,
        ]);
      }
    }
    await sql.query(`delete from waitlist_topics where id = $1`, [data.sourceTopicId]);

    // Recompute positions on target
    const remaining = await sql.query<{ id: string }>(
      `select id from waitlist_entries where topic_id = $1 order by created_at asc`,
      [data.targetTopicId],
    );
    for (let i = 0; i < remaining.length; i++) {
      await sql.query(`update waitlist_entries set position = $1 where id = $2`, [i + 1, remaining[i]!.id]);
    }
    return { ok: true as const, moved: sourceEntries.length };
  });

export const setTopicBuilding = createServerFn({ method: "POST" })
  .validator(z.object({ topicId: z.string().min(1), adminSecret: z.string().optional() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminSecret);
    const sql = await getSql();
    await sql.query(`update waitlist_topics set status = 'building' where id = $1 and status = 'requested'`, [
      data.topicId,
    ]);
    return { ok: true as const };
  });

async function assertAdmin(adminSecret?: string) {
  const secret = env("WAITLIST_ADMIN_SECRET") || env("ADMIN_SECRET");
  if (secret && adminSecret && adminSecret === secret) return;
  // Fall through to session-based admin when secret not provided
  try {
    const { auth } = await import("@/lib/auth/server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const session = await auth.api.getSession({ headers: getRequest().headers });
    if (!session?.user?.id) throw new Error("Unauthorized");
    const sql = await getSql();
    const admins = await sql.query(`select user_id from store_admins where user_id = $1 limit 1`, [
      session.user.id,
    ]);
    if (!admins[0]) throw new Error("Unauthorized");
  } catch {
    if (secret && adminSecret === secret) return;
    throw new Error("Unauthorized");
  }
}
