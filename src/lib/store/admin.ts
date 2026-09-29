import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSessionUser } from "@/lib/auth/verify.server";
import { newId } from "./ids";
import { slugify } from "./slug";
import { ensureSeeded } from "./seed";
import { fulfillPaidOrder } from "./fulfill";
import { mapCard, mapDetail, mapFaq, mapOrder, mapSettings, mapTestimonial } from "./map";
import { DEFAULT_SETTINGS, ORDER_STATUS } from "./types";
import { nairaToKobo } from "./money";

class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

async function requireStoreAdmin(userId: string, bearerToken?: string) {
  await ensureSeeded();
  const sql = await getSql();
  const admins = await sql<{ user_id: string }>`select user_id from store_admins`;
  if (admins.length === 0) {
    const session = await getSessionUser(bearerToken);
    await sql`insert into store_admins (user_id, email) values (${userId}, ${session?.email ?? null})`;
    return;
  }
  if (!admins.some((row) => row.user_id === userId)) {
    throw new ForbiddenError();
  }
}

const PRODUCT_SELECT = `
  p.id, p.title, p.slug, p.subtitle, p.short_description, p.full_description,
  p.price_kobo, p.currency, p.category_id, p.cover_image, p.pages,
  p.benefits, p.table_of_contents, p.learnings, p.audience, p.included, p.tags,
  p.featured, p.published, p.archived, p.is_placeholder,
  p.seo_title, p.seo_description, p.created_at, p.updated_at,
  c.name as category_name, c.slug as category_slug,
  exists(select 1 from product_files f where f.product_id = p.id) as has_pdf
`;

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    const revenue = await sql<{ n: number }>`
      select coalesce(sum(amount_kobo),0)::int as n from orders where status = 'paid'`;
    const sales = await sql<{ n: number }>`select count(*)::int as n from orders where status = 'paid'`;
    const totalOrders = await sql<{ n: number }>`select count(*)::int as n from orders`;
    const pending = await sql<{ n: number }>`
      select count(*)::int as n from orders where status = 'pending_verification'`;
    const best = await sql.query<{ title: string; n: number }>(
      `select p.title, count(*)::int as n
       from orders o join products p on p.id = o.product_id
       where o.status = 'paid'
       group by p.title order by n desc limit 5`,
    );
    const recent = (
      await sql.query<Parameters<typeof mapOrder>[0]>(
        `select o.*, p.title as product_title,
                exists(select 1 from transfer_proofs t where t.order_id = o.id) as has_proof,
                coalesce((select sum(download_count) from download_tokens d where d.order_id = o.id),0) as download_count
         from orders o join products p on p.id = o.product_id
         order by o.created_at desc limit 8`,
      )
    ).map(mapOrder);
    const downloads = await sql<{ n: number }>`select count(*)::int as n from download_events`;
    return {
      revenueKobo: Number(revenue[0]?.n ?? 0),
      paidOrders: Number(sales[0]?.n ?? 0),
      totalOrders: Number(totalOrders[0]?.n ?? 0),
      pendingTransfers: Number(pending[0]?.n ?? 0),
      downloads: Number(downloads[0]?.n ?? 0),
      bestSellers: best,
      recent,
    };
  });

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    const categories = await sql<{ id: string; name: string; slug: string }>`
      select id, name, slug from categories order by sort_order`;
    const products = (
      await sql.query<Parameters<typeof mapDetail>[0]>(
        `select ${PRODUCT_SELECT} from products p
         join categories c on c.id = p.category_id
         order by p.created_at desc`,
      )
    ).map(mapDetail);
    return { categories, products };
  });

export const getAdminProduct = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    const categories = await sql<{ id: string; name: string; slug: string }>`
      select id, name, slug from categories order by sort_order`;
    if (data.id === "new") return { categories, product: null };
    const rows = await sql.query<Parameters<typeof mapDetail>[0]>(
      `select ${PRODUCT_SELECT} from products p
       join categories c on c.id = p.category_id
       where p.id = $1`,
      [data.id],
    );
    return { categories, product: rows[0] ? mapDetail(rows[0]) : null };
  });

