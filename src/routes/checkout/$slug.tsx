import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getProductBySlug } from "@/lib/store/catalog";
import { startCheckout } from "@/lib/store/payments";
import { validateVoucher } from "@/lib/store/waitlist";
import { formatMoney } from "@/lib/store/money";
import { coverSources } from "@/lib/store/covers";
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
    meta: [{ title: `Checkout — ${loaderData?.product?.title ?? "Guide"}` }, { name: "robots", content: "noindex" }],
  }),
});

function CheckoutPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const product = data.product!;
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState(search.code ?? "");
  const [voucherMsg, setVoucherMsg] = useState<string | null>(null);
  const [discountKobo, setDiscountKobo] = useState(0);
  const [finalKobo, setFinalKobo] = useState(product.priceKobo);
  const [applying, setApplying] = useState(false);
  const cover = coverSources(product.coverImage);
  const { paystackConfigured, bankConfigured, testPurchase } = data.payments;
  const canPay = paystackConfigured || bankConfigured;
  const waDigits = (data.settings.whatsapp || "").replace(/\D/g, "");
  // The voucher box only appears for people who arrive with a code in their link.
  const showVoucher = Boolean(search.code);

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
      const result = await validateVoucher({ data: { code, productId: product.id } });
      if (!result.ok) {
        setDiscountKobo(0);
        setFinalKobo(product.priceKobo);
        setVoucherMsg(result.message);
        return;
      }
      setDiscountKobo(result.discountKobo);
      setFinalKobo(result.finalKobo);
      setVoucherCode(result.code);
      setVoucherMsg(`${formatMoney(result.discountKobo, product.currency)} off applied.`);
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
    const found: { name?: string; email?: string } = {};
    if (name.length < 2) found.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = "Please enter a valid email. Your download link goes here.";
    setErrors(found);
    setFormError(null);
    if (found.name || found.email) {
      form.querySelector<HTMLElement>(`[name="${found.name ? "name" : "email"}"]`)?.focus();
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
      setFormError(err instanceof Error ? err.message : "Could not start checkout. Please try again.");
      setPending(false);
    }
  }

  const total = formatMoney(finalKobo, product.currency);

  return (
    <PageShell settings={data.settings}>
      <section className="page section-sm">
        <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:gap-12">
          {/* Order summary: first on phones so the price is clear straight away */}
          <aside className="card h-fit p-5 md:order-2 md:p-6" aria-label="Your order">
            <div className="flex gap-4 md:flex-col">
              <img
                src={cover.src}
                srcSet={cover.srcSet}
                sizes="(min-width: 768px) 320px, 80px"
                alt=""
                width={400}
                height={600}
                className="aspect-2/3 h-auto w-20 shrink-0 self-start rounded-md object-cover md:w-full md:rounded-lg"
              />
              <div className="min-w-0">
                <p className="eyebrow">Your order</p>
                <h2 className="mt-2 font-display text-xl leading-snug text-ink">{product.title}</h2>
                <p className="mt-1 text-muted">PDF guide · download link once payment is confirmed</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2 border-t border-line pt-4">
              {discountKobo > 0 ? (
                <>
                  <div className="flex justify-between text-muted">
                    <dt>Price</dt>
                    <dd className="tabular-nums line-through">{formatMoney(product.priceKobo, product.currency)}</dd>
                  </div>
                  <div className="flex justify-between text-muted">
                    <dt>Voucher</dt>
                    <dd className="tabular-nums">−{formatMoney(discountKobo, product.currency)}</dd>
                  </div>
                </>
              ) : null}
              <div className="flex items-baseline justify-between">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="font-display text-2xl tabular-nums text-ink">{total}</dd>
              </div>
            </dl>
          </aside>

          <div className="md:order-1">
            <p className="eyebrow">Checkout</p>
            <h1 className="h-section mt-3 text-ink">Buy this guide</h1>

            <ol className="mt-6 grid gap-2 text-muted sm:grid-cols-3" aria-label="Steps">
              {[
                "Your details",
                paystackConfigured ? "Pay by card or transfer" : "Pay by bank transfer",
                "Get your download link",
              ].map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                      i === 0 ? "bg-accent text-accent-fg" : "bg-paper-2 text-ink"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={i === 0 ? "font-semibold text-ink" : ""}>{step}</span>
                </li>
              ))}
            </ol>

            {product.isPlaceholder ? (
              <p className="card-soft mt-8 px-5 py-4 text-muted">This is a sample listing and isn’t for sale.</p>
            ) : (
              <form
                id="checkout-form"
                className="mt-8 space-y-6"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void onSubmit(paystackConfigured ? "paystack" : "bank_transfer");
                }}
              >
                <Field label="Full name" error={errors.name}>
                  <Input name="name" autoComplete="name" required />
                </Field>
                <Field label="Email" error={errors.email} hint="We’ll send your download link here.">
                  <Input name="email" type="email" inputMode="email" autoComplete="email" required />
                </Field>
                <Field label="WhatsApp or phone number" optional hint="Only used if we need to reach you about this order.">
                  <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" />
                </Field>

                {showVoucher ? (
                  <div className="card-soft p-4">
                    <Field label="Voucher code">
                      <Input
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        className="font-mono"
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={applying}
                      onClick={() => void applyCode()}
                      className="mt-3 w-full sm:w-auto"
                    >
                      {applying ? "Checking…" : "Apply code"}
                    </Button>
                    {voucherMsg ? (
                      <p className={`mt-2 ${discountKobo > 0 ? "text-ok" : "text-danger"}`} role="status">
                        {voucherMsg}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {formError ? (
                  <p className="rounded-md bg-danger-soft px-4 py-3 text-danger" role="alert">
                    {formError}
                  </p>
                ) : null}

                {canPay ? (
                  <div className="space-y-3">
                    {paystackConfigured ? (
                      <>
                        <Button type="submit" size="lg" className="w-full" disabled={pending}>
                          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
                          Pay {total} by card
                        </Button>
                        {bankConfigured ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="lg"
                            className="w-full"
                            disabled={pending}
                            onClick={() => onSubmit("bank_transfer")}
                          >
                            Pay by bank transfer instead
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Button type="submit" size="lg" className="w-full" disabled={pending}>
                          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
                          Continue to bank transfer · {total}
                        </Button>
                        <p className="text-muted">
                          Next you’ll see our bank details. Send the transfer, upload your receipt, and we’ll send your
                          download link once we’ve confirmed it.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="card-soft px-5 py-4 text-ink">
                    Payment isn’t open right now.{" "}
                    {waDigits ? (
                      <a className="link" href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer">
                        Message us on WhatsApp
                      </a>
                    ) : (
                      <Link className="link" to="/contact">
                        Contact us
                      </Link>
                    )}{" "}
                    and we’ll help you buy this guide.
                  </p>
                )}

                {testPurchase ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full border border-dashed border-field"
                    disabled={pending}
                    onClick={() => onSubmit("demo")}
                  >
                    Local test purchase (this computer only)
                  </Button>
                ) : null}

                <p className="text-muted">
                  <Link to="/guides/$slug" params={{ slug: product.slug }} className="link link-tap">
                    Back to the guide
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
