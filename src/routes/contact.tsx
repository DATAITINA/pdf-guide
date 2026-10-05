import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";
import { PersonalGuideCta } from "@/components/store/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  loader: () => getSiteSettings(),
  component: Contact,
  head: ({ loaderData }) => ({
    meta: [
      { title: `Contact — ${loaderData?.storeName ?? "Cairn"}` },
      { name: "description", content: "Message Cairn on WhatsApp, or send an email." },
    ],
  }),
});

function Contact() {
  const settings = Route.useLoaderData();
  const wa = settings.whatsapp.replace(/\D/g, "");
  return (
    <PageShell settings={settings}>
      <section className="page-narrow section-sm">
        <p className="eyebrow">Contact</p>
        <h1 className="h-section mt-3 text-ink">How to reach us</h1>
        <p className="lead mt-4">WhatsApp is the quickest way to reach us.</p>

        <div className="mt-10 space-y-4">
          {wa ? (
            <div className="card p-6">
              <h2 className="flex items-center gap-3 font-sans text-lg font-semibold tracking-normal text-ink">
                <MessageCircle className="size-5 text-accent" aria-hidden /> WhatsApp
              </h2>
              <p className="mt-2 text-muted">For questions, help with an order, or to talk about a personal guide.</p>
              <Button asChild size="lg" className="mt-5 w-full sm:w-auto">
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                  Message us on WhatsApp
                </a>
              </Button>
            </div>
          ) : null}

          {settings.supportEmail ? (
            <div className="card p-6">
              <h2 className="flex items-center gap-3 font-sans text-lg font-semibold tracking-normal text-ink">
                <Mail className="size-5 text-accent" aria-hidden /> Email
              </h2>
              <p className="mt-2 text-muted">Include your order reference if your message is about a purchase.</p>
              <a href={`mailto:${settings.supportEmail}`} className="link link-tap mt-2 break-all">
                {settings.supportEmail}
              </a>
            </div>
          ) : null}

          {settings.contactPhone ? (
            <div className="card p-6">
              <h2 className="flex items-center gap-3 font-sans text-lg font-semibold tracking-normal text-ink">
                <Phone className="size-5 text-accent" aria-hidden /> Phone
              </h2>
              <a href={`tel:${settings.contactPhone.replace(/[^\d+]/g, "")}`} className="link link-tap mt-2">
                {settings.contactPhone}
              </a>
            </div>
          ) : null}
        </div>
      </section>
      <section className="page pb-16 md:pb-24">
        <PersonalGuideCta />
      </section>
    </PageShell>
  );
}
