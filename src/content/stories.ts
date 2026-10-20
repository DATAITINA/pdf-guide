/**
 * Every story and comic on Cairn lives in this one file. No database.
 *
 * To add a story: put its images in `public/stories/<slug>/` (see README → "Adding a story")
 * and add one entry to STORIES below. Image paths come from the slug and issue number,
 * so there is nothing else to wire up.
 *
 * Only free preview pages and ONE pre-blurred teaser per issue are ever on the site.
 * The full issue is delivered by Selar / Gumroad after payment.
 */

export type StoryKind = "comic" | "story";
export type Status = "live" | "coming-soon";

/** Library filters. "comic" / "story" match `kind`; the rest match `tags`. */
export const FILTERS = [
  { id: "comics", label: "Comics" },
  { id: "stories", label: "Stories" },
  { id: "folklore", label: "Folklore" },
  { id: "lagos", label: "Lagos" },
  { id: "campus", label: "Campus" },
  { id: "childhood", label: "Childhood" },
] as const;
export type FilterId = (typeof FILTERS)[number]["id"];

export interface Issue {
  number: number;
  title: string;
  status: Status;
  /** Pages in the full issue. */
  totalPages: number;
  /** Pages 1..freePages are free on the site. The lock shows the next page, blurred. */
  freePages: number;
  priceNgn: number;
  priceUsd: number;
  /** Selar checkout link (₦). A link containing "TODO" shows "coming soon" instead of sending readers to a dead page. */
  selarUrl: string;
  /** Gumroad checkout link ($). Same TODO rule. */
  gumroadUrl: string;
  /** Words on the lock screen. */
  lock: { title: string; line: string };
}

export interface Story {
  slug: string;
  title: string;
  /** One line that makes people want to read. Also used when the link is shared. */
  hook: string;
  kind: StoryKind;
  /** Shown as genre tags. Lower-case versions are matched by the library filters. */
  tags: string[];
  status: Status;
  /** Shown big on the home page. Only one story should be featured. */
  featured?: boolean;
  /** ISO date, newest first in the "New" row. */
  addedOn: string;
  issues: Issue[];
}

export const STORIES: Story[] = [
  {
    slug: "danfo-13",
    title: "Danfo 13",
    hook: "A ghost bus runs through Lagos at 3 a.m. Its stops are days from your past. The fare is days from your future.",
    kind: "comic",
    tags: ["Comic", "Lagos", "Supernatural"],
    status: "live",
    featured: true,
    addedOn: "2026-10-20",
    issues: [
      {
        number: 1,
        title: "The Fare",
        status: "live",
        totalPages: 10,
        freePages: 3,
        priceNgn: 1500,
        priceUsd: 3,
        selarUrl: "https://selar.com/TODO-danfo-13-issue-1",
        gumroadUrl: "https://gumroad.com/l/TODO-danfo-13-issue-1",
        lock: {
          title: "The Conductor wants his fare.",
          line: "He fixed his past. He didn't read the fine print.",
        },
      },
      {
        number: 2,
        title: "Issue 2",
        status: "coming-soon",
        totalPages: 0,
        freePages: 0,
        priceNgn: 1500,
        priceUsd: 3,
        selarUrl: "TODO",
        gumroadUrl: "TODO",
        lock: { title: "", line: "" },
      },
    ],
  },
  {
    slug: "nepa-took-the-light",
    title: "NEPA Took the Light",
    hook: "TODO: one-line hook.",
    kind: "story",
    tags: ["Childhood", "Horror"],
    status: "coming-soon",
    addedOn: "2026-10-20",
    issues: [],
  },
  {
    slug: "the-night-market",
    title: "The Night Market",
    hook: "TODO: one-line hook.",
    kind: "story",
    tags: ["Folklore"],
    status: "coming-soon",
    addedOn: "2026-10-20",
    issues: [],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Public address, used for share links and link previews. */
export const SITE_URL = "https://trycairn.vercel.app";

export const coverSrc = (slug: string) => `/stories/${slug}/cover.webp`;
/** 1200×630 image used when the story is shared on X / WhatsApp. */
export const shareImageSrc = (slug: string) => `/stories/${slug}/share.jpg`;
const issueDir = (slug: string, issue: number) => `/stories/${slug}/issue-${issue}`;
export const pageSrc = (slug: string, issue: number, page: number) =>
  `${issueDir(slug, issue)}/page-${String(page).padStart(2, "0")}.webp`;
/** The first locked page, already blurred inside the file. */
export const teaserSrc = (slug: string, issue: number) => `${issueDir(slug, issue)}/teaser.webp`;

/** Comic page images are 2:3 portrait. */
export const PAGE_WIDTH = 1067;
export const PAGE_HEIGHT = 1600;

export function getStory(slug: string): Story | undefined {
  return STORIES.find((s) => s.slug === slug);
}

export function getIssue(story: Story, number: number): Issue | undefined {
  return story.issues.find((i) => i.number === number);
}

export function featuredStory(): Story | undefined {
  return (
    STORIES.find((s) => s.featured && s.status === "live") ??
    STORIES.find((s) => s.status === "live")
  );
}

export function matchesFilter(story: Story, filter: FilterId): boolean {
  if (filter === "comics") return story.kind === "comic";
  if (filter === "stories") return story.kind === "story";
  return story.tags.some((t) => t.toLowerCase() === filter);
}

/** Hooks still marked TODO above are never shown to readers. */
export const visibleHook = (story: Story) =>
  story.hook.startsWith("TODO") ? "Coming soon." : story.hook;

/** True while a checkout link is still a placeholder. */
export const isTodoLink = (url: string) => !url || url.includes("TODO");

export const formatNgn = (n: number) => `₦${n.toLocaleString("en-NG")}`;
export const formatUsd = (n: number) => `$${n}`;
