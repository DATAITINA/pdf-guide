import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: signError } = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: "/admin",
      });
      if (signError) {
        setError(signError.message || "Sign-in failed. Check your email and password.");
        setBusy(false);
        return;
      }
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-2xl">
          Fieldnote
        </Link>
        <h1 className="mt-8 font-display text-3xl">Publisher sign-in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This page is for the store owner. Customers do not need an account to buy a guide.
        </p>

        {authEnabled && emailAndPasswordEnabled ? (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="block text-sm">
              <span className="text-muted">Email</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-[10px] border border-line bg-paper-2 px-3 py-2 text-ink outline-none focus:border-accent"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-[10px] border border-line bg-paper-2 px-3 py-2 text-ink outline-none focus:border-accent"
              />
            </label>
            {error ? (
              <p className="text-sm text-red-700" role="alert" aria-live="polite">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}
