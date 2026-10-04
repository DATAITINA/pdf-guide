import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import { getStorefront } from "@/lib/store/catalog";
import { formatMoney } from "@/lib/store/money";
import { PageShell } from "@/components/store/layout";
import { ProductCard } from "@/components/store/product-card";
import { WaitlistSection } from "@/components/store/waitlist-section";
import { CairnStones, TrailLine } from "@/components/store/cairn-art";
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
          "Tell us your problem. Get a practical guide made for you. Ready-made PDFs or a personal guide with check-ins on WhatsApp.",
      },
    ],
  }),
});

/** Homepage-only answers about the personal guide, shown above the store FAQs. */
const PERSONAL_GUIDE_FAQS = [
  {
    id: "home-personal-guide",
    question: "What is a personal guide?",
    answer:
      "A short, practical guide written for your situation, not a general one. You tell us what’s going on, we ask a few questions on WhatsApp, then we write clear steps you can follow at home or at work.",
  },
  {
    id: "home-pricing",
    question: "How much does a personal guide cost?",
    answer:
      "It depends on your situation and how much help you need. We’ll tell you the price on WhatsApp before you pay anything, and you decide from there. Ready-made guides show their price on each guide’s page.",
  },
  {
    id: "home-check-ins",
    question: "How do check-ins work?",
    answer:
      "After you get your guide, we message you on WhatsApp to see how it’s going. If something isn’t working, we talk it through and adjust the guide with you.",
  },
];

const WHY_CAIRN = [
  ["Plain language", "Short steps and real examples from home and work life. No jargon."],
  ["Use it the same day", "Practical things to try, not theory to admire."],
  ["Ready-made or personal", "Buy a guide that’s already written, or ask for one written for you."],
  ["On WhatsApp", "Personal guides and check-ins come where you already chat."],
] as const;

