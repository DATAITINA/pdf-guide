import { parseSettings, parseStringList, parseToc } from "./json";
import {
  DEFAULT_SETTINGS,
  type Category,
  type Faq,
  type OrderRow,
  type ProductCard,
  type ProductDetail,
  type StoreSettings,
  type Testimonial,
} from "./types";

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  short_description: string;
  full_description?: string;
  price_kobo: number | string;
  currency: string;
  category_id: string;
  cover_image: string;
  pages: number | null;
  featured: boolean;
  is_placeholder: boolean;
  category_name?: string;
  category_slug?: string;
  benefits?: unknown;
  table_of_contents?: unknown;
  learnings?: unknown;
  audience?: string;
  included?: unknown;
  tags?: unknown;
  seo_title?: string | null;
  seo_description?: string | null;
  published?: boolean;
  archived?: boolean;
  has_pdf?: boolean | number;
  created_at?: string;
  updated_at?: string;
};

export function mapCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

export function mapCard(row: ProductRow): ProductCard {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle ?? "",
    shortDescription: row.short_description,
    priceKobo: Number(row.price_kobo),
    currency: row.currency,
    coverImage: row.cover_image,
    categoryId: row.category_id,
    categoryName: row.category_name ?? "",
    categorySlug: row.category_slug ?? "",
    pages: row.pages == null ? null : Number(row.pages),
    featured: Boolean(row.featured),
    isPlaceholder: Boolean(row.is_placeholder),
  };
}

export function mapDetail(row: ProductRow): ProductDetail {
  return {
    ...mapCard(row),
    fullDescription: row.full_description ?? "",
    benefits: parseStringList(row.benefits),
    tableOfContents: parseToc(row.table_of_contents),
    learnings: parseStringList(row.learnings),
    audience: row.audience ?? "",
    included: parseStringList(row.included),
    tags: parseStringList(row.tags),
    seoTitle: row.seo_title ?? null,
    seoDescription: row.seo_description ?? null,
    published: Boolean(row.published),
    archived: Boolean(row.archived),
    hasPdf: Boolean(row.has_pdf),
  };
}

export function mapFaq(row: {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
}): Faq {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    published: Boolean(row.published),
  };
}

export function mapTestimonial(row: {
  id: string;
  quote: string;
  attribution: string;
  is_placeholder: boolean;
  sort_order: number;
  published: boolean;
}): Testimonial {
  return {
    id: row.id,
    quote: row.quote,
    attribution: row.attribution,
    isPlaceholder: Boolean(row.is_placeholder),
    sortOrder: row.sort_order,
    published: Boolean(row.published),
  };
}

export function mapSettings(value: unknown): StoreSettings {
  const raw = parseSettings(value);
  return {
    storeName: String(raw.storeName ?? DEFAULT_SETTINGS.storeName),
    tagline: String(raw.tagline ?? DEFAULT_SETTINGS.tagline),
    supportEmail: String(raw.supportEmail ?? DEFAULT_SETTINGS.supportEmail),
    contactPhone: String(raw.contactPhone ?? ""),
    whatsapp: String(raw.whatsapp ?? ""),
    currency: String(raw.currency ?? "NGN"),
    bankName: String(raw.bankName ?? ""),
    accountName: String(raw.accountName ?? ""),
    accountNumber: String(raw.accountNumber ?? ""),
    instagram: String(raw.instagram ?? ""),
    twitter: String(raw.twitter ?? ""),
    facebook: String(raw.facebook ?? ""),
    refundSummary: String(raw.refundSummary ?? DEFAULT_SETTINGS.refundSummary),
  };
}

export function mapOrder(row: {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  product_id: string;
  product_title: string;
  amount_kobo: number | string;
  currency: string;
  payment_method: string;
  payment_reference: string;
  paystack_reference?: string | null;
  status: string;
  transfer_note: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  has_proof?: boolean | number;
  download_count?: number | string;
  paid_at: string | null;
  created_at: string;
}): OrderRow {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    productId: row.product_id,
    productTitle: row.product_title,
    amountKobo: Number(row.amount_kobo),
    currency: row.currency,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    gatewayReference: row.paystack_reference ?? null,
    status: row.status,
    transferNote: row.transfer_note,
    adminNotes: row.admin_notes,
    rejectionReason: row.rejection_reason,
    hasProof: Boolean(row.has_proof),
    downloadCount: Number(row.download_count ?? 0),
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}
