import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Share2 } from "lucide-react";
import { getProductBySlug } from "@/lib/store/catalog";
import { formatMoney } from "@/lib/store/money";
import { PageShell } from "@/components/store/layout";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";

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
        { title: `${title} — ${loaderData?.settings.storeName ?? "Fieldnote"}` },
        { name: "description", content: description },
        { name: "og:title", content: title },
        { name: "og:description", content: description },
        { name: "og:image", content: product?.coverImage ?? "/og.jpg" },
      ],
      links: product ? [{ rel: "canonical", href: `/guides/${product.slug}` }] : [],
    };
  },
});

function ProductPage() {
  const data = Route.useLoaderData();
  const product = data.product!;
  const whatsapp = () => {
    const url = typeof window !== "undefined" ? window.location.href : `/guides/${product.slug}`;
    const text = `Check out this guide:\n${product.title}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <PageShell settings={data.settings}>
      <article className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="overflow-hidden rounded-[28px] bg-paper-2 shadow-card">
            <img src={product.coverImage} alt={`Cover of ${product.title}`} className="w-full object-cover" />
          </div>
        </div>
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">{product.categoryName}</p>
          {product.isPlaceholder ? (
            <p className="mt-3 inline-block rounded-full bg-ink px-3 py-1 text-xs tracking-wide text-paper uppercase">
              Demo / placeholder
            </p>
          ) : null}
          <h1 className="mt-3 font-display text-4xl leading-tight">{product.title}</h1>
          {product.subtitle ? <p className="mt-3 text-lg text-muted">{product.subtitle}</p> : null}
          <p className="mt-4 text-base leading-relaxed">{product.shortDescription}</p>
          <div className="mt-6 flex flex-wrap items-end gap-4">
            <p className="font-display text-3xl tabular-nums">
              {product.isPlaceholder ? "Not for sale" : formatMoney(product.priceKobo, product.currency)}
            </p>
            {product.pages ? <p className="text-sm text-muted">{product.pages} pages · PDF</p> : <p className="text-sm text-muted">Digital PDF</p>}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {product.isPlaceholder ? (
              <Button disabled className="w-full sm:w-auto">Demo product — not for sale</Button>
            ) : (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/checkout/$slug" params={{ slug: product.slug }}>
                  Buy now
                </Link>
              </Button>
            )}
            <Button type="button" variant="outline" size="lg" onClick={whatsapp} className="w-full sm:w-auto">
              <Share2 className="size-4" /> Share on WhatsApp
            </Button>
          </div>
        </div>
      </article>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">What is this?</h2>
          {product.fullDescription.split("\n\n").map((p) => (
            <p key={p.slice(0, 24)} className="mt-3 text-[15px] leading-relaxed text-muted">
              {p}
            </p>
          ))}
        </div>
        <div>
          <h2 className="font-display text-2xl">Who is it for?</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{product.audience || "Readers who want a practical, downloadable guide."}</p>
          <h2 className="mt-8 font-display text-2xl">What will I learn?</h2>
          <ul className="mt-3 space-y-2 text-[15px] text-muted">
            {(product.learnings.length ? product.learnings : ["A clear, practical take on the topic."]).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {product.benefits.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2 className="font-display text-2xl">Why this guide helps</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {product.benefits.map((b) => (
              <p key={b} className="rounded-[18px] bg-paper-2/80 px-4 py-4 text-sm leading-relaxed">
                {b}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {product.tableOfContents.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2 className="font-display text-2xl">What’s inside</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {product.tableOfContents.map((section) => (
              <div key={section.title} className="rounded-[18px] border border-line bg-surface px-5 py-4">
                <p className="font-medium">{section.title}</p>
                {section.children?.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-muted">
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

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="font-display text-2xl">What’s included</h2>
        <ul className="mt-4 grid gap-2 text-sm text-muted md:grid-cols-2">
          {(product.included.length ? product.included : ["Instant PDF download after payment is confirmed"]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {!product.isPlaceholder ? (
          <div className="mt-8">
            <Button asChild size="lg">
              <Link to="/checkout/$slug" params={{ slug: product.slug }}>
                Buy now · {formatMoney(product.priceKobo, product.currency)}
              </Link>
            </Button>
          </div>
        ) : null}
      </section>

      {data.faqs.length > 0 ? (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <h2 className="font-display text-2xl">FAQ</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {data.faqs.map((faq) => (
              <details key={faq.id} className="py-4">
                <summary className="cursor-pointer font-medium">{faq.question}</summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {data.related.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="font-display text-2xl">Related guides</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {data.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
