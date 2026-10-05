import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { getStorefront } from "@/lib/store/catalog";
import { formatMoney } from "@/lib/store/money";
import { OWNER } from "@/lib/store/owner";
import { PERSONAL_GUIDE_FAQS } from "@/lib/store/personal-faqs";
import { PageShell } from "@/components/store/layout";
import { ProductCard } from "@/components/store/product-card";
import { WaitlistSection } from "@/components/store/waitlist-section";
import { FaqList, SectionHeading } from "@/components/store/blocks";
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
          "Tell us your problem and get a practical guide made for you, with check-ins on WhatsApp. Or buy a ready-made PDF guide.",
      },
    ],
  }),
});

function Home() {
  const data = Route.useLoaderData();
  const realProducts = data.products.filter((p) => !p.isPlaceholder);
  const examples = realProducts.slice(0, 4);
  const lowest = realProducts.length ? Math.min(...realProducts.map((p) => p.priceKobo)) : null;
  const fromPrice = lowest !== null ? formatMoney(lowest, realProducts[0]!.currency) : null;
  const waDigits = (data.settings.whatsapp || "").replace(/\D/g, "");
  const waLink = waDigits ? `https://wa.me/${waDigits}` : null;
  const faqs = [...PERSONAL_GUIDE_FAQS, ...data.faqs];
  // Only name the payment methods that work today.
  const payWith = data.payments.paystackConfigured ? "card or bank transfer" : "bank transfer";

  return (
    <PageShell settings={data.settings}>
      {/* Hero: what Cairn does, one main action */}
      <section className="relative overflow-hidden">
        <TrailLine className="absolute -right-16 bottom-10 hidden w-[480px] text-accent/25 lg:block" />
        <div className="page pt-10 pb-14 sm:pt-16 md:pt-24 md:pb-24">
          <div className="animate-rise-in max-w-3xl">
            <p className="eyebrow flex items-center gap-2">
              <CairnStones className="size-4" />
              Personal guides, made for you
            </p>
            <h1 className="h-display mt-4 text-ink">Tell us your problem. Get a guide made for you.</h1>
            <p className="lead mt-5 max-w-xl">
              Plain, practical help for home and work, written for your situation, with check-ins on WhatsApp.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href="#request-guide">
                  Tell us what you need <ArrowRight className="size-5" aria-hidden />
                </a>
              </Button>
              <Link to="/guides" className="link link-tap justify-center sm:justify-start">
                Or browse ready-made guides{fromPrice ? ` from ${fromPrice}` : ""}
              </Link>
            </div>
            <ul className="mt-8 flex flex-col gap-2 text-muted sm:flex-row sm:gap-6">
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-accent" aria-hidden /> Price agreed before you pay
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-accent" aria-hidden /> We reply on WhatsApp
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Request form */}
      <div id="request-guide" className="scroll-mt-16 border-y border-line bg-paper-2/50">
        <WaitlistSection whatsappLink={waLink} />
      </div>

      {/* Who is behind Cairn */}
      <section className="page section">
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-12">
          <img
            src={OWNER.photo.src}
            srcSet={OWNER.photo.srcSet}
            sizes="(min-width: 768px) 192px, 128px"
            alt={OWNER.photo.alt}
            width={480}
            height={480}
            loading="lazy"
            decoding="async"
            className="size-32 rounded-full object-cover shadow-card md:size-48"
          />
          <div className="max-w-2xl">
            <p className="eyebrow">Who’s behind Cairn</p>
            <h2 className="h-section mt-3 text-ink">Hi, I’m {OWNER.firstName}.</h2>
            <blockquote className="lead mt-4 text-ink">“{OWNER.why}”</blockquote>
            <p className="mt-4 text-muted">— {OWNER.name}</p>
            <Link to="/about" className="link link-tap mt-2">
              More about Cairn <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Two options */}
      <section className="border-t border-line">
        <div className="page section">
          <SectionHeading eyebrow="Two options" title="Two ways to get a guide" />
          <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-6">
            <div className="card flex flex-col p-6 sm:p-8">
              <p className="eyebrow">Made for you</p>
              <h3 className="h-card mt-3 text-ink">A personal guide, with check-ins</h3>
              <p className="mt-3 text-muted">
                Tell us your situation. We write a guide for it, then message you on WhatsApp to see how it’s going
                and adjust it with you.
              </p>
              <p className="mt-6 rounded-lg bg-accent-soft px-4 py-3 font-medium text-ink">
                Price depends on your situation. We'll confirm it on WhatsApp before you pay.
              </p>
              <a href="#request-guide" className="link link-tap mt-4 self-start">
                Tell us what you need <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
            <div className="card flex flex-col p-6 sm:p-8">
              <p className="eyebrow">Ready-made</p>
              <h3 className="h-card mt-3 text-ink">A guide that’s already written</h3>
              <p className="mt-3 text-muted">
                Pick a PDF guide, pay by {payWith}, and get a download link once your payment is confirmed.
              </p>
              {fromPrice ? (
                <p className="mt-6 rounded-lg bg-paper-2/70 px-4 py-3 font-medium text-ink tabular-nums">
                  From {fromPrice}
                </p>
              ) : null}
              <Link to="/guides" className="link link-tap mt-4 self-start">
                Browse ready-made guides <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Example guides: real products only */}
      {examples.length > 0 ? (
        <section className="page pb-16 md:pb-24">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Ready-made"
              title="Guides already written"
              lead="A look at the tone and detail you can expect."
            />
            <Link to="/guides" className="link link-tap hidden shrink-0 sm:inline-flex">
              See all guides
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {examples.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Button asChild variant="secondary" size="lg" className="mt-8 w-full sm:hidden">
            <Link to="/guides">See all guides</Link>
          </Button>
        </section>
      ) : null}

      {/* How it works */}
      <section className="bg-accent text-accent-fg">
        <div className="page section">
          <p className="eyebrow text-accent-fg/85">How it works</p>
          <h2 className="h-section mt-3">Three simple steps</h2>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            <span
              aria-hidden
              className="absolute top-6 bottom-6 left-6 border-l-2 border-dotted border-accent-fg/35 md:top-6 md:right-[16%] md:bottom-auto md:left-[16%] md:border-t-2 md:border-l-0"
            />
            <Step n={1} title="Tell us what you need">
              Fill in the short form, or pick a ready-made guide.
            </Step>
            <Step n={2} title="Agree the price, or pay">
              <span className="block">
                <span className="font-semibold text-accent-fg">Personal guide:</span> we agree the price on WhatsApp.
              </span>
              <span className="mt-2 block">
                <span className="font-semibold text-accent-fg">Ready-made:</span> pay by {payWith}.
              </span>
            </Step>
            <Step n={3} title="Get your guide">
              Personal guides come on WhatsApp, and we check in to see how it’s going. Ready-made guides come as a
              download link once your payment is confirmed.
            </Step>
          </ol>
        </div>
      </section>

      {/* Questions: personal guide first */}
      <section className="page-narrow section">
        <SectionHeading eyebrow="Questions" title="Before you start" />
        <div className="mt-8">
          <FaqList items={faqs} />
        </div>
        <p className="mt-8 text-center text-muted">
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
        <h3 className="h-card">{title}</h3>
        <p className="mt-2 text-accent-fg/90">{children}</p>
      </div>
    </li>
  );
}
