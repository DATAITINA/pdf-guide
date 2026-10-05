import { createFileRoute } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/store/catalog";
import { PolicyPage } from "@/components/store/policy-page";

export const Route = createFileRoute("/terms")({
  loader: () => getSiteSettings(),
  component: Terms,
  head: ({ loaderData }) => ({
    meta: [{ title: `Terms — ${loaderData?.storeName ?? "Cairn"}` }],
  }),
});

function Terms() {
  const settings = Route.useLoaderData();
  return (
    <PolicyPage settings={settings} title="Terms of sale">
      <h2>Your licence</h2>
      <p>
        By buying a guide you receive a personal licence to download and read the PDF. You may not resell, share or
        republish the file as a product of your own.
      </p>
      <h2>Prices</h2>
      <p>
        Prices are shown in {settings.currency}. The amount charged is the price stored for that product at the time of
        checkout, not a figure typed by the customer.
      </p>
      <h2>Access</h2>
      <p>
        Access is granted only after payment is confirmed — by Paystack verification or by the publisher approving a
        bank transfer. Demo / placeholder listings are not for sale.
      </p>
      <h2>Advice and refunds</h2>
      <p>
        Guides are general education. They are not professional, medical or legal advice. {settings.refundSummary}
      </p>
    </PolicyPage>
  );
}
