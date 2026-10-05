import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
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
  head: () => ({ meta: [{ title: "Pay by bank transfer" }, { name: "robots", content: "noindex" }] }),
});

function TransferPage() {
  const data = Route.useLoaderData();
  const order = data.order!;
  const [done, setDone] = useState(order.status === "pending_verification");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const s = data.settings;
  const amount = formatMoney(order.amountKobo, order.currency);
  const bankReady = Boolean(s.bankName && s.accountName && s.accountNumber);
  const waDigits = (s.whatsapp || "").replace(/\D/g, "");
  const paid = order.status === "paid";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("proof") as File | null;
    if (!file || file.size === 0) {
      setFormError("Please attach a photo or PDF of your transfer receipt.");
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
      setFormError(err instanceof Error ? err.message : "Could not send your receipt. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell settings={data.settings}>
      <section className="page-narrow section-sm">
        <p className="eyebrow">Bank transfer</p>
        <h1 className="h-section mt-3 text-ink">Pay {amount} by bank transfer</h1>
        <p className="lead mt-4">
          For <span className="font-semibold text-ink">{order.title}</span>. Keep this page open, or save its link.
        </p>

        {paid ? (
          <p className="mt-8 rounded-lg bg-ok-soft px-5 py-4 text-ok">
            This order is paid. If your download link hasn’t reached {order.email}, message us with reference{" "}
            {order.reference} and we’ll resend it.
          </p>
        ) : !bankReady ? (
          <p className="card-soft mt-8 px-5 py-4 text-ink">
            Our bank details aren’t on the site right now.{" "}
            {waDigits ? (
              <a className="link" href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer">
                Message us on WhatsApp
              </a>
            ) : (
              "Contact us"
            )}{" "}
            with your order reference <span className="font-semibold tabular-nums">{order.reference}</span> and we’ll
            help you pay.
          </p>
        ) : (
          <>
            <ol className="mt-10 space-y-10">
              <li>
                <StepTitle n={1}>Send the exact amount to this account</StepTitle>
                <dl className="card mt-4 divide-y divide-line">
                  <CopyRow label="Amount" value={amount} copyValue={String(order.amountKobo / 100)} />
                  <CopyRow label="Bank" value={s.bankName} />
                  <CopyRow label="Account name" value={s.accountName} />
                  <CopyRow label="Account number" value={s.accountNumber} copyValue={s.accountNumber} />
                  <CopyRow
                    label="Reference"
                    value={order.reference}
                    copyValue={order.reference}
                    hint="Put this in the transfer note if your bank app allows it."
                  />
                </dl>
              </li>
              <li>
                <StepTitle n={2}>Upload your receipt</StepTitle>
                {done ? (
                  <div className="mt-4 rounded-lg bg-ok-soft px-5 py-4 text-ink" role="status">
                    <p className="font-semibold text-ok">Receipt received. Thank you.</p>
                    <p className="mt-1">
                      We’ll check the transfer and send your download link to{" "}
                      <span className="font-semibold">{order.email}</span> once it’s confirmed.
                    </p>
                  </div>
                ) : (
                  <form className="mt-4 space-y-6" onSubmit={onSubmit} noValidate>
                    <Field label="Transaction reference from your bank" hint="Shown on your bank app’s receipt.">
                      <Input name="transferReference" required minLength={3} />
                    </Field>
                    <Field label="Receipt" hint="A screenshot or PDF of the transfer. JPG, PNG, WebP or PDF, up to 6MB.">
                      <Input
                        name="proof"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        required
                        className="py-2.5 file:mr-3 file:min-h-10 file:rounded-sm file:border-0 file:bg-paper-2 file:px-3 file:font-semibold file:text-ink"
                      />
                    </Field>
                    <Field label="Note" optional>
                      <Textarea name="note" rows={3} />
                    </Field>
                    {formError ? (
                      <p className="rounded-md bg-danger-soft px-4 py-3 text-danger" role="alert">
                        {formError}
                      </p>
                    ) : null}
                    <Button type="submit" size="lg" disabled={pending} className="w-full">
                      {pending ? "Sending…" : "Send my receipt"}
                    </Button>
                  </form>
                )}
              </li>
              <li>
                <StepTitle n={3}>Get your download link</StepTitle>
                <p className="mt-3 text-muted">
                  The PDF unlocks once we’ve confirmed your transfer. Uploading a receipt doesn’t unlock it on its own.
                  {waDigits ? (
                    <>
                      {" "}
                      Questions?{" "}
                      <a className="link" href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer">
                        Message us on WhatsApp
                      </a>
                      .
                    </>
                  ) : null}
                </p>
              </li>
            </ol>
          </>
        )}
      </section>
    </PageShell>
  );
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 font-sans text-lg font-semibold tracking-normal text-ink">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm text-accent-fg">{n}</span>
      {children}
    </h2>
  );
}

function CopyRow({ label, value, copyValue, hint }: { label: string; value: string; copyValue?: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyValue ?? value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the value is still on screen to copy by hand */
    }
  }
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="min-w-0">
        <dt className="text-sm text-muted">{label}</dt>
        <dd className="font-semibold break-words text-ink tabular-nums">{value}</dd>
        {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      </div>
      {copyValue ? (
        <Button type="button" variant="secondary" size="sm" onClick={() => void copy()} aria-label={`Copy ${label.toLowerCase()}`}>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      ) : null}
    </div>
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
