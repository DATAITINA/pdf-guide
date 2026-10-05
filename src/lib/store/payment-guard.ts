/**
 * The only ways an order may become "paid". Every call to fulfillPaidOrder
 * must carry one of these, and assertPaymentProof checks it before anything
 * is unlocked. Pure (no imports) so it can be unit-tested with node --test.
 */
export type PaymentProof =
  | { kind: "paystack_verified"; reference: string }
  | { kind: "transfer_approved"; adminUserId: string }
  | { kind: "local_test"; host: string | undefined };

export type GuardEnv = {
  VERCEL?: string;
  NODE_ENV?: string;
  PAYSTACK_SECRET_KEY?: string;
};

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** True for localhost / 127.0.0.1 / [::1], with or without a port. */
export function isLocalHost(host: string | undefined): boolean {
  if (!host) return false;
  const hostname = host.trim().toLowerCase().startsWith("[")
    ? host.trim().toLowerCase().replace(/\]:\d+$/, "]")
    : host.trim().toLowerCase().replace(/:\d+$/, "");
  return LOCAL_HOSTNAMES.has(hostname);
}

/**
 * Test purchases (free download, no payment) exist only for trying the
 * download flow on a developer's own machine. Never on Vercel, never in a
 * production build, never once Paystack is set up, never on a public host.
 */
export function testPurchaseAllowed(host: string | undefined, e: GuardEnv): boolean {
  if (e.VERCEL) return false;
  if (e.NODE_ENV === "production") return false;
  if (e.PAYSTACK_SECRET_KEY) return false;
  return isLocalHost(host);
}

export function assertPaymentProof(proof: PaymentProof | undefined, e: GuardEnv): void {
  if (!proof) throw new Error("This order has no confirmed payment.");
  switch (proof.kind) {
    case "paystack_verified":
      if (!proof.reference) throw new Error("This order has no confirmed payment.");
      return;
    case "transfer_approved":
      if (!proof.adminUserId) throw new Error("Only the publisher can approve a bank transfer.");
      return;
    case "local_test":
      if (!testPurchaseAllowed(proof.host, e)) throw new Error("This payment option isn't available.");
      return;
    default:
      throw new Error("This order has no confirmed payment.");
  }
}

/** Server environment as the guard sees it. */
export function guardEnv(paystackSecret: string | undefined): GuardEnv {
  return {
    VERCEL: process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV,
    PAYSTACK_SECRET_KEY: paystackSecret,
  };
}
