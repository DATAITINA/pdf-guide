import { createFileRoute } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/store/catalog";
import { PolicyPage } from "@/components/store/policy-page";

export const Route = createFileRoute("/refund")({
  loader: () => getSiteSettings(),
  component: Refund,
  head: ({ loaderData }) => ({
    meta: [{ title: `Refund policy — ${loaderData?.storeName ?? "Cairn"}` }],
  }),
});

function Refund() {
  const settings = Route.useLoaderData();
  return (
    <PolicyPage settings={settings} title="Refund policy">
      <h2>Digital downloads</h2>
      <p>{settings.refundSummary}</p>
      <h2>If your file didn’t unlock</h2>
      <p>
        If a payment succeeded and the file did not unlock, email{" "}
        <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a> with your order reference. Confirmed
        payments are fulfilled — you should not pay a second time for the same order.
      </p>
    </PolicyPage>
  );
}
