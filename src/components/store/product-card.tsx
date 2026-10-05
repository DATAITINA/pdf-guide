import { Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/store/money";
import type { ProductCard as ProductCardType } from "@/lib/store/types";
import { coverSources } from "@/lib/store/covers";

/** One guide. Row layout on phones (cover left), stacked from 640px. */
export function ProductCard({ product }: { product: ProductCardType }) {
  const cover = coverSources(product.coverImage);
  return (
    <article className="group h-full">
      <Link
        to="/guides/$slug"
        params={{ slug: product.slug }}
        className="card flex h-full gap-4 p-3 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-raised sm:flex-col sm:gap-0 sm:p-3"
      >
        <div className="w-28 shrink-0 self-start overflow-hidden rounded-lg bg-paper-2 sm:w-full">
          <img
            src={cover.src}
            srcSet={cover.srcSet}
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 112px"
            alt={`Cover of ${product.title}`}
            className="aspect-2/3 w-full object-cover"
            width={400}
            height={600}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1 sm:px-2 sm:pt-4 sm:pb-2">
          <p className="eyebrow">{product.categoryName}</p>
          <h3 className="mt-2 font-display text-xl leading-snug text-ink">{product.title}</h3>
          <p className="mt-2 line-clamp-2 text-muted">{product.shortDescription}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span className="font-semibold tabular-nums text-ink">
              {formatMoney(product.priceKobo, product.currency)}
            </span>
            <span className="font-medium text-accent underline-offset-4 group-hover:underline">View guide</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
