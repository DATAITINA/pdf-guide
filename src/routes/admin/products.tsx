import { createFileRoute, Link } from "@tanstack/react-router";
import { listAdminProducts } from "@/lib/store/admin";
import { formatMoney } from "@/lib/store/money";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/products")({
  loader: () => listAdminProducts(),
  component: ProductsPage,
});

function ProductsPage() {
  const data = Route.useLoaderData();
  return (
    <main className="px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Products</h1>
        <Button asChild>
          <Link to="/admin/product/$id" params={{ id: "new" }}>
            Add product
          </Link>
        </Button>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs tracking-wide text-subtle uppercase">
            <tr>
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium">Category</th>
              <th className="py-2 font-medium">Price</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="py-3">
                  <Link to="/admin/product/$id" params={{ id: p.id }} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted">/{p.slug}</p>
                </td>
                <td>{p.categoryName}</td>
                <td className="tabular-nums">{formatMoney(p.priceKobo, p.currency)}</td>
                <td>
                  {p.isPlaceholder ? "Demo" : p.archived ? "Archived" : p.published ? "Published" : "Draft"}
                  {p.hasPdf ? "" : " · no PDF"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
