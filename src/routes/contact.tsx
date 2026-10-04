import { createFileRoute } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";

export const Route = createFileRoute("/contact")({
  loader: () => getSiteSettings(),
  component: Contact,
  head: ({ loaderData }) => ({
    meta: [{ title: `Contact — ${loaderData?.storeName ?? "Cairn"}` }],
  }),
});

function Contact() {
  const settings = Route.useLoaderData();
  const wa = settings.whatsapp.replace(/\D/g, "");
  return (
    <PageShell settings={settings}>
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Contact</p>
        <h1 className="mt-2 font-display text-4xl">How to reach us</h1>
        <div className="mt-8 space-y-3 text-[17px] leading-relaxed">
          <p>Email · {settings.supportEmail || "Add a support email in Settings"}</p>
          {settings.contactPhone ? <p>Phone · {settings.contactPhone}</p> : null}
          {wa ? (
            <p>
              WhatsApp ·{" "}
              <a className="underline" href={`https://wa.me/${wa}`}>
                Message {settings.storeName}
              </a>
            </p>
          ) : (
            <p className="text-muted">WhatsApp number can be added in publisher settings.</p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
