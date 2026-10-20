import { useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  formatNgn,
  formatUsd,
  getIssue,
  getStory,
  isTodoLink,
  shareImageSrc,
} from "@/content/stories";
import { StoryShell } from "@/components/stories/shell";
import { storyMeta } from "@/components/stories/meta";
import { Button } from "@/components/ui/button";

/**
 * A short stop between the unlock button and Selar / Gumroad. Each visit here is a page view,
 * which is how unlock clicks are counted on Vercel's free plan (it has no click events).
 */
const PROVIDERS = {
  selar: { name: "Selar", url: (i: { selarUrl: string }) => i.selarUrl },
  gumroad: { name: "Gumroad", url: (i: { gumroadUrl: string }) => i.gumroadUrl },
} as const;

export const Route = createFileRoute("/out/$slug/$issue/$provider")({
  loader: ({ params }) => {
    const story = getStory(params.slug);
    const issue = story && getIssue(story, Number(params.issue));
    if (!story || !issue || !(params.provider in PROVIDERS)) throw notFound();
    return {
      slug: story.slug,
      issue: issue.number,
      provider: params.provider as keyof typeof PROVIDERS,
    };
  },
  component: Leaving,
  head: ({ params }) => ({
    meta: storyMeta({
      title: "Taking you to checkout — Cairn",
      description: "Unlock the full issue.",
      image: shareImageSrc(params.slug),
      path: `/stories/${params.slug}`,
      noindex: true,
    }),
  }),
});

function Leaving() {
  const { slug, issue: n, provider } = Route.useLoaderData();
  const story = getStory(slug)!;
  const issue = getIssue(story, n)!;
  const p = PROVIDERS[provider];
  const url = p.url(issue);
  const ready = !isTodoLink(url);
  const price = provider === "selar" ? formatNgn(issue.priceNgn) : formatUsd(issue.priceUsd);

  useEffect(() => {
    if (!ready) return;
    // A short pause lets the page view register before the browser leaves.
    const t = setTimeout(() => window.location.assign(url), 500);
    return () => clearTimeout(t);
  }, [ready, url]);

  return (
    <StoryShell>
      <div className="page-narrow grid min-h-[60dvh] place-content-center py-16 text-center">
        {ready ? (
          <>
            <p className="font-display text-3xl text-ink">Taking you to {p.name}…</p>
            <p className="mt-3 text-muted">
              Pay {price} for {story.title}, Issue {issue.number}. The full issue comes to your
              email right after.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <a href={url}>Tap here if nothing happens</a>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="font-display text-3xl text-ink">Checkout opens soon</p>
            <p className="mt-3 text-muted">You can’t pay for this issue yet. Check back shortly.</p>
            <div className="mt-8">
              <Button asChild size="lg" variant="secondary">
                <Link to="/stories/$slug" params={{ slug }}>
                  Back to {story.title}
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </StoryShell>
  );
}
