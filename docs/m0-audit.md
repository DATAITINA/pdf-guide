# M0 audit (2026-10-06)

What exists today, what's risky, and the proposed data model and file layout for M1–M5.
Nothing in this PR changes app behaviour.

## 1. What exists today

**Stack:** TanStack Start 1.168.60 (start-server-core pinned at 1.169.39 through `overrides`), React 19, Tailwind v4,
Better Auth 1.6, zod 4, `pg` against Neon in production and PGLite locally and in previews. Raw SQL through
`getSql()`. No ORM for app tables (Kysely is only Better Auth's dialect).

**Flows:**

| Flow | Where | Notes |
|---|---|---|
| "Tell us what you need" request | `waitlist-section.tsx` → `joinWaitlist` (`waitlist.ts`) | Stores free text as a `waitlist_topics` row plus a `waitlist_entries` row (email, WhatsApp, consent). The owner replies on WhatsApp by hand. **This is the seed of the M2 flow.** |
| Ready-made guide checkout | `checkout/$slug.tsx` → `payments.ts` | Paystack if `PAYSTACK_SECRET_KEY` is set (it isn't), otherwise bank transfer with a proof upload. |
| Transfer review | `admin/transfers.tsx` → `reviewTransfer` | The owner approves, `fulfill.server.ts` creates a download token, and email goes out only if Resend is configured (it isn't). |
| Download | `download/$token.tsx`, `api/files/download.$token.ts` | Token-limited (20 downloads), events logged with a hashed IP. |
| Waitlist launch / vouchers | `admin/waitlist.tsx` → `waitlist-admin.ts` | Single-use ₦500 vouchers per waitlist entry. |
| Admin auth | Better Auth email + password, `store_admins` table | The publisher account is created by `ensurePublisherUser()`. |

**Tables:** `categories`, `products`, `product_files` / `product_covers` / `transfer_proofs` (stored as `bytea`), `orders`,
`download_tokens`, `download_events`, `settings`, `store_admins`, `testimonials`, `faqs`, `webhook_events`,
`waitlist_topics`, `waitlist_entries`, `vouchers`, plus Better Auth's `user`, `session`, `account`, `verification`.

**Checks:** `typecheck`, `lint` and `test` (`node --test`, explicit file list). No CI.
**Baseline, run locally on 2026-10-06 (Windows, fresh `npm install`):** typecheck passed, lint passed, 263/263 tests passed
(197 script tests + 66 app tests). Resolved `@tanstack/react-start` 1.168.60 and `start-server-core` 1.169.39, the patched versions.

## 2. Risks, most severe first

| # | Severity | Risk | Proposed fix |
|---|---|---|---|
| 1 | ~~Critical~~ **Fixed 2026-10-07** | The live admin password was hardcoded in `src/lib/auth/ensure-publisher.server.ts` in this public repo. | Owner changed the password. PR #12 deleted the file and added Admin → Settings → Change password, which signs out every other session. The old password stays in git history forever, so it must never be reused. |
| 1a | ~~High~~ **Fixed 2026-10-07** | Public email sign-up was open, so anyone could create an account. | PR #12 set `disableSignUp: true`. Verified on the live site: sign-up returns `EMAIL_PASSWORD_SIGN_UP_DISABLED`. |
| 1b | ~~Medium~~ **Fixed 2026-10-07** | Better Auth's 5-minute cookie cache kept a revoked session looking valid. | PR #12: `getSessionUser()` reads the session from the database every time. Not tested end-to-end (the test needed sign-up re-enabled, which was blocked). |
| 1c | Low, **open** | If `store_admins` is ever empty, `requireStoreAdmin()` in `admin.ts` makes the first signed-in user an admin. Not exploitable today: the owner is on the list, and sign-up is off. | Small cleanup PR: never auto-grant; add admins only by a deliberate step. |
| 2 | ~~High~~ **Fixed 2026-10-07** | Production had `DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS` set, which turned off Vercel's block on vulnerable TanStack Start builds (CVE-2026-102989). | Owner deleted it and redeployed, and the build is Ready. Production env now holds only `DATABASE_URL`. |
| 3 | High | No lockfile, and dependencies use `^` ranges. Every Vercel build can resolve different versions. | `package-lock.json` is committed in this PR, from the install that passed the baseline above. It adds no packages; it pins what already resolves. Drop that commit if you'd rather keep unpinned builds. |
| 4 | High | Vercel's Hobby plan is "non-commercial, personal use only" (Vercel docs, checked 2026-10-07), and Cairn sells guides. Pro costs $20 per developer seat per month, which is the whole testing budget. | Owner decision, pending. |
| 5 | Medium | Migrations auto-run against production on every production build. Previews are safe: `DATABASE_URL` is production-only, so previews use PGLite. That also means previews never test real Postgres. | Keep migrations additive. Later, add a Neon branch for previews (free tier). |
| 6 | Medium | Rate limiting in `waitlist.ts` is an in-memory `Map`, so each serverless instance has its own counter. | Upstash for AI endpoints (M1/M2, needs approval). |
| 7 | Medium | `waitlist.ts` contains dead duplicates of the admin functions in `waitlist-admin.ts`. They are admin-guarded, but they're extra attack surface and will drift. | Delete them in a small cleanup PR. |
| 8 | Low | PDFs, covers and transfer proofs live in Postgres as `bytea`. Neon's free storage is small. | Fine at current volume. Revisit if storage passes ~300 MB. |
| 9 | Low | Paystack and Resend aren't configured, so download links appear only on screen after approval. | Not an M1 blocker. Decide before M2's paid unlock. |

## 3. Proposed data model (M1–M5)

Same conventions as today: `text` ids from `newId()`, `timestamptz`, `jsonb` for validated structures, one numbered
migration per milestone, additive only. Customers don't get accounts. A person is identified by their WhatsApp number.

| Table | Milestone | Purpose | Key columns |
|---|---|---|---|
| `people` | M2 | One row per human | `whatsapp_e164` unique, `email` null, `first_name` null, `checkin_consent_at`, `checkin_opt_out_at`, `deleted_at` (NDPA erasure) |
| `situations` | M1 | What they told us | `person_id` null, `raw_text`, `structured` jsonb (Understand output), `follow_ups` jsonb, `safety` jsonb, `flagged` bool, `prompt_versions` jsonb |
| `safety_reviews` | M1 | Flagged cases for owner review | `situation_id`, `category`, `response_shown`, `reviewed_at`, `notes` |
| `guides` | M1 | The structured guide | `situation_id`, `person_id`, `status` (`first_step_shown` / `unlocked` / `completed` / `lapsed`), `content` jsonb (zod `Guide`), `model`, `prompt_version`, `order_id` null |
| `guide_steps` | M2 | Steps, and stones once done | `guide_id`, `position`, `title`, `body`, `minutes`, `done_at`, `done_via` (`web` / `whatsapp`) |
| `if_then_plans` | M2 | "When ___, I will ___" lines | `guide_id`, `position`, `when_text`, `will_text` |
| `checkins` | M3 | Every check-in, drafted to sent | `guide_id`, `due_at`, `kind`, `status` (`drafted` / `approved` / `sent` / `replied` / `skipped`), `draft_text`, `final_text`, `edited` bool, `wa_message_id` |
| `messages` | M3 | Inbound and outbound WhatsApp | `person_id`, `direction`, `body`, `wa_message_id` unique, `checkin_id` null |
| `memories` | M4 | Facts Cairn uses later | `person_id`, `guide_id`, `kind` (`tried` / `worked` / `didnt_work` / `constraint` / `routine`), `text`, `source_message_id`, `superseded_at` |
| `ai_calls` | M1 | Cost and quality per call | `purpose`, `model`, `prompt_version`, token counts (input / output / cached), `cost_usd_micros`, `latency_ms`, `trace_id`, `situation_id` / `guide_id` |

- **Paid unlock (M2):** reuse `orders` unchanged by adding one unpublished product row, `prod_personal_guide`, plus
  a nullable `orders.guide_id`. The payment code itself stays untouched; this still needs your approval because it's payments.
- **North-star metrics:** the first four come straight from SQL over these tables (`guide_steps.done_at`,
  `messages`, `guides.status`, guides per person). The fifth comes from `ai_calls` plus WhatsApp sends.
  That's an admin "Metrics" page, with no analytics vendor needed at first.
- **Check-in taper (M3, a pure function with unit tests):** day 1, 2, 4, 7, 10, 14, 21, 30. A reply brings the next one closer.
  Two unanswered check-ins switch to a fresh-start message, then back off. STOP ends everything.

## 4. Proposed file layout

```
src/lib/engine/                server-only guide engine (M1)
  prompts/                     versioned prompt files, e.g. understand.v1.md, safety.v1.md,
                               story.v1.md, guide.v1.md, judge.v1.md
  prompts.ts                   loads a prompt by name + version; the version is logged with every call
  schemas.ts                   zod: Situation, SafetyResult, Guide, Story, JudgeScore
  ai.server.ts                 AI SDK + Gateway client, caching, cost capture into ai_calls
  understand.ts  safety.ts  story.ts  guide.ts
  pipeline.ts                  understand → safety → (story ‖ guide)
  help-resources.ts            hand-checked Nigerian helplines for flagged cases (owner verifies each one)
src/lib/checkins/              M3: schedule.ts (taper), draft.ts, whatsapp.server.ts, webhook.server.ts
src/lib/memory/                M4
evals/
  golden/*.jsonl               50+ situations, one per line, with tags and expected safety label
  rubric.md                    the 5 scoring criteria
  run.ts                       runs the pipeline + judge, writes evals/results/<date>.json
  baseline.json                committed scores; CI fails if a criterion drops
.github/workflows/ci.yml       typecheck, lint, test; evals only when engine/ or evals/ change
migrations/0005_engine.sql     M1 tables
```

## 5. Cost estimate (estimates, not measurements; M1 replaces them with real `ai_calls` data)

Prices checked 2026-10-06 from third-party summaries. M1 re-checks them on Vercel's model page before the first real run.
Haiku 4.5: $1 / $5 per million tokens in / out. Sonnet 5.5: $2 / $10. AI Gateway adds no token markup.
WhatsApp utility template in Nigeria: about $0.012, and free inside the 24-hour window.

| Item | Assumption | Cost |
|---|---|---|
| One guide | Understand + safety + story on Haiku, guide on Sonnet (~3k in / 1.5k out), up to 2 follow-ups | **≈ $0.03** |
| One active user, one month | 1 guide + 8 check-in drafts (Haiku) + 8 templates (worst case) + memory updates | **≈ $0.15** |
| One full eval run | 50 situations × pipeline + judge | ≈ $1.50–2.20 (lower with a Haiku judge) |

At under $20/month, that's roughly 100 active users plus about 4 eval runs, **if** Vercel stays on Hobby (risk #4).
Langfuse, Sentry, PostHog and Upstash all have free tiers. I haven't verified their current limits; each gets checked when its milestone needs it.

## 6. Jobs: Inngest vs Vercel Workflows

**Neither for M3.** In M3 the owner approves every check-in in admin, and approving it is what sends it.
The admin page lists what's due by querying `checkins.due_at`. That needs no scheduler and has nothing to fail at night.
**Inngest's free tier** (50k step runs/month) comes in once a check-in type is automated. Hobby's Vercel Cron only runs once a day at a loose time,
and Inngest gives retries and per-person delays for free. I haven't evaluated Vercel Workflows pricing and won't propose it without doing so.