const productInput = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).max(180),
  slug: z.string().trim().optional(),
  subtitle: z.string().trim().max(240).optional(),
  shortDescription: z.string().trim().min(8).max(400),
  fullDescription: z.string().trim().max(8000).optional(),
  priceNaira: z.number().positive(),
  categoryId: z.string(),
  pages: z.number().int().positive().optional(),
  benefits: z.array(z.string()).optional(),
  tableOfContents: z.array(z.object({ title: z.string(), children: z.array(z.string()).optional() })).optional(),
  learnings: z.array(z.string()).optional(),
  audience: z.string().optional(),
  included: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  archived: z.boolean().optional(),
  isPlaceholder: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  coverDataUrl: z.string().optional(),
  pdfName: z.string().optional(),
  pdfBase64: z.string().optional(),
});

export const saveAdminProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(productInput)
  .handler(async ({ context, data }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    const id = data.id && data.id !== "new" ? data.id : newId("prod");
    const slug = slugify(data.slug || data.title);
    const existing = await sql<{ id: string }>`select id from products where id = ${id}`;
    const payload = [
      id,
      data.title,
      slug,
      data.subtitle ?? "",
      data.shortDescription,
      data.fullDescription ?? "",
      nairaToKobo(data.priceNaira),
      "NGN",
      data.categoryId,
      data.pages ?? null,
      JSON.stringify(data.benefits ?? []),
      JSON.stringify(data.tableOfContents ?? []),
      JSON.stringify(data.learnings ?? []),
      data.audience ?? "",
      JSON.stringify(data.included ?? []),
      JSON.stringify(data.tags ?? []),
      Boolean(data.featured),
      Boolean(data.published),
      Boolean(data.archived),
      Boolean(data.isPlaceholder),
      data.seoTitle || data.title,
      data.seoDescription || data.shortDescription,
    ];

    if (existing[0]) {
      await sql.query(
        `update products set
          title=$2, slug=$3, subtitle=$4, short_description=$5, full_description=$6,
          price_kobo=$7, currency=$8, category_id=$9, pages=$10,
          benefits=$11::jsonb, table_of_contents=$12::jsonb, learnings=$13::jsonb,
          audience=$14, included=$15::jsonb, tags=$16::jsonb,
          featured=$17, published=$18, archived=$19, is_placeholder=$20,
          seo_title=$21, seo_description=$22, updated_at=now()
         where id=$1`,
        payload,
      );
    } else {
      await sql.query(
        `insert into products (
          id, title, slug, subtitle, short_description, full_description,
          price_kobo, currency, category_id, cover_image, pages,
          benefits, table_of_contents, learnings, audience, included, tags,
          featured, published, archived, is_placeholder, seo_title, seo_description
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,'',$10,$11::jsonb,$12::jsonb,$13::jsonb,$14,$15::jsonb,$16::jsonb,
          $17,$18,$19,$20,$21,$22
        )`,
        payload,
      );
    }

    if (data.coverDataUrl?.startsWith("data:")) {
      const match = /^data:([^;]+);base64,(.+)$/.exec(data.coverDataUrl);
      if (match) {
        const buf = Buffer.from(match[2], "base64");
        await sql.query(
          `insert into product_covers (product_id, mime, data)
           values ($1,$2,$3)
           on conflict (product_id) do update set mime=excluded.mime, data=excluded.data, updated_at=now()`,
          [id, match[1], buf],
        );
        await sql`update products set cover_image = ${`/api/covers/${id}`} where id = ${id}`;
      }
    }

    if (data.pdfBase64 && data.pdfName) {
      const buf = Buffer.from(data.pdfBase64, "base64");
      await sql.query(
        `insert into product_files (product_id, filename, mime, data, byte_size)
         values ($1,$2,'application/pdf',$3,$4)
         on conflict (product_id) do update set filename=excluded.filename, data=excluded.data, byte_size=excluded.byte_size, updated_at=now()`,
        [id, data.pdfName, buf, buf.length],
      );
    }

    return { id, slug };
  });

