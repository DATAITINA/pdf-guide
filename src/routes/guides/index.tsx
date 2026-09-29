import { createFileRoute, Link } from "@tanstack/react-router";
import { listCatalogue } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";
import { ProductCard } from "@/components/store/product-card";
import { Input } from "@/components/ui/input";

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
      { name: "description", content: "Browse practical digital PDF guides." },
    ],
  }),
});

function Catalogue() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <PageShell settings={data.settings}>
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-20 sm:px-6">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">Catalogue</p>
        <h1 className="mt-2 font-display text-4xl">All guides</h1>
        <p className="mt-3 max-w-xl text-muted">Search by title, filter by category, and open a guide to see what’s inside.</p>

        <form
          className="mt-8 grid gap-3 md:grid-cols-[1fr_200px_180px]"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void navigate({
              search: {
                q: String(fd.get("q") || "") || undefined,
                category: String(fd.get("category") || "") || undefined,
                sort: (String(fd.get("sort") || "newest") as GuideSearch["sort"]) || "newest",
              },
            });
          }}
        >
          <Input name="q" defaultValue={search.q ?? ""} placeholder="Search guides" aria-label="Search guides" />
          <select
            name="category"
            defaultValue={search.category ?? ""}
            className="h-12 rounded-[12px] border border-line bg-surface px-3 text-sm"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={search.sort ?? "newest"}
            className="h-12 rounded-[12px] border border-line bg-surface px-3 text-sm"
            aria-label="Sort guides"
          >
            <option value="newest">Featured / newest</option>
            <option value="title">Title</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
          <button type="submit" className="sr-only">
            Apply
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {data.categories.map((c) => (
            <Link
              key={c.id}
              to="/guides"
              search={{ ...search, category: c.slug }}
              className={`rounded-full px-3 py-1.5 text-sm ${
                search.category === c.slug ? "bg-accent text-accent-fg" : "bg-paper-2 text-ink"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {data.products.length === 0 ? (
          <p className="mt-16 text-muted">No guides match that search yet.</p>
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
