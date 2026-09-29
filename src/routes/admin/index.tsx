import { createFileRoute } from "@tanstack/react-router";
import { getAdminDashboard } from "@/lib/store/admin";
import { formatMoney } from "@/lib/store/money";

export const Route = createFileRoute("/admin/")({
  loader: () => getAdminDashboard(),
  component: Dashboard,
});

function Dashboard() {
  const data = Route.useLoaderData();
  return (
    <main className="px-4 py-8 sm:px-8">
      <h1 className="font-display text-3xl">Overview</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={formatMoney(data.revenueKobo)} />
        <Stat label="Paid orders" value={String(data.paidOrders)} />
        <Stat label="All orders" value={String(data.totalOrders)} />
        <Stat label="Pending transfers" value={String(data.pendingTransfers)} />
      </div>
      <p className="mt-3 text-sm text-muted">Downloads recorded: {data.downloads}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Best-selling</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.bestSellers.length === 0 ? (
              <li className="text-muted">No paid sales yet.</li>
            ) : (
              data.bestSellers.map((row) => (
                <li key={row.title} className="flex justify-between gap-4">
                  <span>{row.title}</span>
                  <span className="tabular-nums text-muted">{row.n}</span>
                </li>
              ))
            )}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl">Recent purchases</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {data.recent.length === 0 ? (
              <li className="text-muted">No orders yet.</li>
            ) : (
              data.recent.map((order) => (
                <li key={order.id} className="rounded-[14px] bg-paper-2/80 px-3 py-3">
                  <p className="font-medium">{order.productTitle}</p>
                  <p className="text-muted">
                    {order.customerName} · {formatMoney(order.amountKobo, order.currency)} · {order.status}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-surface px-4 py-4">
      <p className="text-xs tracking-[0.14em] text-subtle uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}
