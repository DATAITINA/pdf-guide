import { useRef, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { joinWaitlist } from "@/lib/store/waitlist";
import { normalizeNigerianWhatsapp, REQUEST_MAX_LENGTH } from "@/lib/store/waitlist-config";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

type FieldErrors = Partial<Record<"need" | "whatsapp" | "email" | "consent", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: { need: string; whatsapp: string; email: string; consent: boolean }): FieldErrors {
  const errors: FieldErrors = {};
  if (v.need.trim().length < 3) errors.need = "Tell us in a few words what you need help with.";
  if (!v.whatsapp.trim()) errors.whatsapp = "We need your WhatsApp number to reply.";
  else if (!normalizeNigerianWhatsapp(v.whatsapp))
    errors.whatsapp = "That doesn’t look like a Nigerian number. Try 0803 123 4567 or +234 803 123 4567.";
  if (v.email.trim() && !EMAIL_PATTERN.test(v.email.trim())) errors.email = "Check the email address, or leave it empty.";
  if (!v.consent) errors.consent = "Please tick this so we can message you.";
  return errors;
}

/** The personal-guide request form. Same server function and tables as before. */
export function WaitlistSection({ whatsappLink }: { whatsappLink?: string | null }) {
  const [need, setNeed] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const found = validate({ need, whatsapp, email, consent });
    setErrors(found);
    const first = (["need", "whatsapp", "email", "consent"] as const).find((key) => found[key]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setPending(true);
    try {
      await joinWaitlist({
        data: { topic: need.trim(), name: name.trim(), email: email.trim(), whatsapp: whatsapp.trim(), consent: true, honeypot },
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
    <section id="waitlist" className="page section">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="eyebrow">Personal guide</p>
          <h2 className="h-section mt-3 text-ink">Tell us what you need</h2>
          <p className="lead mt-4 max-w-md">
            A few words is enough. We’ll reply on WhatsApp, ask a couple of questions, and agree the price with you
            before you pay anything.
          </p>
          {whatsappLink ? (
            <p className="mt-4 text-muted">
              Rather chat first?{" "}
              <a href={whatsappLink} className="link" target="_blank" rel="noopener noreferrer">
                Message us on WhatsApp
              </a>
            </p>
          ) : null}
        </div>

        <div className="card p-6 shadow-card sm:p-8">
          {sentTo ? (
            <div className="animate-fade-in py-4" role="status" aria-live="polite">
              <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-fg">
                <Check className="size-6" aria-hidden />
              </span>
              <h3 className="h-card mt-6 text-ink">Thank you, we’ve got it</h3>
              <p className="mt-3 text-muted">
                We’ll reply on WhatsApp at <span className="font-semibold text-ink tabular-nums">{sentTo}</span> to
                talk it through and agree the price.
              </p>
            </div>
          ) : (
            <form ref={formRef} onSubmit={onSubmit} className="space-y-6" noValidate>
              <Field
                label="What do you need help with?"
                error={errors.need}
                hint={`${need.length}/${REQUEST_MAX_LENGTH} characters`}
              >
                <Textarea
                  name="need"
                  required
                  rows={3}
                  maxLength={REQUEST_MAX_LENGTH}
                  value={need}
                  onChange={(e) => setNeed(e.target.value.slice(0, REQUEST_MAX_LENGTH))}
                  placeholder="e.g. Getting my toddler to sleep in their own bed"
                />
              </Field>

              <Field
                label="WhatsApp number"
                error={errors.whatsapp}
                hint="0803… or +234 803… both work. This is where we’ll reply."
              >
                <Input
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  maxLength={24}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="0803 123 4567"
                />
              </Field>

              <Field label="Your name" optional>
                <Input
                  name="name"
                  autoComplete="given-name"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              {showEmail ? (
                <Field label="Email" optional error={errors.email} hint="We’ll email you a note that we got your request.">
                  <Input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    maxLength={200}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </Field>
              ) : (
                <button
                  type="button"
                  className="link link-tap -my-2 no-underline"
                  onClick={() => setShowEmail(true)}
                >
                  <Plus className="size-4" aria-hidden /> Add email (optional)
                </button>
              )}

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
                <label className="flex min-h-12 items-start gap-3 text-ink">
                  <input
                    type="checkbox"
                    name="consent"
                    className="check"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    aria-invalid={errors.consent ? true : undefined}
                    aria-describedby={errors.consent ? "req-consent-error" : undefined}
                  />
                  <span>
                    You can contact me on WhatsApp (and email, if I add one) about this request.{" "}
                    <span className="text-muted">We only use your details to reply, under the Nigeria Data Protection Act.</span>
                  </span>
                </label>
                {errors.consent ? (
                  <p id="req-consent-error" className="field-error pl-9">
                    {errors.consent}
                  </p>
                ) : null}
              </div>

              {formError ? (
                <p className="rounded-md bg-danger-soft px-4 py-3 text-danger" role="alert">
                  {formError}
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={pending} className="w-full">
                {pending ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden /> Sending…
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
