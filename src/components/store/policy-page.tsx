import type { ReactNode } from "react";
import type { StoreSettings } from "@/lib/store/types";
import { PageShell } from "./layout";

/** Readable layout for policy pages: one column, ~65 characters wide. */
export function PolicyPage({
  settings,
  title,
  updated,
  children,
}: {
  settings: StoreSettings;
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <PageShell settings={settings}>
      <article className="page-narrow section-sm">
        <p className="eyebrow">Policies</p>
        <h1 className="h-section mt-3 text-ink">{title}</h1>
        {updated ? <p className="mt-3 text-sm text-muted">{updated}</p> : null}
        <div className="prose-page mt-6">{children}</div>
      </article>
    </PageShell>
  );
}
