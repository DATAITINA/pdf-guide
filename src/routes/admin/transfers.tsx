import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { listAdminOrders, reviewTransfer } from "@/lib/store/admin";
import { formatMoney } from "@/lib/store/money";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/transfers")({
  loader: () => listAdminOrders({ data: { status: "pending_verification" } }),
  component: TransfersPage,
});

function TransfersPage() {
  const data = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const [notes, setNotes] = useState<Record<string, string>>({});
  // Links for transfers approved on this visit, so they can be sent to the buyer
  // (needed when automatic email isn't set up).
  const [approved, setApproved] = useState<{ ref: string; email: string; title: string; link: string }[]>([]);

  async function act(orderId: string, action: "approve" | "reject") {
    const order = data.orders.find((o) => o.id === orderId);
    try {
      const result = await reviewTransfer({
        data: { orderId, action, notes: notes[orderId], origin: window.location.origin },
      });
      if (action === "approve" && result.downloadPath && order) {
        setApproved((list) => [
          { ref: order.paymentReference, email: order.customerEmail, title: order.productTitle, link: window.location.origin + result.downloadPath },
          ...list,
        ]);
      }
      toast.success(action === "approve" ? "Transfer approved. PDF unlocked." : "Transfer rejected.");
      await navigate({ to: "/admin/transfers" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update transfer.");
    }
  }

  return (
    <main className="px-4 py-8 sm:px-8">
      <h1 className="font-display text-3xl">Pending transfers</h1>
      <p className="mt-2 text-sm text-muted">
        Approving unlocks the PDF and emails the customer if email is set up; otherwise copy the link shown after approval and send it yourself. Rejecting keeps the file locked.
      </p>
      {approved.length > 0 ? (
        <section className="mt-6 rounded-lg border border-ok/40 bg-ok-soft p-4" aria-live="polite">
          <h2 className="font-sans text-base font-semibold tracking-normal">Send these download links</h2>
          <p className="mt-1 text-sm text-muted">
            If automatic email isn’t set up, copy each link and send it to the buyer by email or WhatsApp.
          </p>
          <ul className="mt-3 space-y-3">
            {approved.map((a) => (
              <li key={a.ref} className="rounded-md bg-surface p-3 text-sm">
                <p className="font-medium">
                  {a.title} · {a.email} · {a.ref}
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 break-all text-xs">{a.link}</code>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void navigator.clipboard.writeText(a.link).then(() => toast.success("Link copied"))}
                  >
                    Copy link
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="mt-6 space-y-4">
        {data.orders.length === 0 ? <p className="text-muted">No transfers waiting.</p> : null}
        {data.orders.map((o) => (
          <article key={o.id} className="rounded-[18px] border border-line bg-surface p-4">
            <p className="font-medium">{o.productTitle}</p>
            <p className="text-sm text-muted">
              {o.customerName} · {o.customerEmail} · {formatMoney(o.amountKobo, o.currency)}
            </p>
            <p className="mt-1 text-xs">
              Order {o.paymentReference} · Bank ref {o.gatewayReference || "—"}
            </p>
            {o.hasProof ? (
              <a className="mt-2 inline-block text-sm underline" href={`/api/admin/proof/${o.id}`} target="_blank" rel="noreferrer">
                View proof
              </a>
            ) : (
              <p className="mt-2 text-sm text-warn">No proof file attached.</p>
            )}
            <textarea
              className="mt-3 h-20 w-full rounded-[12px] border border-line bg-paper px-3 py-2 text-sm"
              placeholder="Admin notes"
              value={notes[o.id] ?? ""}
              onChange={(e) => setNotes((m) => ({ ...m, [o.id]: e.target.value }))}
            />
            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={() => void act(o.id, "approve")}>
                Approve
              </Button>
              <Button type="button" variant="danger" onClick={() => void act(o.id, "reject")}>
                Reject
              </Button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
