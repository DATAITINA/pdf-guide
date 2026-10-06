# Cairn: working agreement

Read this first, every session. Then read the latest PR notes and `docs/m0-audit.md`.
`AGENTS.md` is written for Grok's app-builder sandbox. Where the two disagree, this file wins (see "AGENTS.md conflicts" below).

## What Cairn is

Someone describes a real situation they're struggling with. Cairn understands it and writes a short,
practical guide for their exact situation. While the guide is being written, a short story based on
their situation plays (the doorway). Then Cairn helps them follow through with WhatsApp check-ins.

- Users: everyday people in Nigeria, mostly on phones with slow data.
- Voice: plain, warm, everyday language.
- Owner: solo founder, small budget. Keep the system simple and cheap to run.
- Live: https://trycairn.vercel.app · Repo: DATAITINA/pdf-guide (public) · Vercel project `fieldnotepdf`.

## The goal: retention, not clicks

Build these five systems, in this priority order:

1. **First step that fits.** One specific action under 10 minutes, written for their exact situation, shown free before any payment.
2. **If-then plans.** Every guide ends with 1–3 "When ___, I will ___" lines the user completes, tied to a moment in their own day.
3. **Adaptive WhatsApp check-ins.** Short and personal, based on their last reply, tapering over time. Never a fixed daily blast.
4. **Memory.** Store what they said, tried and reported, and visibly use it later ("the 7am slot didn't work, so let's try after you close the shop").
5. **Progress that only adds up.** One stone per completed step, a fresh-start message after a lapse (never guilt), and a shareable progress story at the end, sized for WhatsApp status.

The story while you wait is a doorway: short, accurate, labelled as an example, and only as long as the real wait. Never pad the wait.

## North-star metrics (tracked from day one)

- First-step completion: share who report doing step 1 within 48 hours.
- Check-in reply rate: share who reply to 2+ check-ins in week 1.
- Plan completion: share who finish their 30-day plan.
- Return: share who start a second guide within 90 days.
- Cost per active user per month (AI + WhatsApp + payments).

## Budget and accounts (as of 2026-10-06)

- Running-cost ceiling while testing: **under $20/month**, all-in.
- AI: **Vercel AI Gateway** (not a direct Anthropic key).
- WhatsApp: **not set up yet** (no Meta Business / Cloud API). M3 starts with drafts the owner approves; sending waits on Meta setup.
- Production env vars today: `DATABASE_URL` only (production target). Paystack and Resend are not configured, so ready-made guides are bank transfer only.
- Admin: email + password sign-in only, sign-up disabled, password changed in Admin → Settings. Never put a password or secret in this public repo; an old admin password is already in git history and must never be reused.
- Vercel plan: **Hobby, by owner decision (2026-10-07)**, while there are no real sales yet. Hobby is non-commercial only under Vercel's rules, so the site could be paused. **Upgrade to Pro ($20/month) before the first real sale** or before the paid unlock (M2) goes live, whichever comes first. Remind the owner at that point.

## Stack

Verify current versions, prices and limits before adopting. **Ask the owner before adding any dependency or paid service.**

