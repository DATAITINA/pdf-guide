import { createFileRoute } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/store/catalog";
import { PolicyPage } from "@/components/store/policy-page";

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
    <PolicyPage settings={settings} title="Privacy policy">
      <h2>When you buy a guide</h2>
      <p>
        {settings.storeName} collects the name, email and optional phone number you enter at checkout so we can create
        your order, confirm payment and send a download link.
      </p>
      <h2>When you ask for a personal guide</h2>
      <p>
        When you ask for a personal guide, we keep what you tell us, your WhatsApp number, and your name and email if
        you give them, so we can reply and check in with you. We don’t share them with anyone else.
      </p>
      <h2>Payments</h2>
      <p>
        If card payment is offered at checkout, card details are processed by Paystack. We do not store full card
        numbers. Bank-transfer receipts are stored privately so the publisher can confirm payment, and are not shown on
        the public site.
      </p>
      <h2>Your files</h2>
      <p>
        PDF files are kept in private storage. A download link is issued only after an order is marked paid. We keep
        order records so we can restore access if a link expires.
      </p>
      <h2>Questions</h2>
      <p>
        Questions: <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>.
      </p>
    </PolicyPage>
  );
}
