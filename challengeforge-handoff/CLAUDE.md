# ChallengeForge

Multi-gym SaaS platform for fitness transformation challenges with AI-generated personalized plans.

## Quick Reference
- **Stack**: Next.js 14 (App Router), Supabase, Stripe Connect, Claude API, Resend, Vercel
- **Docs**: See `/docs/` folder for full architecture, database schema, AI prompts, screens, and build plan
- **Supabase**: Run `docs/DATABASE_SCHEMA.sql` in Supabase SQL Editor to create all tables

## Project Structure
```
challengeforge/
├── CLAUDE.md                    ← You are here
├── docs/
│   ├── ARCHITECTURE.md          ← Full product spec + user flows
│   ├── DATABASE_SCHEMA.sql      ← 7 tables + RLS + indexes
│   ├── AI_PROMPTS.md            ← All prompt templates with variables
│   ├── SCREENS.md               ← Every screen with purpose + elements
│   └── BUILD_PLAN.md            ← 4-week sprint, day-by-day tasks
├── src/
│   └── app/                     ← Next.js App Router pages
├── supabase/                    ← Supabase config (if using CLI)
└── .env.local                   ← API keys (never commit)
```

## Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
```

## Key Architecture Decisions
1. **Multi-gym from Day 1** — every table has gym_id FK, RLS enforces isolation
2. **Pre/post payment split** — only 5 fields before Stripe checkout, detailed profile after payment
3. **Magic link auth for participants** — no password, unique token per participant for dashboard access
4. **AI plan generation on payment** — Stripe webhook triggers Claude API, plan delivered within 5 minutes
5. **Track-aware leaderboard** — Hard Gainer rewards weight GAIN, Last 10 rewards weight LOSS
6. **Fallback plans** — if post-payment profile incomplete, basic plan generated from weight + goal + track

## Build Order (Week 1 Priority)
1. `npx create-next-app@latest` → deploy to Vercel → connect Supabase
2. Run DATABASE_SCHEMA.sql in Supabase SQL Editor
3. Gym owner auth (Supabase Auth email/password)
4. Challenge setup wizard (name, dates, tracks, tiers)
5. Public signup page (track → tier → quick info → photos → Stripe)
6. AI generation pipeline (Stripe webhook → Claude API → store plan)
7. Plan delivery email (Resend) with magic link
8. Admin participants table

## The SSD Model (3 Tracks × 3 Tiers)
**Tracks** (what they do):
- Hard Gainer: build muscle, +500 cal surplus, 3 strength/wk
- Last 10: fat loss, -300-500 deficit, 5 training days/wk
- Transformer: body recomp, maintenance cals, 4 workouts/wk

**Tiers** (how much support):
- The Plan ($99): program + community + basics
- The Accelerator ($199): + AI custom macros + coaching calls
- The Elite ($399): + AI daily coaching + full meal plan + PT sessions