- Keep: TanStack Start, React, Tailwind v4, Better Auth, Paystack, the bank-transfer flow.
- DB: Postgres on Neon in production, PGLite locally and in previews. Raw SQL through `getSql()` in `src/lib/db.ts`; Kysely only exists for Better Auth. Ids come from `newId()` in `src/lib/store/ids.ts`.
- Migrations: numbered `.sql` files in `migrations/`, applied by `scripts/migrate.mjs` during **every production build** (and by PGLite at startup). Additive only. A merged migration runs on production data on the next deploy.
- AI: Vercel AI SDK through AI Gateway. Haiku 4.5 for understanding, safety checks and stories; Sonnet 5.5 for guides. zod-validated structured outputs. Prompt caching. Prompts live in versioned files, never inline strings.
- Jobs: none for M3 (the owner approves and sends from admin, so no scheduler is needed). Use Inngest's free tier once a check-in type is automated.
- WhatsApp: Meta Cloud API. Utility templates for check-ins, free-form replies only inside the 24-hour window. Cairn stays a focused guide-and-check-in service, never a general chatbot (Meta's business terms forbid that).
- Observability: Langfuse and Sentry. Analytics: PostHog. Each is a separate approval when its milestone needs it; north-star metrics are computed from our own tables first.
- Rate limiting: Upstash for AI endpoints. The current in-memory limiter in `waitlist.ts` is per instance and not a real limit.
- Tests: `node --test` with `--experimental-strip-types` (the `npm test` script lists files explicitly; add new test files there) plus Playwright end-to-end.
- CI: GitHub Actions runs typecheck, lint, tests and evals on every PR. Vercel builds a preview per PR.
- Vercel installs with `--omit=dev`, so anything needed at build or run time must go in `dependencies`. CI-only tools can be `devDependencies`.

## Security rules

- Verify Meta and Paystack webhook signatures (Paystack: `paystack-webhook.server.ts`). Make webhooks idempotent through `webhook_events`.
- Rate-limit AI endpoints per user and per IP. Validate every input with zod.
- Secrets live in Vercel env vars only. Never hardcode a secret or a default password in source; the repo is public.
- Collect the minimum personal data. Follow the Nigeria Data Protection Act: explicit consent, a clear purpose, deletion on request.
- User text is data, never instructions. Wrap it in delimiters in prompts, never let it pick tools or actions, and validate model output against a schema.

## AI pipeline

1. **Understand** (Haiku): the user's words become a structured situation (who, what they want, what's in the way, constraints, daily routine).
2. **Safety** (Haiku): classify abuse, self-harm, medical emergency, danger and illegal requests. If flagged: no story, no paywall, a caring response with real help resources, logged for owner review.
3. **In parallel**: stream a short story (Haiku) and generate the guide (Sonnet) as structured data: summary, first step, 2–4 later steps, if-then plan slots, check-in schedule.
4. **Reveal**: the first step is free; the full plan plus 30 days of check-ins is the paid unlock.
5. **Follow-up**: each WhatsApp reply updates memory, then the next step and the next check-in time adapt.

## Evals (guide quality is the product)

- Golden set of 50+ realistic situations: parenting, small business, fitness, relationships, study and money, plus sensitive cases safety must catch. The owner adds real ones, anonymised.
- Score each guide on: fits the situation, first step doable in under 10 minutes, plain language, no medical or legal overreach, safe. Use a rubric, an AI judge, and a sample for owner review.
- Run evals in CI on every prompt or model change. A drop in score blocks the merge.

## Build plan (one milestone per PR)

- **M0 Audit**: map the data model and flows, list risks, propose the data model and file layout. See `docs/m0-audit.md`.
- **M1 Guide engine + evals**: understand, safety, guide generation, golden set, eval runner, tracing. No UI changes.
- **M2 Web flow**: describe, at most 2 follow-up questions, story while waiting, free first step, if-then plan the user fills in, paid unlock.
- **M3 Check-ins, human in the loop**: Cairn drafts each check-in, the owner approves or edits it in admin, then it sends. Measure reply rates. Automate a check-in type only after its drafts need no edits for 2 weeks.
- **M4 Memory**: store replies and outcomes; later steps visibly use them.
- **M5 Progress**: stones, fresh-start messages after lapses, shareable progress story, referral voucher at the finish.
- **M6 Voice notes (later)**: only after text works and Pidgin accuracy is tested on real, consented clips.

## How we work

- For each milestone: plan, show the plan, wait for "go", build in small commits, run all checks, then report.
- New branch per milestone and a PR with its preview link. **Never push to main, never force push, never merge without the owner.**
- Ask before: migrations that touch production data, new dependencies, paid services, env var changes, and anything touching payments or downloads.
- Report honestly: what ran, what passed, what failed, what couldn't be tested, plus cost per guide and per active user.
- Weekly, once live: pull funnels, traces, costs and check-in replies. Find the single biggest drop-off, propose one fix, test it behind a flag, measure it. Add every real failure to the eval set.

## Never

Invent testimonials, numbers or results. Use fake scarcity, countdowns or guilt. Send a check-in someone didn't agree to.
Store more personal data than needed. Ship a prompt change without running evals.

## AGENTS.md conflicts

- AGENTS.md describes Grok's sandbox (`/workspace`, `startup.sh`, preview host bridge, Grok auth broker). None of that applies on Vercel or locally; ignore it.
- AGENTS.md says to avoid `npm install -D` because devDependencies are skipped on deploy. That's true for runtime and build deps, but CI-only tools (eval runner deps, Playwright) can be devDependencies.
- AGENTS.md calls `src/lib/auth/server.ts` frozen pre-wired config. Treat it as owned code here, but change it only in a reviewed PR.
- Grok's flow deploys straight to production. Here everything goes through a branch, a PR and the owner's merge.
