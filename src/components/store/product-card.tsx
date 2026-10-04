import { Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/store/money";
import type { ProductCard as ProductCardType } from "@/lib/store/types";

export function ProductCard({ product }: { product: ProductCardType }) {
  return (
    <article className="group flex h-full flex-col">
      <Link
        to="/guides/$slug"
        params={{ slug: product.slug }}
        className="flex h-full gap-4 rounded-[24px] p-1.5 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-offset-4 sm:flex-col sm:gap-0"
      >
        <div className="relative w-28 shrink-0 self-start overflow-hidden rounded-[14px] bg-paper-2 shadow-card sm:w-full sm:rounded-[18px]">
          <img
            src={product.coverImage}
            alt={`Cover of ${product.title}`}
            className="aspect-2/3 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            width={400}
            height={600}
            loading="lazy"
            decoding="async"
          />
          {product.isPlaceholder ? (
            <span className="absolute top-2 left-2 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-medium tracking-wide text-paper uppercase sm:top-3 sm:left-3">
              Demo
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1 sm:px-2 sm:pt-4 sm:pb-2">
          <p className="text-[0.8125rem] font-semibold tracking-[0.12em] text-accent uppercase">
            {product.categoryName}
          </p>
          <h3 className="mt-1.5 font-display text-lg leading-snug text-ink">{product.title}</h3>
          <p className="mt-2 line-clamp-2 text-base leading-relaxed text-muted">{product.shortDescription}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-3 sm:pt-4">
            <span className="text-base font-medium tabular-nums">
              {product.isPlaceholder ? "Placeholder" : formatMoney(product.priceKobo, product.currency)}
            </span>
            <span className="text-base text-accent underline-offset-4 group-hover:underline">View guide</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
