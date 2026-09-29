import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getBankDetails, submitBankTransfer } from "@/lib/store/payments";
import { formatMoney } from "@/lib/store/money";
import { PageShell } from "@/components/store/layout";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

export const Route = createFileRoute("/checkout/transfer/$orderId")({
  loader: async ({ params }) => {
    const data = await getBankDetails({ data: { orderId: params.orderId } });
    if (!data.order) throw notFound();
    return data;
  },
  component: TransferPage,
});

function TransferPage() {
  const data = Route.useLoaderData();
  const order = data.order!;
  const [done, setDone] = useState(order.status === "pending_verification");
  const [pending, setPending] = useState(false);
  const s = data.settings;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("proof") as File | null;
    if (!file || file.size === 0) {
      toast.error("Please attach proof of payment.");
      return;
    }
    setPending(true);
    try {
      const proofBase64 = await fileToBase64(file);
      await submitBankTransfer({
        data: {
          orderId: order.id,
          transferReference: String(fd.get("transferReference") || ""),
          note: String(fd.get("note") || "") || undefined,
          proofName: file.name,
          proofMime: file.type || "application/octet-stream",
          proofBase64,
        },
      });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit transfer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell settings={data.settings}>
      <section className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Bank transfer</p>
        <h1 className="mt-2 font-display text-4xl">Send payment, then upload proof</h1>
        <p className="mt-3 text-muted">
          Transfer the exact amount for <strong>{order.title}</strong>. Uploading a receipt does not unlock the PDF. The publisher reviews it first.
        </p>

        <div className="mt-8 rounded-[22px] bg-paper-2 px-5 py-5 text-sm">
          <p><span className="text-muted">Bank</span> · {s.bankName || "Not configured"}</p>
          <p className="mt-1"><span className="text-muted">Account name</span> · {s.accountName || "Not configured"}</p>
          <p className="mt-1"><span className="text-muted">Account number</span> · {s.accountNumber || "Not configured"}</p>
          <p className="mt-3 font-medium tabular-nums">Amount · {formatMoney(order.amountKobo, order.currency)}</p>
          <p className="mt-1">Order reference · {order.reference}</p>
        </div>

        {done ? (
          <p className="mt-8 rounded-[18px] border border-line bg-surface px-4 py-4 text-sm leading-relaxed">
            Proof received. Your order is pending verification. You will be able to download the guide once the publisher confirms the transfer. Watch {order.email} if email delivery is configured.
          </p>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Field label="Bank transaction reference">
              <Input name="transferReference" required />
            </Field>
            <Field label="Proof of payment" hint="JPG, PNG, WebP or PDF, up to 6MB.">
              <Input name="proof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required />
            </Field>
            <Field label="Note (optional)">
              <Textarea name="note" rows={3} />
            </Field>
            <Button type="submit" disabled={pending} className="w-full">
              Submit for verification
            </Button>
          </form>
        )}
      </section>
    </PageShell>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
