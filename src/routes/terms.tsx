import { createFileRoute } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";

export const Route = createFileRoute("/terms")({
  loader: () => getSiteSettings(),
  component: Terms,
  head: ({ loaderData }) => ({
    meta: [{ title: `Terms — ${loaderData?.storeName ?? "Fieldnote"}` }],
  }),
});

function Terms() {
  const settings = Route.useLoaderData();
  return (
    <PageShell settings={settings}>
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl">Terms of sale</h1>
        <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-muted">
          <p>
            By buying a guide you receive a personal licence to download and read the PDF. You may not resell, share or republish the file as a product of your own.
          </p>
          <p>
            Prices are shown in {settings.currency}. The amount charged is the price stored for that product at the time of checkout, not a figure typed by the customer.
          </p>
          <p>
            Access is granted only after payment is confirmed — by Paystack verification or by the publisher approving a bank transfer. Demo / placeholder listings are not for sale.
          </p>
          <p>
            Guides are general education. They are not professional, medical or legal advice. {settings.refundSummary}
          </p>
        </div>
      </section>
    </PageShell>
  );
}
