import { createFileRoute } from "@tanstack/react-router";
import { getStorefront } from "@/lib/store/catalog";
import { PageShell } from "@/components/store/layout";

export const Route = createFileRoute("/faq")({
  loader: () => getStorefront(),
  component: FaqPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `FAQ — ${loaderData?.settings.storeName ?? "Fieldnote"}` }],
  }),
});

function FaqPage() {
  const data = Route.useLoaderData();
  return (
    <PageShell settings={data.settings}>
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">FAQ</p>
        <h1 className="mt-2 font-display text-4xl">Common questions</h1>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {data.faqs.map((faq) => (
            <div key={faq.id} className="py-5">
              <h2 className="font-medium">{faq.question}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
