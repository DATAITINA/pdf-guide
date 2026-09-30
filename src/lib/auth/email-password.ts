/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Enabled for Fieldnote publisher admin access.
 * Do NOT edit `server.ts` for this — that file is frozen pre-wired config.
 */
export const emailAndPasswordEnabled = true;

/** Publisher account bootstrapped on seed when missing. Override via env in production. */
export const PUBLISHER_EMAIL =
  (typeof process !== "undefined" && process.env.PUBLISHER_EMAIL?.trim()) ||
  "thedaviditina@gmail.com";

export const PUBLISHER_PASSWORD =
  (typeof process !== "undefined" && process.env.PUBLISHER_PASSWORD?.trim()) ||
  "Davey123!@#";

export const PUBLISHER_NAME =
  (typeof process !== "undefined" && process.env.PUBLISHER_NAME?.trim()) ||
  "David Bassey Itina";
