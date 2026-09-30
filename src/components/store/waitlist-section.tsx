import { useEffect, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { getWaitlistBoard, joinWaitlist, type TopicBoardItem } from "@/lib/store/waitlist";
import { TOPIC_REQUEST_THRESHOLD } from "@/lib/store/waitlist-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Ticket = {
  code: string;
  position: number;
  topicName: string;
  duplicate?: boolean;
};

function track(event: string, payload?: Record<string, string>) {
  try {
    console.info("[analytics]", event, payload ?? {});
  } catch {
    /* ignore */
  }
}

export function WaitlistSection() {
  const [presets, setPresets] = useState<string[]>([]);
  const [board, setBoard] = useState<TopicBoardItem[]>([]);
  const [threshold, setThreshold] = useState(TOPIC_REQUEST_THRESHOLD);
  const [selected, setSelected] = useState<string | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    track("waitlist_view");
    void getWaitlistBoard().then((data) => {
      setPresets(data.presets);
      setBoard(data.topics);
      setThreshold(data.threshold);
    });
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!ticket) return;
    if (reduceMotion) {
      setRevealed(ticket.code);
      return;
    }
    setRevealed("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setRevealed(ticket.code.slice(0, i));
      if (i >= ticket.code.length) window.clearInterval(id);
    }, 45);
    return () => window.clearInterval(id);
  }, [ticket, reduceMotion]);

  function pickTopic(name: string) {
    setSelected(name);
    setOtherOpen(false);
    setOtherText("");
    track("topic_selected", { topic: name });
  }

  function pickOther() {
    setOtherOpen(true);
    setSelected(null);
    track("topic_selected", { topic: "other" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const topic = otherOpen ? otherText.trim() : selected;
    if (!topic) {
      setError("Pick a topic, or type one under Other.");
      return;
    }
    if (!consent) {
      setError("Please agree to be contacted about this guide.");
      return;
    }
    track("join_submitted", { topic });
    setPending(true);
    try {
      const result = await joinWaitlist({
        data: {
          topic,
          email,
          whatsapp: whatsapp || undefined,
          consent: true,
          honeypot,
        },
      });
      setTicket({
        code: result.code,
        position: result.position,
        topicName: result.topicName,
        duplicate: result.duplicate,
      });
      track("join_success", { topic: result.topicName });
      const boardData = await getWaitlistBoard();
      setBoard(boardData.topics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the list.");
    } finally {
      setPending(false);
    }
  }

  async function copyCode() {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.code);
      setCopied(true);
      track("code_copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the code and copy it manually.");
    }
  }

  return (
    <section id="waitlist" className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs tracking-[0.22em] text-accent uppercase">Next guides</p>
      <h2 className="mt-2 font-display text-3xl tracking-tight">Tell me what to write next.</h2>
      <p className="mt-3 text-muted">
        Pick a topic you need. Join the list and get a ₦1,500 voucher for that guide when it launches.
      </p>
      <p className="mt-2 text-sm text-muted">
        This voucher is for future guides, not the one already available.
      </p>

      <div className="relative mt-8 min-h-[320px]">
        {ticket ? (
          <div
            className={`ticket-wrap ${reduceMotion ? "ticket-static" : "ticket-animate"}`}
            role="status"
            aria-live="polite"
          >
            <div className="ticket-slot" aria-hidden />
            <div className="ticket-card rounded-[18px] border border-dashed border-accent/40 bg-surface px-6 py-7 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.16em] text-accent uppercase">Your voucher</p>
                  <p className="mt-1 font-display text-xl tracking-tight">{ticket.topicName}</p>
                  <p className="mt-1 text-sm text-muted">
                    You're #{ticket.position} for this topic
                    {ticket.duplicate ? " · already on the list" : ""}
                  </p>
                </div>
                <span className="text-2xl" aria-hidden>
                  🌱
                </span>
              </div>
              <p className="mt-6 font-mono text-2xl tracking-[0.12em] text-ink tabular-nums">{revealed || "· · ·"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => void copyCode()}>
                  {copied ? (
                    <>
                      <Check className="size-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" /> Copy code
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted">We'll email you the moment it's live.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <p className="mb-2 text-sm font-medium">Topic</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => pickTopic(name)}
                    className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                      selected === name && !otherOpen
                        ? "bg-accent text-accent-fg"
                        : "bg-paper-2 text-ink hover:bg-paper-2/80"
                    }`}
                  >
                    {name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={pickOther}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    otherOpen ? "bg-accent text-accent-fg" : "bg-paper-2 text-ink hover:bg-paper-2/80"
                  }`}
                >
                  Other
                </button>
              </div>
              {otherOpen ? (
                <Input
                  className="mt-3"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value.slice(0, 80))}
                  placeholder="Type a short topic (max 80 characters)"
                  maxLength={80}
                  aria-label="Custom topic"
                />
              ) : null}
            </div>

            <div>
              <label htmlFor="waitlist-email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <Input
                id="waitlist-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="waitlist-wa" className="mb-1.5 block text-sm font-medium">
                WhatsApp <span className="font-normal text-muted">(optional)</span>
              </label>
              <Input
                id="waitlist-wa"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Get a WhatsApp alert when it launches"
              />
            </div>

            {/* Honeypot */}
            <div className="absolute -left-[9999px] opacity-0" aria-hidden>
              <label htmlFor="waitlist-company">Company</label>
              <input
                id="waitlist-company"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-line accent-[var(--color-accent)]"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>
                I agree to be contacted about this guide. Data handled per the Nigeria Data Protection Act.
              </span>
            </label>

            {error ? (
              <p className="text-sm text-danger" role="alert" aria-live="assertive">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Joining…
                </>
              ) : (
                "Join the list"
              )}
            </Button>
          </form>
        )}
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <p className="text-sm font-medium">Requested topics</p>
        <p className="mt-1 text-sm text-muted">The most requested topic gets written first.</p>
        {board.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Be the first to request a topic above.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {board.map((t) => (
              <li key={t.id} className="rounded-[14px] border border-line bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{t.name}</p>
                  <p className="shrink-0 text-sm text-muted">
                    {t.showCount ? `${t.count} requests` : "Be one of the first"}
                  </p>
                </div>
                {t.showCount ? (
                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
                      <div
                        className="h-full rounded-full bg-accent/80 transition-[width] duration-300"
                        style={{
                          width: `${Math.min(100, (t.count / threshold) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-subtle">
                      {t.count} of {threshold} requests to start writing
                    </p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .ticket-slot {
          height: 10px;
          margin: 0 auto 8px;
          max-width: 220px;
          border-radius: 4px;
          background: linear-gradient(90deg, transparent, #1a4d47, transparent);
          opacity: 0.35;
        }
        .ticket-animate .ticket-card {
          animation: ticket-print 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .ticket-static .ticket-card {
          animation: ticket-fade 0.25s ease both;
        }
        @keyframes ticket-print {
          0% { opacity: 0; transform: translateY(-28px) scale(0.98); }
          70% { opacity: 1; transform: translateY(4px) scale(1); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ticket-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ticket-animate .ticket-card {
            animation: ticket-fade 0.2s ease both;
          }
        }
      `}</style>
    </section>
  );
}
