import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getAdminSettings, saveAdminSettings } from "@/lib/store/admin";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import type { Faq, StoreSettings, Testimonial } from "@/lib/store/types";

export const Route = createFileRoute("/admin/settings")({
  loader: () => getAdminSettings(),
  component: SettingsPage,
});

function SettingsPage() {
  const data = Route.useLoaderData();
  const [settings, setSettings] = useState<StoreSettings>(data.settings);
  const [faqs, setFaqs] = useState<Faq[]>(data.faqs);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(data.testimonials);

  function set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function onSave() {
    try {
      await saveAdminSettings({
        data: {
          settings,
          faqs: faqs.map((f) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            published: f.published,
          })),
          testimonials: testimonials.map((t) => ({
            id: t.id,
            quote: t.quote,
            attribution: t.attribution,
            isPlaceholder: t.isPlaceholder,
            published: t.published,
          })),
        },
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings.");
    }
  }

  return (
    <main className="px-4 py-8 sm:px-8">
      <h1 className="font-display text-3xl">Settings</h1>
      <div className="mt-6 grid max-w-3xl gap-4">
        <Field label="Store name">
          <Input value={settings.storeName} onChange={(e) => set("storeName", e.target.value)} />
        </Field>
        <Field label="Tagline">
          <Input value={settings.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </Field>
        <Field label="Support email">
          <Input value={settings.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={settings.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
        </Field>
        <Field label="WhatsApp number" hint="International format, digits only, e.g. 2348012345678">
          <Input value={settings.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bank name">
            <Input value={settings.bankName} onChange={(e) => set("bankName", e.target.value)} />
          </Field>
          <Field label="Account name">
            <Input value={settings.accountName} onChange={(e) => set("accountName", e.target.value)} />
          </Field>
          <Field label="Account number">
            <Input value={settings.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} />
          </Field>
        </div>
        <Field label="Instagram">
          <Input value={settings.instagram} onChange={(e) => set("instagram", e.target.value)} />
        </Field>
        <Field label="X / Twitter">
          <Input value={settings.twitter} onChange={(e) => set("twitter", e.target.value)} />
        </Field>
        <Field label="Facebook">
          <Input value={settings.facebook} onChange={(e) => set("facebook", e.target.value)} />
        </Field>
        <Field label="Refund summary">
          <Textarea value={settings.refundSummary} onChange={(e) => set("refundSummary", e.target.value)} />
        </Field>
      </div>

      <h2 className="mt-10 font-display text-2xl">FAQs</h2>
      <div className="mt-4 max-w-3xl space-y-4">
        {faqs.map((faq, i) => (
          <div key={faq.id} className="rounded-[16px] border border-line p-4">
            <Input
              value={faq.question}
              onChange={(e) =>
                setFaqs((rows) => rows.map((r, idx) => (idx === i ? { ...r, question: e.target.value } : r)))
              }
            />
            <Textarea
              className="mt-2"
              value={faq.answer}
              onChange={(e) =>
                setFaqs((rows) => rows.map((r, idx) => (idx === i ? { ...r, answer: e.target.value } : r)))
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setFaqs((rows) => [
              ...rows,
              { id: `faq_${Date.now()}`, question: "", answer: "", sortOrder: rows.length + 1, published: true },
            ])
          }
        >
          Add FAQ
        </Button>
      </div>

      <h2 className="mt-10 font-display text-2xl">Testimonials</h2>
      <p className="mt-1 text-sm text-muted">Keep placeholder quotes marked until you have permission to share a real one.</p>
      <div className="mt-4 max-w-3xl space-y-4">
        {testimonials.map((t, i) => (
          <div key={t.id} className="rounded-[16px] border border-line p-4">
            <Textarea
              value={t.quote}
              onChange={(e) =>
                setTestimonials((rows) => rows.map((r, idx) => (idx === i ? { ...r, quote: e.target.value } : r)))
              }
            />
            <Input
              className="mt-2"
              value={t.attribution}
              onChange={(e) =>
                setTestimonials((rows) => rows.map((r, idx) => (idx === i ? { ...r, attribution: e.target.value } : r)))
              }
            />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={t.isPlaceholder}
                onChange={(e) =>
                  setTestimonials((rows) =>
                    rows.map((r, idx) => (idx === i ? { ...r, isPlaceholder: e.target.checked } : r)),
                  )
                }
              />
              Placeholder (not a real review)
            </label>
          </div>
        ))}
      </div>

      <Button type="button" className="mt-8" onClick={() => void onSave()}>
        Save settings
      </Button>
    </main>
  );
}
