import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { joinWaitlist } from "@/lib/store/waitlist";
import { normalizeNigerianWhatsapp, REQUEST_MAX_LENGTH } from "@/lib/store/waitlist-config";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type FieldErrors = Partial<Record<"need" | "whatsapp" | "email" | "consent", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: { need: string; whatsapp: string; email: string; consent: boolean }): FieldErrors {
  const errors: FieldErrors = {};
  if (values.need.trim().length < 3) errors.need = "Tell us in a few words what you need help with.";
  if (!values.whatsapp.trim()) errors.whatsapp = "We need your WhatsApp number to reply.";
  else if (!normalizeNigerianWhatsapp(values.whatsapp))
    errors.whatsapp = "That doesn’t look like a Nigerian number. Try 0803 123 4567 or +234 803 123 4567.";
  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim()))
    errors.email = "Check the email address, or leave it empty.";
  if (!values.consent) errors.consent = "Please tick this so we can message you.";
  return errors;
}

export function WaitlistSection({ whatsappLink }: { whatsappLink?: string | null }) {
  const [need, setNeed] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const found = validate({ need, whatsapp, email, consent });
    setErrors(found);
    const firstInvalid = (["need", "whatsapp", "email", "consent"] as const).find((key) => found[key]);
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`)?.focus();
      return;
    }
    setPending(true);
    try {
      await joinWaitlist({
        data: {
          topic: need.trim(),
          name: name.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          consent: true,
          honeypot,
        },
      });
      setSentTo(normalizeNigerianWhatsapp(whatsapp));
    } catch (err) {
      setFormError(
        err instanceof Error && err.message.length < 160
          ? err.message
          : "We couldn’t send your request. Please check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="waitlist" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="eyebrow">Personal guide</p>
          <h2 className="mt-3 font-display text-[2rem] leading-tight text-ink sm:text-[2.5rem]">
            Tell us what you need
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            A few words is enough. We’ll reply on WhatsApp, ask a couple of questions, and agree the price with you
            before you pay anything.
          </p>
          {whatsappLink ? (
            <p className="mt-4 text-base text-muted">
              Rather chat first?{" "}
              <a href={whatsappLink} className="link" target="_blank" rel="noopener noreferrer">
                Message us on WhatsApp
              </a>
            </p>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-line bg-surface p-6 shadow-card sm:p-8">
          {sentTo ? (
            <div className="fade-in py-4" role="status" aria-live="polite">
              <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-fg">
                <Check className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-2xl text-ink">Thank you, we’ve got it</h3>
              <p className="mt-3 text-base leading-relaxed text-muted">
                We’ll reply on WhatsApp at <span className="font-medium text-ink tabular-nums">{sentTo}</span> to talk
                it through and agree the price.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="req-need" className="field-label">
                  What do you need help with?
                </label>
                <Textarea
                  id="req-need"
                  data-field="need"
                  name="need"
                  required
                  rows={3}
                  maxLength={REQUEST_MAX_LENGTH}
                  value={need}
                  onChange={(e) => setNeed(e.target.value.slice(0, REQUEST_MAX_LENGTH))}
                  placeholder="e.g. Getting my toddler to sleep in their own bed"
                  aria-invalid={errors.need ? true : undefined}
                  aria-describedby={errors.need ? "req-need-error req-need-count" : "req-need-count"}
                  className="field-input resize-y"
                />
                <div className="mt-1.5 flex justify-between gap-3 text-sm">
                  {errors.need ? (
                    <p id="req-need-error" className="text-danger">
                      {errors.need}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p id="req-need-count" className="shrink-0 text-muted tabular-nums">
                    {need.length}/{REQUEST_MAX_LENGTH}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="req-name" className="field-label">
                  Your name <span className="font-normal text-muted">(optional)</span>
                </label>
                <Input
                  id="req-name"
                  name="name"
                  autoComplete="given-name"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="req-wa" className="field-label">
                  WhatsApp number
                </label>
                <Input
                  id="req-wa"
                  data-field="whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  maxLength={24}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="0803 123 4567"
                  aria-invalid={errors.whatsapp ? true : undefined}
                  aria-describedby={errors.whatsapp ? "req-wa-error" : "req-wa-hint"}
                  className="field-input"
                />
                {errors.whatsapp ? (
                  <p id="req-wa-error" className="mt-1.5 text-sm text-danger">
                    {errors.whatsapp}
                  </p>
                ) : (
                  <p id="req-wa-hint" className="mt-1.5 text-sm text-muted">
                    0803… or +234 803… both work. This is where we’ll reply.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="req-email" className="field-label">
                  Email <span className="font-normal text-muted">(optional)</span>
                </label>
                <Input
                  id="req-email"
                  data-field="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={200}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "req-email-error" : "req-email-hint"}
                  className="field-input"
                />
                {errors.email ? (
                  <p id="req-email-error" className="mt-1.5 text-sm text-danger">
                    {errors.email}
                  </p>
                ) : (
                  <p id="req-email-hint" className="mt-1.5 text-sm text-muted">
                    Only if you’d also like an email that we got your request.
                  </p>
                )}
              </div>

              {/* Anti-spam: hidden from people, filled in by bots */}
              <div className="absolute -left-[9999px] opacity-0" aria-hidden>
                <label htmlFor="waitlist-company">Company</label>
                <input
                  id="waitlist-company"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div>
                <label className="flex items-start gap-3 text-base leading-relaxed text-ink">
                  <input
                    type="checkbox"
                    data-field="consent"
                    className="mt-1 size-5 shrink-0 rounded border-line accent-[var(--color-accent)]"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    aria-invalid={errors.consent ? true : undefined}
                    aria-describedby={errors.consent ? "req-consent-error" : undefined}
                  />
                  <span>
                    You can contact me on WhatsApp (and email, if I gave one) about this request.{" "}
                    <span className="text-muted">We handle your details under the Nigeria Data Protection Act.</span>
                  </span>
                </label>
                {errors.consent ? (
                  <p id="req-consent-error" className="mt-1.5 pl-8 text-sm text-danger">
                    {errors.consent}
                  </p>
                ) : null}
              </div>

              {formError ? (
                <p className="rounded-[12px] bg-danger/8 px-4 py-3 text-sm text-danger" role="alert">
                  {formError}
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={pending} className="w-full">
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Sending…
                  </>
                ) : (
                  "Send my request"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