export const deleteAdminProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    await sql`delete from products where id = ${data.id}`;
    return { ok: true };
  });

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ status: z.string().optional() }))
  .handler(async ({ context, data }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    const params: unknown[] = [];
    let where = "true";
    if (data.status) {
      params.push(data.status);
      where = `o.status = $${params.length}`;
    }
    const orders = (
      await sql.query<Parameters<typeof mapOrder>[0]>(
        `select o.*, p.title as product_title,
                exists(select 1 from transfer_proofs t where t.order_id = o.id) as has_proof,
                coalesce((select sum(download_count) from download_tokens d where d.order_id = o.id),0) as download_count
         from orders o join products p on p.id = o.product_id
         where ${where}
         order by o.created_at desc
         limit 200`,
        params,
      )
    ).map(mapOrder);
    return { orders };
  });

export const reviewTransfer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      orderId: z.string(),
      action: z.enum(["approve", "reject"]),
      notes: z.string().optional(),
      origin: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    const orders = await sql.query<{ id: string; status: string }>(
      `select id, status from orders where id = $1`,
      [data.orderId],
    );
    if (!orders[0]) throw new Error("Order not found");
    if (data.action === "reject") {
      await sql`update orders
        set status = ${ORDER_STATUS.rejected},
            admin_notes = ${data.notes || null},
            rejection_reason = ${data.notes || "Transfer could not be confirmed."},
            updated_at = now()
        where id = ${data.orderId}`;
      return { ok: true, downloadPath: null as string | null };
    }
    await sql`update orders set admin_notes = ${data.notes || null}, updated_at = now() where id = ${data.orderId}`;
    const fulfilled = await fulfillPaidOrder(data.orderId, data.origin);
    return { ok: true, downloadPath: fulfilled.downloadPath };
  });

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    const settingsRow = await sql<{ value: unknown }>`select value from settings where key = 'store'`;
    const faqs = (
      await sql<{
        id: string;
        question: string;
        answer: string;
        sort_order: number;
        published: boolean;
      }>`select * from faqs order by sort_order`
    ).map(mapFaq);
    const testimonials = (
      await sql<{
        id: string;
        quote: string;
        attribution: string;
        is_placeholder: boolean;
        sort_order: number;
        published: boolean;
      }>`select * from testimonials order by sort_order`
    ).map(mapTestimonial);
    return {
      settings: settingsRow[0] ? mapSettings(settingsRow[0].value) : DEFAULT_SETTINGS,
      faqs,
      testimonials,
    };
  });

export const saveAdminSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      settings: z.object({
        storeName: z.string().min(1).max(80),
        tagline: z.string().max(160),
        supportEmail: z.string().max(160),
        contactPhone: z.string().max(40),
        whatsapp: z.string().max(40),
        currency: z.string().max(8),
        bankName: z.string().max(80),
        accountName: z.string().max(80),
        accountNumber: z.string().max(20),
        instagram: z.string().max(80),
        twitter: z.string().max(80),
        facebook: z.string().max(120),
        refundSummary: z.string().max(800),
      }),
      faqs: z.array(
        z.object({
          id: z.string().optional(),
          question: z.string(),
          answer: z.string(),
          published: z.boolean(),
        }),
      ),
      testimonials: z.array(
        z.object({
          id: z.string().optional(),
          quote: z.string(),
          attribution: z.string(),
          isPlaceholder: z.boolean(),
          published: z.boolean(),
        }),
      ),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireStoreAdmin(context.userId);
    const sql = await getSql();
    await sql.query(
      `insert into settings (key, value) values ('store', $1::jsonb)
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [JSON.stringify(data.settings)],
    );
    await sql`delete from faqs`;
    let i = 0;
    for (const faq of data.faqs) {
      i += 1;
      await sql`insert into faqs (id, question, answer, sort_order, published)
        values (${faq.id || newId("faq")}, ${faq.question}, ${faq.answer}, ${i}, ${faq.published})`;
    }
    await sql`delete from testimonials`;
    i = 0;
    for (const t of data.testimonials) {
      i += 1;
      await sql`insert into testimonials (id, quote, attribution, is_placeholder, sort_order, published)
        values (${t.id || newId("tst")}, ${t.quote}, ${t.attribution}, ${t.isPlaceholder}, ${i}, ${t.published})`;
    }
    return { ok: true };
  });

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      await requireStoreAdmin(context.userId);
      return { admin: true };
    } catch {
      return { admin: false };
    }
  });
