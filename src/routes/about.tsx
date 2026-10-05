import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getSiteSettings } from "@/lib/store/catalog";
import { OWNER } from "@/lib/store/owner";
import { PageShell } from "@/components/store/layout";
import { RequestGuideLink } from "@/components/store/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  loader: () => getSiteSettings(),
  component: About,
  head: ({ loaderData }) => ({
    meta: [
      { title: `About — ${loaderData?.storeName ?? "Cairn"}` },
      { name: "description", content: `Who is behind Cairn, and the two ways to get a practical guide.` },
    ],
  }),
});

function About() {
  const settings = Route.useLoaderData();
  return (
    <PageShell settings={settings}>
      <section className="page-narrow section-sm">
        <p className="eyebrow">About</p>
        <h1 className="h-section mt-3 text-ink">Practical guides, and someone in your corner</h1>

        <figure className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
          <img
            src={OWNER.photo.src}
            srcSet={OWNER.photo.srcSet}
            sizes="160px"
            alt={OWNER.photo.alt}
            width={480}
            height={480}
            className="size-32 shrink-0 rounded-full object-cover shadow-card sm:size-40"
            fetchPriority="high"
          />
          <figcaption>
            <blockquote className="lead text-ink">“{OWNER.why}”</blockquote>
            <p className="mt-3 font-semibold text-ink">{OWNER.name}</p>
            <p className="text-muted">Runs {settings.storeName}</p>
          </figcaption>
        </figure>

        <div className="mt-12 space-y-4">
          <p>
            {settings.storeName} writes practical guides for everyday life: home, family, money and work. They’re short
            enough to finish and specific enough to try the same day.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="card flex flex-col p-6">
            <p className="eyebrow">Made for you</p>
            <h2 className="h-card mt-3 text-ink">Personal guide</h2>
            <p className="mt-3 flex-1 text-muted">
              Tell us your situation. We write a guide for it and check in on WhatsApp to see how it’s going. The
              price is agreed with you before you pay.
            </p>
            <Button asChild className="mt-6 w-full">
              <RequestGuideLink>Request a personal guide</RequestGuideLink>
            </Button>
          </div>
          <div className="card flex flex-col p-6">
            <p className="eyebrow">Ready-made</p>
            <h2 className="h-card mt-3 text-ink">PDF guides</h2>
            <p className="mt-3 flex-1 text-muted">
              Guides that are already written. Pay, then download the PDF once your payment is confirmed.
            </p>
            <Button asChild variant="secondary" className="mt-6 w-full">
              <Link to="/guides">
                Browse guides <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
