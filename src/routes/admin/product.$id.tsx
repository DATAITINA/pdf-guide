import { createFileRoute } from "@tanstack/react-router";
import { getAdminProduct } from "@/lib/store/admin";
import { ProductForm } from "@/components/admin/product-form";

export const Route = createFileRoute("/admin/product/$id")({
  loader: ({ params }) => getAdminProduct({ data: { id: params.id } }),
  component: AdminProductPage,
});

function AdminProductPage() {
  const data = Route.useLoaderData();
  return (
    <main className="px-4 py-8 sm:px-8">
      <h1 className="mb-6 font-display text-3xl">{data.product ? "Edit product" : "Add product"}</h1>
      <ProductForm product={data.product} categories={data.categories} />
    </main>
  );
}
