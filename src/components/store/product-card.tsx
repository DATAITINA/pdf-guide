import { Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/store/money";
import type { ProductCard as ProductCardType } from "@/lib/store/types";

export function ProductCard({ product }: { product: ProductCardType }) {
  return (
    <article className="group flex h-full flex-col">
      <Link
        to="/guides/$slug"
        params={{ slug: product.slug }}
        className="flex h-full flex-col rounded-[28px] p-2 transition-transform duration-200 hover:-translate-y-0.5"
      >
        <div className="relative overflow-hidden rounded-[20px] bg-paper-2 shadow-card">
          <img
            src={product.coverImage}
            alt={`Cover of ${product.title}`}
            className="aspect-2/3 w-full object-cover"
            loading="lazy"
          />
          {product.isPlaceholder ? (
            <span className="absolute top-3 left-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-medium tracking-wide text-paper uppercase">
              Demo
            </span>
          ) : null}
          {product.featured && !product.isPlaceholder ? (
            <span className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium tracking-wide text-accent-fg uppercase">
              Featured
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col px-2 pt-4 pb-2">
          <p className="text-[12px] tracking-[0.14em] text-accent uppercase">{product.categoryName}</p>
          <h3 className="mt-1 font-display text-[1.02rem] leading-snug text-ink">{product.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{product.shortDescription}</p>
          <div className="mt-auto flex items-center justify-between pt-4">
            <span className="tabular-nums text-sm font-medium">
              {product.isPlaceholder ? "Placeholder" : formatMoney(product.priceKobo, product.currency)}
            </span>
            <span className="text-sm text-accent group-hover:underline">View guide</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
