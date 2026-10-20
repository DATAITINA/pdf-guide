import { useEffect, useRef } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { pageview } from "@vercel/analytics";
import {
  formatNgn,
  formatUsd,
  getIssue,
  getStory,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  pageSrc,
  shareImageSrc,
  teaserSrc,
  visibleHook,
} from "@/content/stories";
import { StoryShell } from "@/components/stories/shell";
import { ShareButtons } from "@/components/stories/share-buttons";
import { AlertForm } from "@/components/stories/alert-form";
import { storyMeta } from "@/components/stories/meta";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/read/$slug/$issue")({
  loader: ({ params }) => {
    const story = getStory(params.slug);
    const issue = story && getIssue(story, Number(params.issue));
    if (!story || !issue || issue.status !== "live") throw notFound();
    return { slug: story.slug, issue: issue.number };
  },
  component: Reader,
  head: ({ params }) => {
    const story = getStory(params.slug);
    const issue = story && getIssue(story, Number(params.issue));
    if (!story || !issue) return {};
    return {
      meta: storyMeta({
        title: `Read ${story.title}, Issue ${issue.number}: ${issue.title} — Cairn`,
        description: visibleHook(story),
        image: shareImageSrc(story.slug),
        path: `/read/${story.slug}/${issue.number}`,
      }),
    };
  },
});

function Reader() {
  const { slug, issue: n } = Route.useLoaderData();
  const story = getStory(slug)!;
  const issue = getIssue(story, n)!;
  const pages = Array.from({ length: issue.freePages }, (_, i) => i + 1);
  const next = story.issues.find((i) => i.status === "coming-soon");

  return (
    <StoryShell bare>
      <ProgressBar />
      <header className="sticky top-0 z-30 border-b border-line/60 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-[720px] items-center justify-between gap-3 px-2">
          <Link
            to="/stories/$slug"
            params={{ slug }}
            className="inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-sm font-semibold text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden /> {story.title}
          </Link>
          <p className="truncate px-2 text-sm text-muted">
            Issue {issue.number}: {issue.title}
          </p>
        </div>
      </header>

      {/* One page per screen width. Native pinch-zoom is left on (no maximum-scale in the viewport). */}
      <ol className="mx-auto max-w-[720px]" aria-label="Pages">
        {pages.map((p) => (
          <li key={p}>
            <img
              src={pageSrc(slug, n, p)}
              alt={`Page ${p}`}
              width={PAGE_WIDTH}
              height={PAGE_HEIGHT}
              loading={p === 1 ? "eager" : "lazy"}
              fetchPriority={p === 1 ? "high" : "auto"}
              decoding="async"
              className="block h-auto w-full"
            />
          </li>
        ))}
      </ol>

      <TheLock slug={slug} n={n} />

      <div className="mx-auto grid max-w-[720px] gap-8 px-4 pt-10 pb-16">
        <ShareButtons path={`/stories/${slug}`} text={`${story.title}: ${visibleHook(story)}`} />
        <AlertForm
          slug={slug}
          title={next ? `Get told when ${next.title} drops` : "Get told when the next issue drops"}
        />
      </div>
    </StoryShell>
  );
}

function TheLock({ slug, n }: { slug: string; n: number }) {
  const issue = getIssue(getStory(slug)!, n)!;
  const ref = useRef<HTMLElement>(null);

  // Count "reached the lock" as its own page view, once per visit (free Vercel plan has no click events).
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          pageview({ route: "/read/[slug]/[issue]/lock", path: `/read/${slug}/${n}/lock` });
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [slug, n]);

  const locked = issue.freePages + 1;
  return (
    <section
      ref={ref}
      id="unlock"
      className="relative mx-auto max-w-[720px] scroll-mt-12 overflow-hidden"
    >
      {/* Already blurred inside the file: there is nothing sharp to recover. */}
      <img
        src={teaserSrc(slug, n)}
        alt=""
        aria-hidden
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-paper/50 via-paper/80 to-paper" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-fg">
          <Lock className="size-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-3xl leading-tight text-ink sm:text-4xl">
          {issue.lock.title}
        </h2>
        <p className="mt-3 max-w-sm text-muted">{issue.lock.line}</p>
        <div className="mt-7 grid w-full max-w-xs gap-3">
          <Button asChild size="lg">
            <Link
              to="/out/$slug/$issue/$provider"
              params={{ slug, issue: String(n), provider: "selar" }}
            >
              Unlock for {formatNgn(issue.priceNgn)}
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link
              to="/out/$slug/$issue/$provider"
              params={{ slug, issue: String(n), provider: "gumroad" }}
            >
              Unlock for {formatUsd(issue.priceUsd)}
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted">
          Full issue sent to your email right after you pay.
        </p>
        <p className="mt-1 text-xs text-subtle">
          Pages {locked}–{issue.totalPages} are in the full issue.
        </p>
      </div>
    </section>
  );
}

/** Thin bar at the very top showing how far down the page the reader is. */
function ProgressBar() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5" aria-hidden>
      <div ref={bar} className="h-full origin-left scale-x-0 bg-accent" />
    </div>
  );
}
