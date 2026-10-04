import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
          "Tell us your problem. Get a guide made for you. Ready-made PDFs or a personal guide with check-ins, sent on WhatsApp.",
      },
      {
        property: "og:title",
        content: `${loaderData?.settings.storeName ?? "Cairn"} — Small steps, clearly marked.`,
      },
      {
        property: "og:description",
        content: "Ready-made PDFs or a personal guide with check-ins, sent on WhatsApp.",
      },
      { property: "og:image", content: "/og.jpg" },
    ],
  }),
});

function Home() {
  const data = Route.useLoaderData();
  const featured = data.featured.length ? data.featured : data.products.slice(0, 2);
  const waDigits = (data.settings.whatsapp || "").replace(/\D/g, "");
  const waLink = waDigits ? `https://wa.me/${waDigits}` : null;
  const heroRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry?.isIntersecting ?? true),
      { threshold: 0.1 },
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setFormVisible(entry?.isIntersecting ?? false),
      { threshold: 0.12 },
    );
    if (formRef.current) observer.observe(formRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <PageShell settings={data.settings}>
      <section
        ref={heroRef}
        className="mx-auto max-w-6xl px-5 pt-8 pb-12 sm:px-6 sm:pt-12 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-20"
      >
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-accent uppercase">Cairn</p>
          <h1 className="mt-3 max-w-xl font-display text-[2.35rem] leading-[1.08] text-ink sm:text-[3.25rem]">
            Tell us your problem. Get a guide made for you.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Practical guides for home and work. Ready-made PDFs, or a personal guide with check-ins
            — sent on WhatsApp.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="#request-guide">
                Request your personal guide <ArrowRight className="size-4" />
              </a>
            </Button>
            <Link
              to="/guides"
              className="min-h-12 px-2 py-3 text-center text-sm font-medium text-accent hover:underline sm:text-left"
            >
              Browse ready-made guides
            </Link>
          </div>
        </div>
        <div className="relative mt-10 lg:mt-0">
          <img
            src="/covers/hero-lineup.jpg"
            alt="Cairn guides laid out on a wooden table"
            className="w-full rounded-[22px] object-cover shadow-card"
            width={720}
            height={540}
            loading="eager"
            decoding="async"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">How it works</p>
        <h2 className="mt-2 max-w-xl font-display text-3xl tracking-tight">
          A clear next step, whichever guide you need.
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            [
              "1. Tell us what you need",
              "Request a personal guide, or pick a ready-made title from the catalogue.",
            ],
            [
              "2. Choose your option",
              "Buy a ready-made PDF once, or tell us about a personal guide with check-ins.",
            ],
            [
              "3. Get your guide",
              "Ready-made PDFs unlock after payment. Personal guides arrive on WhatsApp with follow-up support.",
            ],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-[18px] border border-line bg-surface px-5 py-6">
              <p className="font-display text-xl tracking-tight">{title}</p>
              <p className="mt-2 text-base leading-relaxed text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">Options</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">Two ways to get a guide</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-[22px] border border-line bg-paper px-6 py-8">
            <p className="text-xs tracking-[0.16em] text-accent uppercase">Ready-made</p>
            <h3 className="mt-2 font-display text-2xl">Pay once, yours forever</h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Pick a guide that already exists. Pay once, download the PDF, and keep it on your
              phone.
            </p>
            <Link
              to="/guides"
              className="mt-5 inline-block min-h-12 py-3 text-sm font-medium text-accent hover:underline"
            >
              Browse ready-made guides →
            </Link>
          </div>
          <div className="rounded-[22px] border border-line bg-paper px-6 py-8">
            <p className="text-xs tracking-[0.16em] text-accent uppercase">Made for you</p>
            <h3 className="mt-2 font-display text-2xl">Personal guide with check-ins</h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Tell us your situation. We write a focused guide and stay available for follow-up
              questions on WhatsApp.
            </p>
            <p className="mt-4 text-sm text-muted">
              Tell us your problem and we&apos;ll send you a price on WhatsApp.
            </p>
            <a
              href="#request-guide"
              className="mt-5 inline-block min-h-12 py-3 text-sm font-medium text-accent hover:underline"
            >
              Request your personal guide →
            </a>
          </div>
        </div>
      </section>

      <div ref={formRef} id="request-guide">
        <WaitlistSection whatsappLink={waLink} />
      </div>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-accent uppercase">Examples</p>
            <h2 className="mt-2 font-display text-3xl tracking-tight">Guides already written</h2>
            <p className="mt-2 max-w-xl text-base text-muted">
              These show the quality and tone. Ready-made PDFs are paid once and yours to keep.
            </p>
          </div>
          <Link
            to="/guides"
            className="hidden min-h-12 py-3 text-sm font-medium text-accent hover:underline sm:inline"
          >
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {featured.slice(0, 2).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-8 sm:hidden">
          <Button asChild variant="outline" className="w-full">
            <Link to="/guides">View all ready-made guides</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">Why Cairn</p>
        <h2 className="mt-2 max-w-xl font-display text-3xl tracking-tight">
          Written for ordinary days, not perfect ones
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ["Plain language", "Short scripts and examples from real home and work life."],
            ["Use it the same day", "Practical steps, not theory to admire."],
            [
              "Ready-made or personal",
              "Choose an existing PDF or request one written for your situation.",
            ],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-[18px] bg-paper-2/80 px-5 py-5">
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-base leading-relaxed text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-24 sm:px-6 sm:pb-20">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">FAQ</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">Before you start</h2>
        <p className="mt-2 text-base text-muted">
          Answers for ready-made guides and personal guides with check-ins.
        </p>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {data.faqs.map((faq) => (
            <details key={faq.id} className="group py-4">
              <summary className="cursor-pointer list-none pr-8 font-medium after:float-right after:text-subtle after:content-['+'] group-open:after:content-['–']">
                {faq.question}
              </summary>
              <p className="mt-2 pr-8 text-base leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-base text-muted">
          Still unsure?{" "}
          {waLink ? (
            <a
              href={waLink}
              className="font-medium text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
          ) : (
            <Link to="/contact" className="font-medium text-accent hover:underline">
              Send a message
            </Link>
          )}
        </p>
      </section>

      {heroVisible || formVisible ? null : (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur-md sm:hidden">
          <div className="mx-auto flex max-w-lg gap-2">
            <Button asChild size="lg" className="min-h-12 flex-1">
              <a href="#request-guide">Request your guide</a>
            </Button>
            {waLink ? (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-h-12 shrink-0 px-3"
                aria-label="Chat on WhatsApp"
              >
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-5" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </PageShell>
  );
}
