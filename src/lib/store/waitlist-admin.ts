import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { VOUCHER_ACTIVE_DAYS } from "./waitlist-config";

class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

async function requireStoreAdmin(userId: string) {
  const { ensureSeeded } = await import("./seed");
  await ensureSeeded();
  const sql = await getSql();
  const admins = await sql<{ user_id: string }>`select user_id from store_admins`;
  if (admins.length === 0) {
    await sql`insert into store_admins (user_id, email) values (${userId}, ${null})`;
    return;
  }
  if (!admins.some((row) => row.user_id === userId)) {
    throw new ForbiddenError();
  }
}

export const listAdminWaitlist = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStoreAdmin(context.userId);
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
      `select id, title, slug from products
       where published = true and archived = false and is_placeholder = false
       order by title`,
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
  .middleware([authMiddleware])
  .validator(z.object({ topicId: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    await requireStoreAdmin(context.userId);
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
  .middleware([authMiddleware])
  .validator(z.object({ sourceTopicId: z.string().min(1), targetTopicId: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    await requireStoreAdmin(context.userId);
    if (data.sourceTopicId === data.targetTopicId) throw new Error("Pick two different topics.");
    const sql = await getSql();
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
  .middleware([authMiddleware])
  .validator(z.object({ topicId: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    await sql.query(`update waitlist_topics set status = 'building' where id = $1 and status = 'requested'`, [
      data.topicId,
    ]);
    return { ok: true as const };
  });

export const launchTopic = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      topicId: z.string().min(1),
      productId: z.string().min(1),
      dryRun: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    const topics = await sql.query<{ id: string; name: string; status: string }>(
      `select id, name, status from waitlist_topics where id = $1 limit 1`,
      [data.topicId],
    );
    const topic = topics[0];
    if (!topic) throw new Error("Topic not found.");

    const products = await sql.query<{ id: string; title: string; slug: string }>(
      `select id, title, slug from products where id = $1 limit 1`,
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

    await sql.query(`update waitlist_topics set status = 'launched', product_id = $1 where id = $2`, [
      product.id,
      topic.id,
    ]);
    await sql.query(
      `update vouchers
       set status = 'active',
           product_id = $1,
           activated_at = now(),
           expires_at = now() + make_interval(days => $2)
       where topic_id = $3 and status = 'reserved'`,
      [product.id, VOUCHER_ACTIVE_DAYS, topic.id],
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
