import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { listCatalogue } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";
import { ProductCard } from "@/components/store/product-card";
import { Input } from "@/components/ui/input";
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
      { title: `Guides — ${loaderData?.settings.storeName ?? "Fieldnote"}` },
      {
        name: "description",
        content:
          "Browse practical digital PDF guides for parenting, money, work, and everyday life.",
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
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6 sm:pt-12">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">Catalogue</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">All guides</h1>
        <p className="mt-3 max-w-xl text-muted">
          Search by title, filter by category, and open a guide to see what’s inside before you buy.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              name="q"
              value={search.q ?? ""}
              onChange={(e) => updateSearch({ q: e.target.value })}
              placeholder="Search guides…"
              aria-label="Search guides"
              className="pl-10"
            />
            {search.q ? (
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 grid size-11 place-items-center rounded-full text-subtle transition-colors hover:bg-paper-2 hover:text-ink"
                aria-label="Clear search"
                onClick={() => updateSearch({ q: "" })}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <select
            name="sort"
            value={search.sort ?? "newest"}
            onChange={(e) => updateSearch({ sort: e.target.value as GuideSearch["sort"] })}
            className="h-12 rounded-[12px] border border-line bg-surface px-3 text-sm sm:w-48"
            aria-label="Sort guides"
          >
            <option value="newest">Featured / newest</option>
            <option value="title">Title A–Z</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!search.category}
            onClick={() => updateSearch({ category: "" })}
            className={`min-h-11 rounded-full px-4 text-sm transition-colors ${
              !search.category
                ? "bg-accent text-accent-fg"
                : "bg-paper-2 text-ink hover:bg-paper-2/80"
            }`}
          >
            All
          </button>
          {data.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={search.category === c.slug}
              onClick={() => updateSearch({ category: c.slug })}
              className={`min-h-11 rounded-full px-4 text-sm transition-colors ${
                search.category === c.slug
                  ? "bg-accent text-accent-fg"
                  : "bg-paper-2 text-ink hover:bg-paper-2/80"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {hasFilters ? (
          <p className="mt-4 text-sm text-muted">
            {data.products.length} {data.products.length === 1 ? "guide" : "guides"}
            {search.q ? (
              <>
                {" "}
                for <span className="font-medium text-ink">“{search.q}”</span>
              </>
            ) : null}
            {search.category ? (
              <>
                {" "}
                in{" "}
                <span className="font-medium text-ink">
                  {data.categories.find((c) => c.slug === search.category)?.name ?? search.category}
                </span>
              </>
            ) : null}
            {" · "}
            <button
              type="button"
              className="font-medium text-accent hover:underline"
              onClick={() => updateSearch({ q: "", category: "" })}
            >
              Clear filters
            </button>
          </p>
        ) : null}

        {data.products.length === 0 ? (
          <div className="mt-16 flex flex-col items-center rounded-[24px] border border-dashed border-line bg-surface px-6 py-16 text-center">
            <p className="font-display text-2xl tracking-tight">No published guides match yet</p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Try removing a filter, or request the topic you hoped to find.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6"
              onClick={() => updateSearch({ q: "", category: "" })}
            >
              Clear filters
            </Button>
            <Link to="/" className="mt-3 text-sm text-accent hover:underline">
              Back to home
            </Link>
            <a href="/#waitlist" className="mt-2 text-sm font-medium text-accent hover:underline">
              Suggest a topic
            </a>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
