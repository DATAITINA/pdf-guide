import { useState } from "react";
import { joinStoryAlert } from "@/lib/store/story-alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** "Get told when Issue 2 drops." One email box, no account. */
export function AlertForm({ slug, title }: { slug: string; title: string }) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      await joinStoryAlert({ data: { slug, email, honeypot } });
      setState("done");
    } catch (err) {
      setError(
        err instanceof Error && err.message.length < 120
          ? err.message
          : "That didn't work. Check your email and try again.",
      );
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-line bg-surface p-5" role="status">
        <p className="font-semibold text-ink">You’re on the list.</p>
        <p className="mt-1 text-sm text-muted">We’ll email you once when it drops. Nothing else.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="rounded-xl border border-line bg-surface p-5"
    >
      <label htmlFor={`alert-${slug}`} className="font-semibold text-ink">
        {title}
      </label>
      <p className="mt-1 text-sm text-muted">One email when it’s out. No spam.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          id={`alert-${slug}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
        />
        {/* Hidden from people, filled by bots. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
        <Button type="submit" disabled={state === "sending"} className="shrink-0">
          {state === "sending" ? "Adding…" : "Notify me"}
        </Button>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
