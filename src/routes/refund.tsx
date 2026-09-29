import { createFileRoute } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";

export const Route = createFileRoute("/refund")({
  loader: () => getSiteSettings(),
  component: Refund,
  head: ({ loaderData }) => ({
    meta: [{ title: `Refund policy — ${loaderData?.storeName ?? "Fieldnote"}` }],
  }),
});

function Refund() {
  const settings = Route.useLoaderData();
  return (
    <PageShell settings={settings}>
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl">Refund policy</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-muted">{settings.refundSummary}</p>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          If a payment succeeded and the file did not unlock, email {settings.supportEmail} with your order reference. Confirmed payments are fulfilled — you should not pay a second time for the same order.
        </p>
      </section>
    </PageShell>
  );
}
