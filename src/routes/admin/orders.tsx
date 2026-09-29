import { createFileRoute } from "@tanstack/react-router";
import { listAdminOrders } from "@/lib/store/admin";
import { formatMoney } from "@/lib/store/money";

export const Route = createFileRoute("/admin/orders")({
  loader: () => listAdminOrders({ data: {} }),
  component: OrdersPage,
});

function OrdersPage() {
  const data = Route.useLoaderData();
  return (
    <main className="px-4 py-8 sm:px-8">
      <h1 className="font-display text-3xl">Orders</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="text-xs tracking-wide text-subtle uppercase">
            <tr>
              <th className="py-2 font-medium">Customer</th>
              <th className="py-2 font-medium">Product</th>
              <th className="py-2 font-medium">Amount</th>
              <th className="py-2 font-medium">Method</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o.id} className="border-t border-line align-top">
                <td className="py-3">
                  {o.customerName}
                  <p className="text-xs text-muted">{o.customerEmail}</p>
                </td>
                <td className="py-3">{o.productTitle}</td>
                <td className="py-3 tabular-nums">{formatMoney(o.amountKobo, o.currency)}</td>
                <td className="py-3">{o.paymentMethod}</td>
                <td className="py-3">{o.status}</td>
                <td className="py-3 text-xs">
                  {o.paymentReference}
                  <p className="text-muted">Downloads: {o.downloadCount}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.orders.length === 0 ? <p className="mt-6 text-muted">No orders yet.</p> : null}
      </div>
    </main>
  );
}
