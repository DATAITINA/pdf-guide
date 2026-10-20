import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  coverSrc,
  featuredStory,
  getIssue,
  shareImageSrc,
  STORIES,
  visibleHook,
} from "@/content/stories";
import { StoryShell } from "@/components/stories/shell";
import { StoryRow } from "@/components/stories/story-card";
import { storyMeta } from "@/components/stories/meta";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => {
    const hero = featuredStory();
    return {
      meta: storyMeta({
        title: "Cairn: stories that won’t let you go",
        description: "Original African stories and comics. Start reading free on your phone.",
        image: hero ? shareImageSrc(hero.slug) : "/og.jpg",
        path: "/",
      }),
    };
  },
});

function Home() {
  const hero = featuredStory();
  const newest = [...STORIES]
    .filter((s) => s.status === "live")
    .sort((a, b) => b.addedOn.localeCompare(a.addedOn));

  return (
    <StoryShell>
      {hero ? <Hero slug={hero.slug} /> : null}
      <StoryRow title="New" stories={newest} />
      <StoryRow title="Comics" stories={STORIES.filter((s) => s.kind === "comic")} />
      <StoryRow title="Short stories" stories={STORIES.filter((s) => s.kind === "story")} />
      <StoryRow title="Coming soon" stories={STORIES.filter((s) => s.status === "coming-soon")} />
      <div className="page mt-12">
        <Link to="/stories" className="link link-tap">
          See every story <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </StoryShell>
  );
}

function Hero({ slug }: { slug: string }) {
  const story = STORIES.find((s) => s.slug === slug)!;
  const issue = getIssue(story, 1);
  return (
    <section className="relative isolate overflow-hidden">
      {/* The cover again, blurred, as a soft cinematic glow behind the hero on phones. */}
      <img
        src={coverSrc(slug)}
        alt=""
        aria-hidden
        width={800}
        height={1200}
        className="absolute inset-0 -z-10 size-full scale-110 object-cover opacity-40 blur-sm md:hidden"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-paper via-paper/80 to-paper/30 md:hidden" />

      <div className="page grid items-center gap-6 pt-8 pb-12 md:grid-cols-[1fr_auto] md:gap-16 md:py-20">
        <div className="animate-rise-in max-w-xl">
          <p className="mb-4 text-sm text-muted">Stories that won’t let you go.</p>
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">
            {story.tags.join(" · ")}
          </p>
          <h1 className="mt-3 font-display text-5xl leading-none text-ink sm:text-6xl">
            {story.title}
          </h1>
          {issue ? (
            <p className="mt-3 text-muted">
              Issue {issue.number}: {issue.title} · Pages 1–{issue.freePages} free
            </p>
          ) : null}
          <p className="lead mt-5 text-ink">{visibleHook(story)}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/read/$slug/$issue" params={{ slug, issue: "1" }}>
                Start reading free <ArrowRight className="size-5" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
              <Link to="/stories/$slug" params={{ slug }}>
                About this story
              </Link>
            </Button>
          </div>
        </div>
        <img
          src={coverSrc(slug)}
          alt={`${story.title} cover`}
          width={800}
          height={1200}
          fetchPriority="high"
          className="animate-fade-in order-first w-36 rounded-xl shadow-raised ring-1 ring-line/60 sm:w-44 md:order-none md:w-72 lg:w-80"
        />
      </div>
    </section>
  );
}
