import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const [pending, setPending] = useState(false);
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
    const form = document.getElementById("checkout-form") as HTMLFormElement;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    if (name.length < 2 || !email.includes("@")) {
      toast.error("Please enter your name and a valid email.");
      return;
    }
    setPending(true);
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
      setPending(false);
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
          ) : (
            <form id="checkout-form" className="mt-8 space-y-4">
              <Field label="Full name">
                <Input name="name" autoComplete="name" required />
              </Field>
              <Field label="Email" hint="Your download link is tied to this email.">
                <Input name="email" type="email" autoComplete="email" required />
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

              <div className="space-y-3 pt-2">
                {data.payments.paystackConfigured ? (
                  <Button
                    type="button"
                    className="w-full"
                    disabled={pending}
                    onClick={() => onSubmit("paystack")}
                  >
                    Pay with Paystack · {formatMoney(finalKobo, product.currency)}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="w-full"
                    disabled={pending}
                    onClick={() => onSubmit("demo")}
                  >
                    Complete test purchase · {formatMoney(finalKobo, product.currency)}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={pending || !data.payments.bankConfigured}
                  onClick={() => onSubmit("bank_transfer")}
                >
                  Pay by bank transfer
                </Button>
                {!data.payments.paystackConfigured ? (
                  <p className="text-xs text-muted">
                    Card payments are in test mode until Paystack keys are added. The test purchase unlocks
                    the real PDF so you can try the download flow.
                  </p>
                ) : null}
                {!data.payments.bankConfigured ? (
                  <p className="text-xs text-muted">
                    Bank transfer becomes available after the publisher adds account details in Settings.
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
                  <span className="tabular-nums">−{formatMoney(discountKobo, product.currency)}</span>
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
