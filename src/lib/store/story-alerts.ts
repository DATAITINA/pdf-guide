import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { getStory } from "@/content/stories";
import { newId } from "./ids";
import { normalizeTopicName } from "./waitlist";

/**
 * "Get told when the next issue drops." Email only: no WhatsApp number, no voucher.
 * Signups land in the existing waitlist tables, so they show up in Admin → Waitlist
 * under "<Story>: next issue" and can be exported as CSV.
 */

// Per-instance limit, same as the request form. Stops casual spam, not a determined attacker.
const buckets = new Map<string, { count: number; resetAt: number }>();
function allow(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

const schema = z.object({
  slug: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  honeypot: z.string().max(0).optional().or(z.literal("")),
});

export const joinStoryAlert = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }) => {
    // Bots fill the hidden field. Pretend it worked.
    if (data.honeypot) return { ok: true as const };

    const story = getStory(data.slug);
    if (!story) throw new Error("We couldn't find that story.");

    const { getRequest } = await import("@tanstack/react-start/server");
    const ip = getRequest()?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!allow(`story-alert:${ip}`)) throw new Error("Too many tries. Please wait a minute.");

    const topicName = `${story.title}: next issue`;
    const normalized = normalizeTopicName(topicName);
    const sql = await getSql();

    await sql.query(
      `insert into waitlist_topics (id, name, normalized_name, status)
       values ($1, $2, $3, 'requested')
       on conflict (normalized_name) do nothing`,
      [newId("top"), topicName, normalized],
    );
    const [topic] = await sql.query<{ id: string }>(
      `select id from waitlist_topics where normalized_name = $1 limit 1`,
      [normalized],
    );
    // Signing up twice is fine: the second time changes nothing.
    await sql.query(
      `insert into waitlist_entries (id, topic_id, email, whatsapp, consent_at, position)
       values ($1, $2, $3, null, now(),
               (select count(*) + 1 from waitlist_entries where topic_id = $2))
       on conflict (email, topic_id) do nothing`,
      [newId("wle"), topic!.id, data.email],
    );
    return { ok: true as const };
  });
