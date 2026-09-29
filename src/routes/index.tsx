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
  const realGuides = data.products.filter((p) => !p.isPlaceholder);

  return (
    <PageShell settings={data.settings}>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-16">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-accent uppercase">Digital publisher</p>
          <h1 className="mt-4 max-w-xl font-display text-[2.5rem] leading-[1.06] text-ink sm:text-[3.4rem]">
            Practical guides for real life.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Clear, actionable PDF guides for parenting, money, work, and everyday decisions — written to use the same day you download them.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link to="/guides">
                Explore guides <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#categories">Browse categories</a>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
            <div>
              <dt className="text-[11px] tracking-[0.12em] text-subtle uppercase">Format</dt>
              <dd className="mt-1 text-sm font-medium">Instant PDF</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.12em] text-subtle uppercase">Payment</dt>
              <dd className="mt-1 text-sm font-medium">Pay once</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.12em] text-subtle uppercase">Keep</dt>
              <dd className="mt-1 text-sm font-medium">Yours forever</dd>
            </div>
          </dl>
        </div>
        <div className="relative">
          <img
            src="/covers/hero-lineup.jpg"
            alt="A lineup of Fieldnote guidebooks on a wooden table"
            className="w-full rounded-[28px] object-cover shadow-card"
            width={720}
            height={540}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-accent uppercase">Featured</p>
            <h2 className="mt-2 font-display text-3xl tracking-tight">Guides worth reading</h2>
          </div>
          <Link
            to="/guides"
            className="hidden text-sm font-medium text-accent transition-colors hover:text-accent-hover sm:inline"
          >
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-8 sm:hidden">
          <Button asChild variant="outline" className="w-full">
            <Link to="/guides">View all guides</Link>
          </Button>
        </div>
      </section>

      <section id="categories" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs tracking-[0.22em] text-accent uppercase">Categories</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">Find a guide by the life it helps</h2>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Each category is a destination — open one to see practical titles written for that part of life.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.categories.map((cat) => (
              <Link
                key={cat.id}
                to="/guides"
                search={{ category: cat.slug }}
                className="group rounded-[20px] border border-line bg-paper px-5 py-5 transition-all duration-200 hover:border-accent/35 hover:shadow-[0_8px_24px_rgb(28_25_22_/0.06)]"
              >
                <p className="font-medium text-ink transition-colors group-hover:text-accent">{cat.name}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">Why Fieldnote</p>
        <h2 className="mt-2 max-w-xl font-display text-3xl tracking-tight">
          Written for ordinary days, not perfect ones
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Practical", "Ideas you can use the same evening — not theory to admire."],
            ["Plain language", "Short scripts and examples from real home and work life."],
            ["Actionable", "Checklists and tools you can print or keep on your phone."],
            ["Real situations", "Homework, chores, screens, money, and daily work."],
            ["Instant access", "Pay once, download the PDF, keep it forever."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-[18px] bg-paper-2/80 px-5 py-5">
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="grid gap-8 rounded-[28px] bg-accent px-6 py-10 text-accent-fg sm:px-10 md:grid-cols-3 md:gap-6">
          {[
            ["1. Choose a guide", "Open a title, read what’s inside, and decide if it fits your situation."],
            ["2. Pay securely", "Checkout with Paystack, or send a bank transfer for approval."],
            ["3. Download instantly", "After payment is confirmed, the PDF unlocks for you."],
          ].map(([title, copy], i) => (
            <div key={title}>
              <p className="text-[11px] tracking-[0.18em] uppercase opacity-70">Step {i + 1}</p>
              <p className="mt-2 font-display text-2xl tracking-tight">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-accent-fg/85">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {realGuides.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.22em] text-accent uppercase">Available now</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight">Ready to download</h2>
            </div>
            <Link to="/guides" className="hidden text-sm font-medium text-accent hover:underline sm:inline">
              Browse all
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {realGuides.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">FAQ</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">Before you buy</h2>
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
        <p className="mt-6 text-center text-sm text-muted">
          Still unsure?{" "}
          <Link to="/contact" className="font-medium text-accent hover:underline">
            Send a message
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
