import { createFileRoute, Link } from "@tanstack/react-router";
import { getStorefront } from "@/lib/store/catalog";
import { PERSONAL_GUIDE_FAQS } from "@/lib/store/personal-faqs";
import { PageShell } from "@/components/store/layout";
import { FaqList, PersonalGuideCta } from "@/components/store/blocks";

export const Route = createFileRoute("/faq")({
  loader: () => getStorefront(),
  component: FaqPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `FAQ — ${loaderData?.settings.storeName ?? "Cairn"}` },
      { name: "description", content: "Answers about personal guides, check-ins, prices and ready-made PDF guides." },
    ],
  }),
});

function FaqPage() {
  const data = Route.useLoaderData();
  const waDigits = (data.settings.whatsapp || "").replace(/\D/g, "");
  return (
    <PageShell settings={data.settings}>
      <section className="page-narrow section-sm">
        <p className="eyebrow">FAQ</p>
        <h1 className="h-section mt-3 text-ink">Common questions</h1>

        <h2 className="h-card mt-12 text-ink">Personal guides</h2>
        <div className="mt-4">
          <FaqList items={PERSONAL_GUIDE_FAQS} />
        </div>

        {data.faqs.length > 0 ? (
          <>
            <h2 className="h-card mt-12 text-ink">Ready-made guides</h2>
            <div className="mt-4">
              <FaqList items={data.faqs} />
            </div>
          </>
        ) : null}

        <p className="mt-10 text-muted">
          Still have a question?{" "}
          {waDigits ? (
            <a className="link" href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer">
              Message us on WhatsApp
            </a>
          ) : (
            <Link className="link" to="/contact">
              Contact us
            </Link>
          )}
          .
        </p>
      </section>
      <section className="page pb-16 md:pb-24">
        <PersonalGuideCta />
      </section>
    </PageShell>
  );
}
