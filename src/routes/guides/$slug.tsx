import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Share2 } from "lucide-react";
import { getProductBySlug } from "@/lib/store/catalog";
import { formatMoney } from "@/lib/store/money";
import { coverSources } from "@/lib/store/covers";
import { PageShell } from "@/components/store/layout";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { FaqList, PersonalGuideCta } from "@/components/store/blocks";

export const Route = createFileRoute("/guides/$slug")({
  loader: async ({ params }) => {
    const data = await getProductBySlug({ data: { slug: params.slug } });
    if (!data.product) throw notFound();
    return data;
  },
  component: ProductPage,
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    const title = product?.seoTitle || product?.title || "Guide";
    const description = product?.seoDescription || product?.shortDescription || "";
    return {
      meta: [
        { title: `${title} — ${loaderData?.settings.storeName ?? "Cairn"}` },
        { name: "description", content: description },
        { name: "og:title", content: title },
        { name: "og:description", content: description },
        { name: "og:image", content: product?.coverImage ?? "/og.jpg" },
      ],
    };
  },
});

function ProductPage() {
  const data = Route.useLoaderData();
  const product = data.product!;
  const priceLabel = product.isPlaceholder ? null : formatMoney(product.priceKobo, product.currency);
  const cover = coverSources(product.coverImage);
  // Only name the payment methods that work today.
  const payWith = data.payments.paystackConfigured ? "card or bank transfer" : "bank transfer";

  const share = () => {
    const url = typeof window !== "undefined" ? window.location.href : `/guides/${product.slug}`;
    const text = `Check out this guide:\n${product.title}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <PageShell settings={data.settings}>
      <article className="page section-sm grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="mx-auto w-full max-w-[13rem] sm:max-w-xs lg:max-w-none">
          <div className="overflow-hidden rounded-xl bg-paper-2 shadow-card">
            <img
              src={cover.src}
              srcSet={cover.srcSet}
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 320px, 208px"
              alt={`Cover of ${product.title}`}
              width={800}
              height={1200}
              className="aspect-2/3 w-full object-cover"
              fetchPriority="high"
            />
          </div>
        </div>
        <div>
          <p className="eyebrow">{product.categoryName}</p>
          <h1 className="h-section mt-3 text-ink">{product.title}</h1>
          {product.subtitle ? <p className="lead mt-3">{product.subtitle}</p> : null}
          <p className="mt-4 text-ink/90">{product.shortDescription}</p>

          {product.isPlaceholder ? (
            <p className="card-soft mt-8 px-5 py-4 text-muted">This is a sample listing and isn’t for sale.</p>
          ) : (
            <div className="card mt-8 p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-3xl tabular-nums text-ink">{priceLabel}</p>
                <p className="text-muted">{product.pages ? `${product.pages}-page PDF` : "PDF guide"}</p>
              </div>
              <ul className="mt-4 space-y-2 text-muted">
                {[
                  `Pay by ${payWith}`,
                  "Download link as soon as your payment is confirmed",
                  "Keep the PDF on your phone or laptop",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-1.5 size-4 shrink-0 text-accent" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/checkout/$slug" params={{ slug: product.slug }}>
                    Buy this guide · {priceLabel}
                  </Link>
                </Button>
                <Button type="button" variant="secondary" size="lg" onClick={share} className="w-full sm:w-auto">
                  <Share2 className="size-4" aria-hidden /> Share on WhatsApp
                </Button>
              </div>
            </div>
          )}
        </div>
      </article>

      <section className="page grid gap-10 pb-16 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="h-card text-ink">What is this?</h2>
          {product.fullDescription.split("\n\n").map((p) => (
            <p key={p.slice(0, 24)} className="mt-3 text-muted">
              {p}
            </p>
          ))}
        </div>
        <div>
          <h2 className="h-card text-ink">Who is it for?</h2>
          <p className="mt-3 text-muted">{product.audience || "Readers who want a practical, downloadable guide."}</p>
          <h2 className="h-card mt-10 text-ink">What will I learn?</h2>
          <ul className="mt-3 space-y-3 text-muted">
            {(product.learnings.length ? product.learnings : ["A clear, practical take on the topic."]).map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {product.tableOfContents.length > 0 ? (
        <section className="page pb-16">
          <h2 className="h-card text-ink">What’s inside</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {product.tableOfContents.map((section) => (
              <div key={section.title} className="card px-5 py-4">
                <h3 className="font-sans text-base font-semibold tracking-normal text-ink">{section.title}</h3>
                {section.children?.length ? (
                  <ul className="mt-2 space-y-1 text-muted">
                    {section.children.map((child) => (
                      <li key={child}>{child}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {product.included.length > 0 ? (
        <section className="page pb-16">
          <h2 className="h-card text-ink">What’s included</h2>
          <ul className="mt-4 grid gap-3 text-muted md:grid-cols-2">
            {product.included.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-1.5 size-4 shrink-0 text-accent" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="page pb-16">
        <PersonalGuideCta />
      </section>

      {data.faqs.length > 0 ? (
        <section className="page-narrow pb-16">
          <h2 className="h-card text-ink">Questions</h2>
          <div className="mt-4">
            <FaqList items={data.faqs} />
          </div>
        </section>
      ) : null}

      {data.related.length > 0 ? (
        <section className="page pb-28 sm:pb-24">
          <h2 className="h-card text-ink">More ready-made guides</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {data.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : (
        <div className="h-16 sm:hidden" />
      )}

      {!product.isPlaceholder ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-md sm:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{product.title}</p>
              <p className="text-sm text-muted tabular-nums">{priceLabel}</p>
            </div>
            <Button asChild className="shrink-0">
              <Link to="/checkout/$slug" params={{ slug: product.slug }}>
                Buy guide
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
