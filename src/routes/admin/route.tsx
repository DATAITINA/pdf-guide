import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/transfers", label: "Transfers" },
  { to: "/admin/waitlist", label: "Waitlist" },
  { to: "/admin/settings", label: "Settings" },
] as const;

function AdminLayout() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="grid min-h-dvh place-items-center bg-paper text-muted">Loading…</div>;
  }
  if (!user) return <RedirectToSignIn to="/login" />;

  return (
    <div className="min-h-dvh bg-paper text-ink md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-line md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link to="/" className="font-display text-xl">
            Cairn
          </Link>
          <p className="hidden text-xs text-muted md:mt-1 md:block">Publisher</p>
          <div className="md:mt-6">
            <UserButton />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:px-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block rounded-[10px] px-3 py-2 text-sm hover:bg-paper-2 [&.active]:bg-accent [&.active]:text-accent-fg"
              activeOptions={{ exact: item.to === "/admin" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
      {/* Toasts are only used by the publisher pages, so they load here, not for customers. */}
      <Toaster position="top-center" richColors={false} />
    </div>
  );
}
