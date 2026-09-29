import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { mapCard, mapCategory, mapDetail, mapFaq, mapSettings, mapTestimonial } from "./map";
import { ensureSeeded } from "./seed";
import { DEFAULT_SETTINGS } from "./types";

const PRODUCT_SELECT = `
  p.id, p.title, p.slug, p.subtitle, p.short_description, p.full_description,
  p.price_kobo, p.currency, p.category_id, p.cover_image, p.pages,
  p.benefits, p.table_of_contents, p.learnings, p.audience, p.included, p.tags,
  p.featured, p.published, p.archived, p.is_placeholder,
  p.seo_title, p.seo_description, p.created_at, p.updated_at,
  c.name as category_name, c.slug as category_slug,
  exists(select 1 from product_files f where f.product_id = p.id) as has_pdf
`;

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  const sql = await getSql();
  const settingsRow = await sql<{ value: unknown }>`select value from settings where key = 'store'`;
  const settings = settingsRow[0] ? mapSettings(settingsRow[0].value) : DEFAULT_SETTINGS;
  const categories = (
    await sql<{
      id: string;
      name: string;
      slug: string;
      description: string;
      sort_order: number;
    }>`select id, name, slug, description, sort_order from categories order by sort_order`
  ).map(mapCategory);
  const products = (
    await sql.query<Parameters<typeof mapCard>[0]>(
      `select ${PRODUCT_SELECT} from products p
       join categories c on c.id = p.category_id
       where p.published = true and p.archived = false
       order by p.featured desc, p.created_at desc`,
    )
  ).map(mapCard);
  const faqs = (
    await sql<{
      id: string;
      question: string;
      answer: string;
      sort_order: number;
      published: boolean;
    }>`select * from faqs where published = true order by sort_order`
  ).map(mapFaq);
  const testimonials = (
    await sql<{
      id: string;
      quote: string;
      attribution: string;
      is_placeholder: boolean;
      sort_order: number;
      published: boolean;
    }>`select * from testimonials where published = true order by sort_order`
  ).map(mapTestimonial);

  return {
    settings,
    categories,
    products,
    featured: products.filter((p) => p.featured),
    faqs,
    testimonials,
    payments: {
      paystackConfigured: Boolean(env("PAYSTACK_SECRET_KEY")),
      emailConfigured: Boolean(env("RESEND_API_KEY") && env("RESEND_FROM_EMAIL")),
      bankConfigured: Boolean(settings.bankName && settings.accountName && settings.accountNumber),
    },
  };
});

export const listCatalogue = createServerFn({ method: "GET" })
  .validator(
    z.object({
      q: z.string().optional(),
      category: z.string().optional(),
      sort: z.enum(["newest", "price-asc", "price-desc", "title"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const settingsRow = await sql<{ value: unknown }>`select value from settings where key = 'store'`;
    const settings = settingsRow[0] ? mapSettings(settingsRow[0].value) : DEFAULT_SETTINGS;
    const categories = (
      await sql<{
        id: string;
        name: string;
        slug: string;
        description: string;
        sort_order: number;
      }>`select id, name, slug, description, sort_order from categories order by sort_order`
    ).map(mapCategory);

    const where = ["p.published = true", "p.archived = false"];
    const params: unknown[] = [];
    if (data.category) {
      params.push(data.category);
      where.push(`c.slug = $${params.length}`);
    }
    if (data.q?.trim()) {
      params.push(`%${data.q.trim()}%`);
      const i = params.length;
      where.push(`(p.title ilike $${i} or p.short_description ilike $${i} or p.subtitle ilike $${i})`);
    }
    const order =
      data.sort === "price-asc"
        ? "p.price_kobo asc"
        : data.sort === "price-desc"
          ? "p.price_kobo desc"
          : data.sort === "title"
            ? "p.title asc"
            : "p.featured desc, p.created_at desc";

    const products = (
      await sql.query<Parameters<typeof mapCard>[0]>(
        `select ${PRODUCT_SELECT} from products p
         join categories c on c.id = p.category_id
         where ${where.join(" and ")}
         order by ${order}`,
        params,
      )
    ).map(mapCard);

    return { settings, categories, products };
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const settingsRow = await sql<{ value: unknown }>`select value from settings where key = 'store'`;
    const settings = settingsRow[0] ? mapSettings(settingsRow[0].value) : DEFAULT_SETTINGS;
    const rows = await sql.query<Parameters<typeof mapDetail>[0]>(
      `select ${PRODUCT_SELECT} from products p
       join categories c on c.id = p.category_id
       where p.slug = $1 and p.published = true and p.archived = false
       limit 1`,
      [data.slug],
    );
    const product = rows[0] ? mapDetail(rows[0]) : null;
    if (!product) return { settings, product: null, related: [], faqs: [], payments: emptyPayments() };

    const related = (
      await sql.query<Parameters<typeof mapCard>[0]>(
        `select ${PRODUCT_SELECT} from products p
         join categories c on c.id = p.category_id
         where p.published = true and p.archived = false and p.id <> $1
         order by (p.category_id = $2) desc, p.featured desc
         limit 3`,
        [product.id, product.categoryId],
      )
    ).map(mapCard);

    const faqs = (
      await sql<{
        id: string;
        question: string;
        answer: string;
        sort_order: number;
        published: boolean;
      }>`select * from faqs where published = true order by sort_order`
    ).map(mapFaq);

    return {
      settings,
      product,
      related,
      faqs,
      payments: {
        paystackConfigured: Boolean(env("PAYSTACK_SECRET_KEY")),
        emailConfigured: Boolean(env("RESEND_API_KEY") && env("RESEND_FROM_EMAIL")),
        bankConfigured: Boolean(settings.bankName && settings.accountName && settings.accountNumber),
      },
    };
  });

function emptyPayments() {
  return { paystackConfigured: false, emailConfigured: false, bankConfigured: false };
}

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  const sql = await getSql();
  const settingsRow = await sql<{ value: unknown }>`select value from settings where key = 'store'`;
  return settingsRow[0] ? mapSettings(settingsRow[0].value) : DEFAULT_SETTINGS;
});