function Home() {
  const data = Route.useLoaderData();
  const realProducts = data.products.filter((p) => !p.isPlaceholder);
  const examples = realProducts.slice(0, 4);
  const lowestPrice = realProducts.length ? Math.min(...realProducts.map((p) => p.priceKobo)) : null;
  const waDigits = (data.settings.whatsapp || "").replace(/\D/g, "");
  const waLink = waDigits ? `https://wa.me/${waDigits}` : null;
  const showSticky = useStickyBarVisibility();
  const realTestimonials = data.testimonials.filter((t) => !t.isPlaceholder);
  const faqs = [...PERSONAL_GUIDE_FAQS, ...data.faqs];

  return (
    <PageShell settings={data.settings}>
      {/* Hero: label, headline, one sentence, one button, one quiet link */}
      <section className="relative overflow-hidden">
        <TrailLine className="absolute -right-24 bottom-6 hidden w-[520px] text-accent/20 lg:block" />
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-14 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pt-20 lg:pb-20">
          <div className="rise-in">
            <p className="eyebrow flex items-center gap-2">
              <CairnStones className="size-4" />
              Personal and ready-made guides
            </p>
            <h1 className="mt-4 max-w-xl font-display text-[2.125rem] leading-[1.1] text-ink sm:text-[3.25rem]">
              Tell us your problem. Get a guide made for you.
            </h1>
            <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
              Plain, practical help for home and work, written for your situation, with check-ins on WhatsApp.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6" data-sticky-hide>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href="#request-guide">
                  Tell us what you need <ArrowRight className="size-4" aria-hidden />
                </a>
              </Button>
              <Link
                to="/guides"
                className="link inline-flex min-h-12 items-center justify-center text-base sm:justify-start"
              >
                Or browse ready-made guides
              </Link>
            </div>
          </div>
          <div className="mt-10 lg:mt-0">
            <img
              src="/covers/hero-lineup.jpg"
              srcSet="/covers/hero-lineup-720.jpg 720w, /covers/hero-lineup.jpg 1440w"
              sizes="(min-width: 1024px) 520px, 100vw"
              alt="Printed Cairn guides laid out on a wooden table"
              className="aspect-[16/10] w-full rounded-[24px] object-cover shadow-card lg:aspect-[4/3] lg:rounded-[28px]"
              width={1440}
              height={810}
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Request form */}
      <div id="request-guide" className="scroll-mt-16 border-y border-line bg-paper-2/50" data-sticky-hide>
        <WaitlistSection whatsappLink={waLink} />
      </div>

      {/* Two options */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="eyebrow">Two options</p>
        <h2 className="mt-3 font-display text-[2rem] leading-tight sm:text-[2.5rem]">Two ways to get a guide</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">
          <div className="flex flex-col rounded-[24px] border border-line bg-surface p-6 sm:p-8">
            <p className="eyebrow">Made for you</p>
            <h3 className="mt-3 font-display text-2xl">A personal guide, with check-ins</h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Tell us your situation. We write a guide for it, then message you on WhatsApp to see how it’s going and
              adjust it with you.
            </p>
            <p className="mt-4 rounded-[14px] bg-paper-2/70 px-4 py-3 text-base font-medium text-ink">
              Price depends on your situation. We'll confirm it on WhatsApp before you pay.
            </p>
            <a href="#request-guide" className="link mt-6 inline-flex min-h-12 items-center gap-2 self-start text-base">
              Tell us what you need <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
          <div className="flex flex-col rounded-[24px] border border-line bg-surface p-6 sm:p-8">
            <p className="eyebrow">Ready-made</p>
            <h3 className="mt-3 font-display text-2xl">A guide that’s already written</h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Pick a PDF guide, pay, and download it to keep on your phone.
            </p>
            {lowestPrice !== null ? (
              <p className="mt-4 rounded-[14px] bg-paper-2/70 px-4 py-3 text-base font-medium text-ink tabular-nums">
                From {formatMoney(lowestPrice, realProducts[0]!.currency)}
              </p>
            ) : null}
            <Link to="/guides" className="link mt-6 inline-flex min-h-12 items-center gap-2 self-start text-base">
              Browse ready-made guides <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Example guides: real products only */}
      {examples.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Examples</p>
              <h2 className="mt-3 font-display text-[2rem] leading-tight sm:text-[2.5rem]">Guides already written</h2>
              <p className="mt-3 max-w-xl text-base text-muted">A look at the tone and detail you can expect.</p>
            </div>
            <Link to="/guides" className="link hidden min-h-12 items-center text-base sm:inline-flex">
              See all guides
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {examples.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-8 sm:hidden">
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/guides">See all guides</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {/* How it works: a short trail of three stones */}
      <section className="bg-accent text-accent-fg">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-[0.8125rem] font-semibold tracking-[0.16em] text-accent-fg/80 uppercase">
            How it works
          </p>
          <h2 className="mt-3 font-display text-[2rem] leading-tight sm:text-[2.5rem]">Three simple steps</h2>
          <ol className="relative mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            <span
              aria-hidden
              className="absolute top-6 bottom-6 left-6 border-l-2 border-dotted border-accent-fg/30 md:top-6 md:right-[16%] md:bottom-auto md:left-[16%] md:border-t-2 md:border-l-0"
            />
            <Step n={1} title="Tell us what you need">
              Fill in the short form, or pick a ready-made guide.
            </Step>
            <Step n={2} title="Agree the price, or pay">
              <span className="block">
                <span className="font-medium text-accent-fg">Personal guide:</span> We agree the price on WhatsApp.
              </span>
              <span className="mt-2 block">
                <span className="font-medium text-accent-fg">Ready-made:</span> Pay with transfer.
              </span>
            </Step>
            <Step n={3} title="Get your guide">
              Personal guides come on WhatsApp, and we check in to see how it’s going. Ready-made guides come as a
              download link once your payment is confirmed.
            </Step>
          </ol>
        </div>
      </section>

      {/* Why Cairn */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="eyebrow">Why Cairn</p>
        <h2 className="mt-3 max-w-xl font-display text-[2rem] leading-tight sm:text-[2.5rem]">
          Written for ordinary days, not perfect ones
        </h2>
        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {WHY_CAIRN.map(([title, copy]) => (
            <li key={title} className="flex gap-4">
              <CairnStones className="mt-1 size-5 shrink-0 text-accent/70" />
              <div>
                <p className="text-lg font-medium text-ink">{title}</p>
                <p className="mt-1 text-base leading-relaxed text-muted">{copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Real quotes only: empty until the owner adds them */}
      {realTestimonials.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <p className="eyebrow">From readers</p>
          <h2 className="mt-3 font-display text-[2rem] leading-tight sm:text-[2.5rem]">What people say</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {realTestimonials.map((t) => (
              <blockquote key={t.id} className="rounded-[24px] border border-line bg-surface p-6">
                <p className="font-display text-xl leading-snug">{t.quote}</p>
                <footer className="mt-4 text-base text-muted">{t.attribution}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
        <p className="eyebrow">Questions</p>
        <h2 className="mt-3 font-display text-[2rem] leading-tight sm:text-[2.5rem]">Before you start</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {faqs.map((faq) => (
            <details key={faq.id} className="group">
              <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-4 text-lg font-medium text-ink">
                {faq.question}
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-paper-2 text-accent transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pr-12 pb-5 text-base leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center text-base text-muted">
          Still unsure?{" "}
          {waLink ? (
            <a href={waLink} className="link" target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp
            </a>
          ) : (
            <Link to="/contact" className="link">
              Send us a message
            </Link>
          )}
        </p>
      </section>

      {/* Sticky mobile button: hidden while the hero button, the form or the footer is on screen */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur-md transition-transform duration-200 sm:hidden ${
          showSticky ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!showSticky}
      >
        <div className="mx-auto flex max-w-lg gap-2">
          <Button asChild size="lg" className="flex-1">
            <a href="#request-guide" tabIndex={showSticky ? undefined : -1}>
              Tell us what you need
            </a>
          </Button>
          {waLink ? (
            <Button asChild variant="outline" size="lg" className="shrink-0 px-3" aria-label="Chat on WhatsApp">
              <a href={waLink} target="_blank" rel="noopener noreferrer" tabIndex={showSticky ? undefined : -1}>
                <MessageCircle className="size-5" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative flex gap-5 md:flex-col md:gap-4">
      <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-[45%_55%_50%_50%/55%_50%_50%_45%] bg-accent-fg font-display text-xl text-accent">
        {n}
      </span>
      <div>
        <p className="font-display text-2xl">{title}</p>
        <p className="mt-2 text-base leading-relaxed text-accent-fg/85">{children}</p>
      </div>
    </li>
  );
}

/** True when none of the [data-sticky-hide] blocks are on screen. */
function useStickyBarVisibility() {
  const [visible, setVisible] = useState(false);
  const onScreen = useRef(new Set<Element>());

  useEffect(() => {
    const targets = document.querySelectorAll("[data-sticky-hide]");
    if (!("IntersectionObserver" in window) || targets.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.current.add(entry.target);
        else onScreen.current.delete(entry.target);
      }
      setVisible(onScreen.current.size === 0);
    });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return visible;
}
