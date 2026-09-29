import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { verifyPaystack } from "@/lib/store/payments";
import { getSiteSettings } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";

type Search = { reference?: string; trxref?: string };

export const Route = createFileRoute("/checkout/verify")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    reference: typeof search.reference === "string" ? search.reference : undefined,
    trxref: typeof search.trxref === "string" ? search.trxref : undefined,
  }),
  loader: () => getSiteSettings(),
  component: VerifyPage,
});

function VerifyPage() {
  const settings = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const reference = search.reference || search.trxref;

  useEffect(() => {
    if (!reference) {
      setError("Missing payment reference.");
      return;
    }
    verifyPaystack({ data: { reference, origin: window.location.origin } })
      .then((result) => {
        void navigate({ to: result.downloadPath });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Payment could not be verified.");
      });
  }, [reference, navigate]);

  return (
    <PageShell settings={settings}>
      <section className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl">{error ? "Payment not confirmed" : "Confirming payment"}</h1>
        <p className="mt-3 text-muted">{error ?? "Please wait while we confirm your payment with Paystack."}</p>
      </section>
    </PageShell>
  );
}
