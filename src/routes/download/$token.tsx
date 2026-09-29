import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { getDownloadPage } from "@/lib/store/downloads";
import { PageShell } from "@/components/store/layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/download/$token")({
  loader: ({ params }) => getDownloadPage({ data: { token: params.token } }),
  component: DownloadPage,
  head: () => ({ meta: [{ title: "Your guide is ready" }, { name: "robots", content: "noindex" }] }),
});

function DownloadPage() {
  const data = Route.useLoaderData();
  const access = data.access;

  return (
    <PageShell settings={data.settings}>
      <section className="mx-auto max-w-lg px-4 py-16 text-center">
        {!access ? (
          <>
            <h1 className="font-display text-4xl">This link is not valid</h1>
            <p className="mt-3 text-muted">
              The download may be expired, unused, or tied to a payment that is not confirmed. If you paid, contact {data.settings.supportEmail} with your order reference.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs tracking-[0.18em] text-accent uppercase">Payment successful</p>
            <h1 className="mt-3 font-display text-4xl">Your guide is ready.</h1>
            <img src={access.coverImage} alt="" className="mx-auto mt-8 w-40 rounded-[16px] shadow-card" />
            <h2 className="mt-6 font-display text-2xl leading-snug">{access.title}</h2>
            <p className="mt-2 text-sm text-muted">
              Order {access.reference}
              <br />
              {access.email}
            </p>
            {access.expired || access.exhausted ? (
              <p className="mt-6 text-sm text-danger">
                {access.expired ? "This download link has expired." : "This download link has reached its limit."} Write to {data.settings.supportEmail} for a replacement.
              </p>
            ) : (
              <Button asChild size="lg" className="mt-6">
                <a href={access.filePath}>
                  <Download className="size-4" /> Download PDF
                </a>
              </Button>
            )}
            {data.emailed ? (
              <p className="mt-4 text-sm text-muted">A download link has also been sent to your email.</p>
            ) : null}
          </>
        )}
      </section>
    </PageShell>
  );
}
