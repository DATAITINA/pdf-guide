import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getStorefront } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  loader: () => getStorefront(),
  component: Home,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.settings.storeName ?? "Fieldnote"} — Practical Guides for Real Life` },
      {
        name: "description",
        content:
          "Discover practical digital guides designed to help you navigate parenting, relationships, money, business, career and everyday life.",
      },
    ],
  }),
});

function Home() {
  const data = Route.useLoaderData();
  const featured = data.featured.length ? data.featured : data.products.slice(0, 4);

  return (
    <PageShell settings={data.settings}>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
        <div>
          <p className="text-xs tracking-[0.22em] text-accent uppercase">Digital publisher</p>
          <h1 className="mt-4 max-w-xl font-display text-[2.6rem] leading-[1.08] text-ink sm:text-6xl">
            Practical Guides for Real Life.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Discover practical digital guides designed to help you navigate parenting, relationships,
            money, business, career and everyday life.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/guides">
                Explore Guides <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#categories">Browse Categories</a>
            </Button>
          </div>
        </div>
        <div className="relative">
          <img
            src="/covers/hero-lineup.jpg"
            alt="A lineup of Fieldnote guidebooks on a wooden table"
            className="w-full rounded-[28px] object-cover shadow-card"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-accent uppercase">Featured</p>
            <h2 className="mt-2 font-display text-3xl">Guides worth reading</h2>
          </div>
          <Link to="/guides" className="hidden text-sm text-accent hover:underline sm:inline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section id="categories" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs tracking-[0.22em] text-accent uppercase">Categories</p>
          <h2 className="mt-2 font-display text-3xl">Find a guide by the life it helps</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.categories.map((cat) => (
              <Link
                key={cat.id}
                to="/guides"
                search={{ category: cat.slug }}
                className="rounded-[22px] border border-line bg-paper px-5 py-5 transition-colors hover:border-accent/40"
              >
                <p className="font-medium">{cat.name}</p>
                <p className="mt-1 text-sm text-muted">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">Why people buy</p>
        <h2 className="mt-2 max-w-xl font-display text-3xl">Written for ordinary days, not perfect ones</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {[
            ["Practical", "Ideas you can use the same evening, not theory to admire."],
            ["Easy to understand", "Plain language, short scripts, and examples from home life."],
            ["Actionable", "Printable tools and a seven-day reset, not just encouragement."],
            ["Real-life situations", "Homework, chores, screens, siblings, money and work."],
            ["Instant access", "Pay once, download the PDF, keep it on your phone or laptop."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-[22px] bg-paper-2/70 px-5 py-5">
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid gap-6 rounded-[30px] bg-accent px-6 py-10 text-accent-fg md:grid-cols-3 md:px-10">
          {[
            ["1. Choose a guide", "Open a title, read what’s inside, and decide if it fits your situation."],
            ["2. Pay securely", "Checkout with Paystack, or send a bank transfer for approval."],
            ["3. Download instantly", "After payment is confirmed, the PDF is unlocked for you."],
          ].map(([title, copy], i) => (
            <div key={title}>
              <p className="text-xs tracking-[0.18em] uppercase opacity-70">Step {i + 1}</p>
              <p className="mt-2 font-display text-2xl">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-accent-fg/80">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">From readers</p>
        <h2 className="mt-2 font-display text-3xl">Placeholder notes, until real ones arrive</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          These cards are clearly marked as placeholders. They are not customer reviews.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {data.testimonials.map((t) => (
            <blockquote key={t.id} className="rounded-[22px] border border-dashed border-line bg-surface px-5 py-5">
              <p className="text-[11px] tracking-[0.14em] text-warn uppercase">Placeholder</p>
              <p className="mt-3 font-display text-xl leading-snug">{t.quote}</p>
              <footer className="mt-4 text-sm text-muted">{t.attribution}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">FAQ</p>
        <h2 className="mt-2 font-display text-3xl">Before you buy</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {data.faqs.map((faq) => (
            <details key={faq.id} className="group py-4">
              <summary className="cursor-pointer list-none font-medium after:float-right after:text-subtle after:content-['+'] group-open:after:content-['–']">
                {faq.question}
              </summary>
              <p className="mt-2 pr-8 text-sm leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
