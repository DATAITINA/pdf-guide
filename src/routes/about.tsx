import { createFileRoute } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";

export const Route = createFileRoute("/about")({
  loader: () => getSiteSettings(),
  component: About,
  head: ({ loaderData }) => ({
    meta: [{ title: `About — ${loaderData?.storeName ?? "Cairn"}` }],
  }),
});

function About() {
  const settings = Route.useLoaderData();
  return (
    <PageShell settings={settings}>
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">About</p>
        <h1 className="mt-2 font-display text-4xl">{settings.storeName}</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          {settings.storeName} publishes practical digital PDF guides for everyday life — parenting, money, work and home. The writing is meant to be used, not merely admired: short enough to finish, specific enough to try the same day.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          Guides are delivered as instant downloads after payment is confirmed. Store details, bank account information and contact addresses can be updated by the publisher without changing the site itself.
        </p>
      </section>
    </PageShell>
  );
}
