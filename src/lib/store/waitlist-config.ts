/** Fixed discount for waitlist vouchers (N500 = 50_000 kobo). */
export const VOUCHER_DISCOUNT_KOBO = 50_000;

/** Typical full price of a guide (N2,000 = 200_000 kobo). Used only for display math. */
export const GUIDE_BASE_PRICE_KOBO = 200_000;

/** Days a voucher stays valid after the topic is launched. */
export const VOUCHER_ACTIVE_DAYS = 14;

/** Request count that signals “start writing” on the public board. */
export const TOPIC_REQUEST_THRESHOLD = 25;

/** Only show numeric counts once a topic has at least this many requests. */
export const PUBLIC_COUNT_MIN = 5;

export const PRESET_TOPICS = [
  "Screen time for kids",
  "Toddler tantrums",
  "Homework and study habits",
  "Teenagers and phones",
  "Sibling fights",
  "School-run stress",
  "Saving money as a family",
  "Chores and responsibility",
] as const;

export const VOUCHER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Longest “What do you need help with?” answer we accept. */
export const REQUEST_MAX_LENGTH = 200;

/**
 * Turn a Nigerian mobile number into +234XXXXXXXXXX, or null if it isn't one.
 * Accepts 0803 123 4567, 08031234567, +2348031234567, 2348031234567 and
 * +234 0803… (spaces, dashes, dots and brackets are ignored).
 */
export function normalizeNigerianWhatsapp(raw: string): string | null {
  const compact = raw.replace(/[\s\-().]/g, "");
  const match = /^(?:0|\+?2340?)([789][01]\d{8})$/.exec(compact);
  return match ? `+234${match[1]}` : null;
}
