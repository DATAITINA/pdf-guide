import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getProductBySlug } from "@/lib/store/catalog";
import { startCheckout } from "@/lib/store/payments";
import { validateVoucher } from "@/lib/store/waitlist";
import { formatMoney } from "@/lib/store/money";
import { PageShell } from "@/components/store/layout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

type CheckoutSearch = { code?: string };

export const Route = createFileRoute("/checkout/$slug")({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  loader: async ({ params }) => {
    const data = await getProductBySlug({ data: { slug: params.slug } });
    if (!data.product) throw notFound();
    return data;
  },
  component: CheckoutPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `Checkout — ${loaderData?.product?.title ?? "Guide"}` }],
  }),
});

function CheckoutPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const product = data.product!;
  const [pendingMethod, setPendingMethod] = useState<"paystack" | "bank_transfer" | "demo" | null>(
    null,
  );
  const pending = pendingMethod !== null;
  const checkoutAvailable =
    data.payments.paystackConfigured ||
    data.payments.bankConfigured ||
    data.payments.demoCheckoutEnabled;
  const [voucherCode, setVoucherCode] = useState(search.code ?? "");
  const [voucherMsg, setVoucherMsg] = useState<string | null>(null);
  const [discountKobo, setDiscountKobo] = useState(0);
  const [finalKobo, setFinalKobo] = useState(product.priceKobo);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (search.code) {
      void applyCode(search.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyCode(codeOverride?: string) {
    const code = (codeOverride ?? voucherCode).trim();
    if (!code) {
      setDiscountKobo(0);
      setFinalKobo(product.priceKobo);
      setVoucherMsg(null);
      return;
    }
    setApplying(true);
    setVoucherMsg(null);
    try {
      const result = await validateVoucher({
        data: { code, productId: product.id },
      });
      if (!result.ok) {
        setDiscountKobo(0);
        setFinalKobo(product.priceKobo);
        setVoucherMsg(result.message);
        return;
      }
      setDiscountKobo(result.discountKobo);
      setFinalKobo(result.finalKobo);
      setVoucherCode(result.code);
      setVoucherMsg(`₦500 off applied for “${result.topicName}”.`);
      console.info("[analytics]", "voucher_applied");
    } catch (err) {
      setDiscountKobo(0);
      setFinalKobo(product.priceKobo);
      setVoucherMsg(err instanceof Error ? err.message : "Could not apply code.");
    } finally {
      setApplying(false);
    }
  }

  async function onSubmit(method: "paystack" | "bank_transfer" | "demo") {
    const form = document.getElementById("checkout-form");
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) return;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    setPendingMethod(method);
    try {
      const result = await startCheckout({
        data: {
          slug: product.slug,
          name,
          email,
          phone: phone || undefined,
          method,
          origin: window.location.origin,
          voucherCode: voucherCode.trim() || undefined,
        },
      });
      if (result.kind === "download") {
        window.location.href = result.downloadPath;
        return;
      }
      if (result.kind === "paystack") {
        window.location.href = result.authorizationUrl;
        return;
      }
      window.location.href = `/checkout/transfer/${result.orderId}`;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout.");
      setPendingMethod(null);
    }
  }

  return (
    <PageShell settings={data.settings}>
      <section className="mx-auto grid max-w-4xl gap-10 px-4 pt-12 pb-20 sm:px-6 md:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Checkout</p>
          <h1 className="mt-2 font-display text-4xl">Pay and download</h1>
          <p className="mt-3 text-muted">
            Enter your details. The price is set by the store — it cannot be changed at checkout.
          </p>

          {product.isPlaceholder ? (
            <p className="mt-8 rounded-[18px] bg-paper-2 px-4 py-4 text-sm">
              This is a demo listing and cannot be purchased.
            </p>
          ) : !checkoutAvailable ? (
            <div
              className="mt-8 rounded-[18px] border border-line bg-surface px-5 py-5"
              role="status"
            >
              <h2 className="font-display text-2xl tracking-tight">
                Checkout is temporarily unavailable
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                No payment method is ready yet, so this page will not collect your details or create
                an order. Please contact Fieldnote for help.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex min-h-11 items-center font-medium text-accent hover:underline"
              >
                Contact support
              </Link>
            </div>
          ) : (
            <form id="checkout-form" className="mt-8 space-y-4">
              <Field label="Full name">
                <Input name="name" autoComplete="name" minLength={2} maxLength={120} required />
              </Field>
              <Field label="Email" hint="Your download link is tied to this email.">
                <Input name="email" type="email" autoComplete="email" maxLength={200} required />
              </Field>
              <Field label="Phone (optional)">
                <Input name="phone" type="tel" autoComplete="tel" />
              </Field>

              <div className="rounded-[16px] border border-line bg-surface p-4">
                <p className="text-sm font-medium">Have a voucher code?</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="FN-XXXX-XXXX"
                    aria-label="Voucher code"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={applying}
                    onClick={() => void applyCode()}
                    className="sm:w-28"
                  >
                    {applying ? "…" : "Apply"}
                  </Button>
                </div>
                {voucherMsg ? (
                  <p
                    className={`mt-2 text-sm ${discountKobo > 0 ? "text-ok" : "text-danger"}`}
                    role="status"
                    aria-live="polite"
                  >
                    {voucherMsg}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 pt-2" aria-busy={pending}>
                {data.payments.paystackConfigured ? (
                  <Button
                    type="button"
                    className="w-full"
                    disabled={pending}
                    aria-busy={pendingMethod === "paystack"}
                    onClick={() => onSubmit("paystack")}
                  >
                    {pendingMethod === "paystack" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Starting
                        secure payment…
                      </>
                    ) : (
                      <>Pay with Paystack · {formatMoney(finalKobo, product.currency)}</>
                    )}
                  </Button>
                ) : null}
                {data.payments.bankConfigured ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={pending}
                    aria-busy={pendingMethod === "bank_transfer"}
                    onClick={() => onSubmit("bank_transfer")}
                  >
                    {pendingMethod === "bank_transfer" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Preparing
                        transfer…
                      </>
                    ) : (
                      <>Pay by bank transfer · {formatMoney(finalKobo, product.currency)}</>
                    )}
                  </Button>
                ) : null}
                {data.payments.demoCheckoutEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={pending}
                    aria-busy={pendingMethod === "demo"}
                    onClick={() => onSubmit("demo")}
                  >
                    {pendingMethod === "demo" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Completing
                        test flow…
                      </>
                    ) : (
                      <>Development test checkout · {formatMoney(finalKobo, product.currency)}</>
                    )}
                  </Button>
                ) : null}
                {!data.payments.paystackConfigured && data.payments.bankConfigured ? (
                  <p className="text-xs text-muted" role="status">
                    Online card payment is temporarily unavailable. Bank transfer remains available.
                  </p>
                ) : null}
                {data.payments.demoCheckoutEnabled ? (
                  <p className="text-xs text-muted" role="status">
                    Local development only — no payment is processed.
                  </p>
                ) : null}
              </div>
            </form>
          )}
        </div>
        <aside className="h-fit rounded-[24px] border border-line bg-surface p-5">
          <img
            src={product.coverImage}
            alt=""
            className="mb-4 aspect-3/4 w-full rounded-[16px] object-cover"
          />
          <h2 className="font-display text-2xl leading-snug">{product.title}</h2>
          <div className="mt-3 space-y-1 text-sm">
            {discountKobo > 0 ? (
              <>
                <p className="flex items-center justify-between text-muted">
                  <span>List price</span>
                  <span className="tabular-nums line-through">
                    {formatMoney(product.priceKobo, product.currency)}
                  </span>
                </p>
                <p className="flex items-center justify-between text-muted">
                  <span>Voucher</span>
                  <span className="tabular-nums">
                    −{formatMoney(discountKobo, product.currency)}
                  </span>
                </p>
              </>
            ) : null}
            <p className="flex items-center justify-between">
              <span>Total</span>
              <span className="tabular-nums font-medium">
                {formatMoney(finalKobo, product.currency)}
              </span>
            </p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Digital PDF. Instant access after payment is confirmed.{" "}
            <Link to="/guides/$slug" params={{ slug: product.slug }} className="underline">
              Back to guide
            </Link>
          </p>
        </aside>
      </section>
    </PageShell>
  );
}
