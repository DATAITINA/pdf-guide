export type JsonMap = Record<string, unknown>;

export type TocItem = {
  title: string;
  children?: string[];
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  supportEmail: string;
  contactPhone: string;
  whatsapp: string;
  currency: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instagram: string;
  twitter: string;
  facebook: string;
  refundSummary: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

export type ProductCard = {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  shortDescription: string;
  priceKobo: number;
  currency: string;
  coverImage: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  pages: number | null;
  featured: boolean;
  isPlaceholder: boolean;
};

export type ProductDetail = ProductCard & {
  fullDescription: string;
  benefits: string[];
  tableOfContents: TocItem[];
  learnings: string[];
  audience: string;
  included: string[];
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
  archived: boolean;
  hasPdf: boolean;
};

export type AdminProduct = ProductDetail & {
  createdAt: string;
  updatedAt: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
};

export type Testimonial = {
  id: string;
  quote: string;
  attribution: string;
  isPlaceholder: boolean;
  sortOrder: number;
  published: boolean;
};

export type OrderRow = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  productId: string;
  productTitle: string;
  amountKobo: number;
  currency: string;
  paymentMethod: string;
  paymentReference: string;
  gatewayReference: string | null;
  status: string;
  transferNote: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  hasProof: boolean;
  downloadCount: number;
  paidAt: string | null;
  createdAt: string;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Fieldnote",
  tagline: "Practical Guides for Real Life",
  supportEmail: "hello@fieldnote.store",
  contactPhone: "",
  whatsapp: "",
  currency: "NGN",
  bankName: "",
  accountName: "",
  accountNumber: "",
  instagram: "",
  twitter: "",
  facebook: "",
  refundSummary:
    "Because this is a digital download, completed purchases are not refunded once the file has been delivered. If payment succeeded and you cannot download, contact support with your order reference and we will restore access.",
};

export const ORDER_STATUS = {
  pending: "pending",
  pendingVerification: "pending_verification",
  paid: "paid",
  failed: "failed",
  rejected: "rejected",
} as const;
