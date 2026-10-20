import { createFileRoute, Link } from "@tanstack/react-router";
import { FILTERS, type FilterId, matchesFilter, shareImageSrc, STORIES } from "@/content/stories";
import { StoryShell } from "@/components/stories/shell";
import { StoryCard } from "@/components/stories/story-card";
import { storyMeta } from "@/components/stories/meta";

const FILTER_IDS = FILTERS.map((f) => f.id) as string[];

export const Route = createFileRoute("/stories/")({
  validateSearch: (search: Record<string, unknown>): { filter?: FilterId } =>
    typeof search.filter === "string" && FILTER_IDS.includes(search.filter)
      ? { filter: search.filter as FilterId }
      : {},
  component: Library,
  head: () => ({
    meta: storyMeta({
      title: "All stories — Cairn",
      description: "Comics, short stories and folklore from Lagos and beyond. Start reading free.",
      image: shareImageSrc(STORIES[0]!.slug),
      path: "/stories",
    }),
  }),
});

function Library() {
  const { filter } = Route.useSearch();
  const shown = filter ? STORIES.filter((s) => matchesFilter(s, filter)) : STORIES;

  return (
    <StoryShell>
      <div className="page pt-10">
        <h1 className="font-display text-4xl text-ink">All stories</h1>
        <nav
          className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]"
          aria-label="Filter stories"
        >
          <Link to="/stories" search={{}} className="chip shrink-0" aria-pressed={!filter}>
            All
          </Link>
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              to="/stories"
              search={{ filter: f.id }}
              className="chip shrink-0"
              aria-pressed={filter === f.id}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        {shown.length ? (
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {shown.map((story) => (
              <li key={story.slug}>
                <StoryCard story={story} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 text-muted">Nothing here yet. New stories are on the way.</p>
        )}
      </div>
    </StoryShell>
  );
}
