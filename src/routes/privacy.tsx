import { createFileRoute } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";

export const Route = createFileRoute("/privacy")({
  loader: () => getSiteSettings(),
  component: Privacy,
  head: ({ loaderData }) => ({
    meta: [{ title: `Privacy policy — ${loaderData?.storeName ?? "Cairn"}` }],
  }),
});

function Privacy() {
  const settings = Route.useLoaderData();
  return (
    <PageShell settings={settings}>
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl">Privacy policy</h1>
        <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-muted">
          <p>
            {settings.storeName} collects the name, email and optional phone number you enter at checkout so we can create your order, confirm payment and send a download link.
          </p>
          <p>
            Payment card details are processed by Paystack. We do not store full card numbers. Bank-transfer receipts are stored privately so the publisher can confirm payment, and are not shown on the public site.
          </p>
          <p>
            PDF files are kept in private storage. A download link is issued only after an order is marked paid. We keep order records so we can restore access if a link expires.
          </p>
          <p>Questions: {settings.supportEmail}.</p>
        </div>
      </section>
    </PageShell>
  );
}
