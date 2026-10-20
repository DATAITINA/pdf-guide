import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";
import {
  coverSrc,
  formatNgn,
  formatUsd,
  getStory,
  shareImageSrc,
  visibleHook,
} from "@/content/stories";
import { StoryShell } from "@/components/stories/shell";
import { ShareButtons } from "@/components/stories/share-buttons";
import { AlertForm } from "@/components/stories/alert-form";
import { storyMeta } from "@/components/stories/meta";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/stories/$slug")({
  loader: ({ params }) => {
    if (!getStory(params.slug)) throw notFound();
    return { slug: params.slug };
  },
  component: StoryPage,
  head: ({ params }) => {
    const story = getStory(params.slug);
    if (!story) return {};
    return {
      meta: storyMeta({
        title: `${story.title} — Cairn`,
        description: visibleHook(story),
        image: shareImageSrc(story.slug),
        path: `/stories/${story.slug}`,
      }),
    };
  },
});

function StoryPage() {
  const { slug } = Route.useLoaderData();
  const story = getStory(slug)!;
  const current = story.issues.find((i) => i.status === "live");
  const next = story.issues.find((i) => i.status === "coming-soon");
  const alertTitle = current
    ? next
      ? `Get told when ${next.title} drops`
      : "Get told when the next issue drops"
    : `Get told when ${story.title} is out`;

  return (
    <StoryShell>
      <article className="page grid gap-8 pt-8 md:grid-cols-[auto_1fr] md:gap-12 md:pt-14">
        <img
          src={coverSrc(slug)}
          alt={`${story.title} cover`}
          width={800}
          height={1200}
          fetchPriority="high"
          className="mx-auto w-56 rounded-xl shadow-raised ring-1 ring-line/60 sm:w-64 md:w-72"
        />
        <div className="max-w-xl">
          <ul className="flex flex-wrap gap-2" aria-label="Genre">
            {story.tags.map((t) => (
              <li
                key={t}
                className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted"
              >
                {t}
              </li>
            ))}
          </ul>
          <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {story.title}
          </h1>
          <p className="lead mt-4 text-ink">{visibleHook(story)}</p>

          {current ? (
            <>
              <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-surface p-3">
                  <dt className="text-subtle">Issue</dt>
                  <dd className="mt-1 font-semibold text-ink">{current.number}</dd>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <dt className="text-subtle">Pages</dt>
                  <dd className="mt-1 font-semibold text-ink">{current.totalPages}</dd>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <dt className="text-subtle">Price</dt>
                  <dd className="mt-1 font-semibold whitespace-nowrap text-ink">
                    {formatNgn(current.priceNgn)} · {formatUsd(current.priceUsd)}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/read/$slug/$issue" params={{ slug, issue: String(current.number) }}>
                    Read free preview <ArrowRight className="size-5" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Link
                    to="/read/$slug/$issue"
                    params={{ slug, issue: String(current.number) }}
                    hash="unlock"
                  >
                    <Lock className="size-4" aria-hidden /> Unlock full issue
                  </Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted">
                Pages 1–{current.freePages} are free. No account needed.
              </p>
            </>
          ) : (
            <p className="mt-6 inline-block rounded-full bg-accent-soft px-4 py-2 font-semibold text-accent">
              Coming soon
            </p>
          )}

          {story.issues.length ? (
            <section className="mt-10" aria-labelledby="issues">
              <h2 id="issues" className="font-display text-2xl text-ink">
                Issues
              </h2>
              <ol className="mt-4 divide-y divide-line rounded-xl border border-line">
                {story.issues.map((issue) => (
                  <li
                    key={issue.number}
                    className="flex min-h-16 items-center justify-between gap-4 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-ink">
                        Issue {issue.number}
                        {issue.title !== `Issue ${issue.number}` ? `: ${issue.title}` : ""}
                      </p>
                      <p className="text-sm text-muted">
                        {issue.status === "live" ? `${issue.totalPages} pages` : "Coming soon"}
                      </p>
                    </div>
                    {issue.status === "live" ? (
                      <Link
                        to="/read/$slug/$issue"
                        params={{ slug, issue: String(issue.number) }}
                        className="link link-tap shrink-0"
                      >
                        Read
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <div className="mt-10 grid gap-8">
            <AlertForm slug={slug} title={alertTitle} />
            <ShareButtons
              path={`/stories/${slug}`}
              text={`${story.title}: ${visibleHook(story)}`}
            />
          </div>
        </div>
      </article>
    </StoryShell>
  );
}
