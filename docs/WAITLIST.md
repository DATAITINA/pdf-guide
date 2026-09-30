# Topic waitlist

Captures demand for future guides and issues single-use voucher codes (₦500 off → ₦1,500 when the list price is ₦2,000).

## Public flow

1. Homepage **Next guides** section: pick a topic, email, optional WhatsApp, consent.
2. Server creates a `waitlist_topics` row (if needed), a `waitlist_entries` row, and a **reserved** voucher `FN-XXXX-XXXX`.
3. Confirmation email (Resend) includes the code and position.
4. Voting board shows counts only when a topic has **5+** requests. Threshold bar uses **25** requests (config in `src/lib/store/waitlist-config.ts`).

## Launch a topic (admin)

1. Sign in as a store admin → **Admin → Waitlist**.
2. Optionally **Mark building** while you write the guide.
3. Publish the product (existing Products admin) with the real PDF.
4. On Waitlist, select that product → **Dry-run launch** (lists who would be emailed) → **Launch**.
5. Launch sets topic `launched`, links `product_id`, sets vouchers to **active** with **14-day** expiry, and sends launch emails with checkout links `?code=FN-…`.

## Export CSV

On Admin → Waitlist → **Export CSV** for a topic (email, WhatsApp, position, code, status, joined_at).

## Checkout rules

- No code → full list price (unchanged).
- **Reserved** code → “This code unlocks when your guide launches.”
- **Active** code only for the linked product → ₦500 off, price computed on the server.
- Redeemed only in `fulfillPaidOrder` after payment (Paystack verify / bank approval / demo).
- Atomic update prevents double redemption.

## Env vars

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Existing — waitlist emails |
| `RESEND_FROM_EMAIL` | Existing — from address |
| `APP_URL` | Public site URL for email links |
| `PAYSTACK_SECRET_KEY` | Existing — card checkout |
| `DATABASE_URL` | Existing — Neon in production |
| `WAITLIST_ADMIN_SECRET` | Optional alternate admin secret (session admin still works) |

## Config constants

`src/lib/store/waitlist-config.ts`: discount kobo, base price, active days, request threshold, public count minimum, preset topics.
