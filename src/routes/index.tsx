import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import { getStorefront } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";
import { ProductCard } from "@/components/store/product-card";
import { WaitlistSection } from "@/components/store/waitlist-section";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  loader: () => getStorefront(),
  component: Home,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.settings.storeName ?? "Cairn"} — Small steps, clearly marked.` },
      {
        name: "description",
        content:
          "Tell us your problem. Get a practical guide made for you. Ready-made PDFs or a personal guide with check-ins — delivered on WhatsApp.",
      },
    ],
  }),
});

function Home() {
  const data = Route.useLoaderData();
  const featured = data.featured.length ? data.featured : data.products.slice(0, 4);
  const waDigits = (data.settings.whatsapp || "").replace(/\D/g, "");
  const waLink = waDigits ? `https://wa.me/${waDigits}` : null;

  return (
    <PageShell settings={data.settings}>
      {/* Hero — one idea above the fold on a phone */}
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-6 sm:px-6 sm:pt-12 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:pt-16">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-accent uppercase">Cairn</p>
          <h1 className="mt-3 max-w-xl font-display text-[2.35rem] leading-[1.08] text-ink sm:text-[3.25rem]">
            Tell us your problem. Get a guide made for you.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Practical guides for home and work. Ready-made PDFs, or a personal guide with check-ins — sent on WhatsApp.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="#request-guide">
                Request your personal guide <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/guides">Explore ready-made guides</Link>
            </Button>
          </div>
          {waLink ? (
            <p className="mt-4 text-sm text-muted">
              Prefer to talk first?{" "}
              <a href={waLink} className="font-medium text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp
              </a>
            </p>
          ) : null}
        </div>
        <div className="relative mt-10 lg:mt-0">
          <img
            src="/covers/hero-lineup.jpg"
            alt="Cairn guides laid out on a wooden table"
            className="w-full rounded-[28px] object-cover shadow-card"
            width={720}
            height={540}
            loading="eager"
            decoding="async"
          />
        </div>
      </section>

      {/* Request personal guide */}
      <div id="request-guide">
        <WaitlistSection whatsappLink={waLink} />
      </div>

      {/* Two options */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">Options</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">Two ways to get a guide</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-[22px] border border-line bg-paper px-6 py-8">
            <p className="text-xs tracking-[0.16em] text-accent uppercase">Ready-made</p>
            <h3 className="mt-2 font-display text-2xl">Pay once, yours forever</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Pick a guide that already exists. Pay once, download the PDF, keep it on your phone.
            </p>
            <Link to="/guides" className="mt-5 inline-block text-sm font-medium text-accent hover:underline">
              Browse guides →
            </Link>
          </div>
          <div className="rounded-[22px] border border-line bg-paper px-6 py-8">
            <p className="text-xs tracking-[0.16em] text-accent uppercase">Made for you</p>
            <h3 className="mt-2 font-display text-2xl">Personal guide with check-ins</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Tell us your situation. We write a focused guide and stay available for follow-up questions on WhatsApp.
            </p>
            <p className="mt-4 text-sm font-medium text-ink">[YOUR PRICE HERE]</p>
            <a href="#request-guide" className="mt-5 inline-block text-sm font-medium text-accent hover:underline">
              Request yours →
            </a>
          </div>
        </div>
      </section>

      {/* Example guides */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-accent uppercase">Examples</p>
            <h2 className="mt-2 font-display text-3xl tracking-tight">Guides already written</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              These show the quality and tone. Pay once — yours forever.
            </p>
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
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.categories.map((cat) => (
              <Link
                key={cat.id}
                to="/guides"
                search={{ category: cat.slug }}
                className="group rounded-[20px] border border-line bg-paper px-5 py-5 transition-all duration-200 hover:border-accent/35"
              >
                <p className="font-medium text-ink transition-colors group-hover:text-accent">{cat.name}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Cairn — covers both options */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">Why Cairn</p>
        <h2 className="mt-2 max-w-xl font-display text-3xl tracking-tight">
          Written for ordinary days, not perfect ones
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Plain language", "Short scripts and examples from real home and work life."],
            ["Use it the same day", "Practical steps, not theory to admire."],
            ["Ready-made or personal", "Buy an existing PDF, or request a guide written for your situation."],
            ["On WhatsApp", "Personal guides and check-ins arrive where you already chat."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-[18px] bg-paper-2/80 px-5 py-5">
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — both paths */}
      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="grid gap-8 rounded-[28px] bg-accent px-6 py-10 text-accent-fg sm:px-10 md:grid-cols-3 md:gap-6">
          {[
            [
              "1. Tell us what you need",
              "Request a personal guide, or pick a ready-made title from the catalogue.",
            ],
            [
              "2. Pay once",
              "Checkout with Paystack or bank transfer. Personal guides are priced separately.",
            ],
            [
              "3. Get your guide",
              "Ready-made PDFs download instantly. Personal guides arrive on WhatsApp with check-ins.",
            ],
          ].map(([title, copy], i) => (
            <div key={title}>
              <p className="text-[11px] tracking-[0.18em] uppercase opacity-70">Step {i + 1}</p>
              <p className="mt-2 font-display text-2xl tracking-tight">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-accent-fg/85">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Real quotes only — empty until you provide them */}
      {data.testimonials.filter((t) => !t.isPlaceholder).length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs tracking-[0.22em] text-accent uppercase">From readers</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">What people say</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {data.testimonials
              .filter((t) => !t.isPlaceholder)
              .map((t) => (
                <blockquote key={t.id} className="rounded-[22px] border border-line bg-surface px-5 py-5">
                  <p className="font-display text-xl leading-snug">{t.quote}</p>
                  <footer className="mt-4 text-sm text-muted">{t.attribution}</footer>
                </blockquote>
              ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 sm:pb-20">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">FAQ</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">Before you start</h2>
        <p className="mt-2 text-sm text-muted">
          Answers for ready-made guides and personal guides with check-ins.
        </p>
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
          {waLink ? (
            <a href={waLink} className="font-medium text-accent hover:underline" target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp
            </a>
          ) : (
            <Link to="/contact" className="font-medium text-accent hover:underline">
              Send a message
            </Link>
          )}
        </p>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button asChild size="lg" className="min-h-12 flex-1">
            <a href="#request-guide">Request your guide</a>
          </Button>
          {waLink ? (
            <Button asChild variant="outline" size="lg" className="min-h-12 shrink-0 px-3" aria-label="Chat on WhatsApp">
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-5" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
