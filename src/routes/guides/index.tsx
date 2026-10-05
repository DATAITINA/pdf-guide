import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { listCatalogue } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";
import { ProductCard } from "@/components/store/product-card";
import { Input, Select } from "@/components/ui/input";
import { PersonalGuideCta, RequestGuideLink, SectionHeading } from "@/components/store/blocks";
import { Button } from "@/components/ui/button";

type GuideSearch = {
  q?: string;
  category?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "title";
};

export const Route = createFileRoute("/guides/")({
  validateSearch: (search: Record<string, unknown>): GuideSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    sort:
      search.sort === "price-asc" || search.sort === "price-desc" || search.sort === "title"
        ? search.sort
        : "newest",
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listCatalogue({ data: deps }),
  component: Catalogue,
  head: ({ loaderData }) => ({
    meta: [
      { title: `Guides — ${loaderData?.settings.storeName ?? "Cairn"}` },
      {
        name: "description",
        content: "Ready-made PDF guides for everyday life, or ask for a personal guide made for your situation.",
      },
    ],
  }),
});

function Catalogue() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const updateSearch = (patch: Partial<GuideSearch>) => {
    void navigate({
      search: {
        q: patch.q !== undefined ? patch.q || undefined : search.q,
        category: patch.category !== undefined ? patch.category || undefined : search.category,
        sort: patch.sort ?? search.sort ?? "newest",
      },
    });
  };

  const hasFilters = Boolean(search.q || search.category);

  return (
    <PageShell settings={data.settings}>
      <section className="page section-sm">
        <SectionHeading
          as="h1"
          eyebrow="Ready-made guides"
          title="Guides already written"
          lead="Open a guide to see what’s inside before you buy. Each one is a PDF you keep on your phone."
        />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <label htmlFor="guide-search" className="sr-only">
              Search guides
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              id="guide-search"
              type="search"
              name="q"
              value={search.q ?? ""}
              onChange={(e) => updateSearch({ q: e.target.value })}
              placeholder="Search guides"
              className="pl-12"
            />
          </div>
          <div className="sm:w-56">
            <label htmlFor="guide-sort" className="sr-only">
              Sort guides
            </label>
            <Select
              id="guide-sort"
              name="sort"
              value={search.sort ?? "newest"}
              onChange={(e) => updateSearch({ sort: e.target.value as GuideSearch["sort"] })}
            >
              <option value="newest">Featured first</option>
              <option value="title">Title A–Z</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
            </Select>
          </div>
        </div>

        {data.categories.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
            <button
              type="button"
              className="chip"
              aria-pressed={!search.category}
              onClick={() => updateSearch({ category: "" })}
            >
              All
            </button>
            {data.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip"
                aria-pressed={search.category === c.slug}
                onClick={() => updateSearch({ category: c.slug })}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : null}

        {hasFilters ? (
          <p className="mt-4 flex flex-wrap items-center gap-x-2 text-muted" role="status">
            <span>
              {data.products.length} {data.products.length === 1 ? "guide" : "guides"}
              {search.q ? (
                <>
                  {" "}
                  for <span className="font-semibold text-ink">“{search.q}”</span>
                </>
              ) : null}
            </span>
            <button type="button" className="link link-tap" onClick={() => updateSearch({ q: "", category: "" })}>
              Clear filters
            </button>
          </p>
        ) : null}

        {data.products.length === 0 ? (
          <div className="card mt-10 flex flex-col items-center px-6 py-14 text-center">
            <h2 className="h-card text-ink">No guides match</h2>
            <p className="mt-2 max-w-sm text-muted">
              Try a different word, or ask for a guide made for your situation.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="secondary" onClick={() => updateSearch({ q: "", category: "" })}>
                Clear filters
              </Button>
              <Button asChild>
                <RequestGuideLink>Request a personal guide</RequestGuideLink>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} headingLevel="h2" />
            ))}
          </div>
        )}

        <div className="mt-16">
          <PersonalGuideCta title="Can’t find what you need?" />
        </div>
      </section>
    </PageShell>
  );
}
