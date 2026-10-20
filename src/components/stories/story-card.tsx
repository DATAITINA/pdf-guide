import { Link } from "@tanstack/react-router";
import { coverSrc, type Story, visibleHook } from "@/content/stories";
import { cn } from "@/lib/utils";

export function StoryCard({ story, className }: { story: Story; className?: string }) {
  const soon = story.status === "coming-soon";
  return (
    <Link
      to="/stories/$slug"
      params={{ slug: story.slug }}
      className={cn("group block", className)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-paper-2 ring-1 ring-line/60">
        <img
          src={coverSrc(story.slug)}
          alt=""
          width={800}
          height={1200}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        {soon ? (
          <span className="absolute top-2 left-2 rounded-full bg-paper/85 px-2.5 py-1 text-xs font-semibold text-ink">
            Coming soon
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-xs font-semibold tracking-wide text-accent uppercase">
        {story.tags[0]}
      </p>
      <h3 className="mt-1 font-display text-lg leading-tight text-ink">{story.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{visibleHook(story)}</p>
    </Link>
  );
}

/** A titled row that scrolls sideways on phones. Hidden when it has nothing to show. */
export function StoryRow({ title, stories }: { title: string; stories: Story[] }) {
  if (stories.length === 0) return null;
  return (
    <section className="page mt-12" aria-label={title}>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {stories.map((story) => (
          <li key={story.slug} className="w-40 shrink-0 snap-start sm:w-48">
            <StoryCard story={story} />
          </li>
        ))}
      </ul>
    </section>
  );
}
