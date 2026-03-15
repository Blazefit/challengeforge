# ChallengeForge — 4-Week Build Plan

## WEEK 1: Signup + Payment + AI Generation
**Goal**: A participant can find the challenge, select track/tier, sign up, pay, and receive their AI-generated plan within 5 minutes. Admin can see who enrolled.

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon | Project setup: `npx create-next-app@latest challengeforge`, deploy to Vercel, create Supabase project, run DATABASE_SCHEMA.sql, set up env vars | Deployed app at challengeforge.vercel.app with empty DB |
| Tue | Gym owner auth (Supabase Auth, email/password). Gym onboarding: signup form, Stripe Connect redirect, gym profile (name, logo, timezone). Challenge setup wizard steps 1-3 (basics, tracks, tiers) | Gym owner can create account, connect Stripe, define a challenge |
| Wed | Public signup page: `/c/[slug]` route. Track selection cards, tier selection cards, quick info form (5 fields), starting photo upload to Supabase Storage, Stripe checkout (embedded). Pre-payment flow complete | Member can view challenge, pick track/tier, fill 5 fields, pay |
| Thu | AI generation pipeline: Stripe webhook endpoint → fetch participant + track + tier data → select prompt template → inject variables → call Claude API → parse response → store markdown in participant record → send welcome email via Resend with magic link | Member pays → receives personalized AI plan via email within 5 min |
| Fri | Post-payment profile flow (body stats + nutrition forms). If profile completed → re-trigger AI with enriched data. Admin participants screen (table with name, track, tier, status, payment). | Member can complete full profile. Admin sees enrolled members |

### Week 1 Technical Notes
- Stripe Connect: use `payment_intents` with `application_fee_amount` (1% of charge) and `transfer_data.destination` (gym's connected account)
- Stripe webhook: listen for `payment_intent.succeeded`, extract `metadata.participant_id`
- Claude API: use `claude-sonnet-4-20250514`, `max_tokens: 4000` for plan generation
- Magic link: participant.magic_link_token UUID → dashboard URL is `/dashboard/[token]`
- Photos: upload to Supabase Storage bucket `progress-photos`, path: `{participant_id}/starting/{front|side|back}.jpg`

---

## WEEK 2: Check-Ins + Leaderboard + Participant Home
**Goal**: Members have a daily hub. Check-ins work. Leaderboard auto-calculates. Drip emails fire.

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon | Participant home screen at `/dashboard/[token]`: header (challenge/track/tier/week/day), check-in CTA button, streak counter, leaderboard rank, My Plan tabs (render stored AI markdown), progress section | Members have a daily hub at their magic link URL |
| Tue | Check-in form: all fields per spec (weight, protein toggle, trained toggle, steps, recovery 1-10, meal photo, notes). One check-in per day enforced. Post-submit: streak increment, confirmation | Members can submit daily check-ins |
| Wed | Leaderboard engine: query all checkins for challenge, calculate scores per track rules (Hard Gainer: gain=good, Last 10: loss=good, Transformer: consistency). Public shareable URL at `/c/[slug]/leaderboard`. Admin view with full data | Auto-calculated leaderboard with track filters |
| Thu | Drip email system: pre-build 8-week email templates. On signup, enroll participant in correct tier sequence. Resend scheduled sends. Automated 7pm check-in reminder if not submitted today | Automated emails firing on schedule |
| Fri | Admin dashboard: action cards (today's tasks), stats row (enrolled/checked-in/at-risk/revenue), check-in coach view (submitted vs missing, nudge buttons), at-risk alerts (2+ missed days) | Gym owner has functional daily command center |

### Week 2 Technical Notes
- Leaderboard scoring: calculate on read (not stored). Query checkins, compute % weight change from starting, count check-in days / total days for consistency, compute track-specific composite score
- Streak: count consecutive days with a check-in record ending at yesterday or today
- At-risk: participants where latest check-in date < today - 2 days
- Check-in reminder: Resend scheduled email at 7pm local (gym timezone), skip if check-in already exists for today
- Supabase Realtime: optional — subscribe to checkins table for live leaderboard updates on TV display

---

## WEEK 3: Polish + Marketing + Progress
**Goal**: Progress tracking works. Marketing hub populated. End-to-end tested.

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon | My Progress section: weight sparkline chart (use recharts or chart.js), progress photo display (before vs latest side by side per angle), key stats summary | Members can visually track their transformation |
| Tue | Marketing hub: auto-generate 17 IG posts from challenge config. Calendar view (7-col grid by week) + list view. Copy buttons for caption/hashtags/image prompt. Status cycling | Gym owner has complete pre-launch marketing calendar |
| Wed | Communications hub: 9-variant welcome email preview matrix, drip timeline visualization, broadcast composer (send to all/tier/track/individual via Resend) | Gym owner can manage all communications |
| Thu | Full end-to-end test: create challenge → configure tracks/tiers → member signup → AI plan delivery → daily check-in → leaderboard update → drip email → marketing hub. Fix every bug | Complete user journey working |
| Fri | Marketing site: homepage, pricing page ($99/challenge or $49/mo or $399/yr), demo video placeholder, gym owner signup CTA. Basic SEO (meta tags, OG images) | Public website ready to attract gym owners |

---

## WEEK 4: CrossFit Blaze Live Beta
**Goal**: Run the actual Summer Slim Down on ChallengeForge with real members and real money.

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon | Configure SSD 2026 in ChallengeForge: 3 tracks, 3 tiers, all pricing, early bird dates, 8-week drip sequences, all intake fields. Test with 2-3 staff accounts | SSD 2026 is live on ChallengeForge |
| Tue | Announce to CrossFit Blaze members. Share signup link. First real participants enroll and receive AI plans | Real members enrolled with real payments |
| Wed-Thu | Monitor: AI plan quality, payment processing, check-in flow, leaderboard accuracy, email delivery, dashboard usability. Hotfix bugs. Screenshot everything for case study | 2 days of real-world validation data |
| Fri | Record demo video (setup wizard → signup → plan delivery → admin dashboard). Write SEO article: "How to Run a Gym Transformation Challenge in 2026" | Demo + first content piece for external marketing |

---

## Post-Launch Priorities (Weeks 5-8, while SSD runs)
1. Iterate based on real member feedback from SSD
2. Before/after photo comparison auto-generator
3. Results/winner screen for challenge completion
4. Elite tier AI coaching response (on check-in submission)
5. Second gym owner onboarded (first external customer)
6. SEO content: 3-5 articles targeting "gym challenge software", "fitness transformation platform"
