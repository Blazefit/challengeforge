# ChallengeForge — Claude Code Build Context

## WHAT THIS IS
ChallengeForge is a multi-gym SaaS platform for running fitness transformation challenges with AI-generated personalized plans. It's modeled on CrossFit Blaze Naples' "Summer Slim Down 2026" program.

## CORE CONCEPT
Participants choose a TRACK (what they do) and a TIER (how much support they get):
- 3 Tracks: Hard Gainer (muscle building), Last 10 (fat loss), Transformer (body recomp)
- 3 Tiers: The Plan ($99), The Accelerator ($199), The Elite ($399)
- 3x3 = 9 unique experiences, each with AI-generated personalized nutrition + training plans

## TECH STACK (locked — do not change)
- Frontend: Next.js 14 (App Router) on Vercel
- Database: Supabase (PostgreSQL + Auth + Storage + Realtime)
- Payments: Stripe Connect (gym owner connects their Stripe, CF takes 1% platform fee)
- AI: Claude API (claude-sonnet-4-20250514) for plan generation + coaching
- Email: Resend (transactional) + Loops.so (drip sequences)
- No SMS in MVP

## MULTI-GYM FROM DAY 1
Every table has a gym_id foreign key. Row Level Security ensures gym owners only see their own data. Participants access their dashboard via magic link (no password).

## THE TWO USER TYPES
1. **Gym Owner (admin)** — creates challenges, monitors participants, reviews check-ins, sends communications
2. **Participant (member)** — signs up, pays, receives AI plan, does daily check-ins, views leaderboard

## SIGNUP FLOW: PRE/POST PAYMENT SPLIT
This is critical. The signup is split into two phases:

**PRE-PAYMENT (5 steps, under 90 seconds):**
1. Select Track
2. Select Tier
3. Quick Info: name, email, phone, weight, goal weight (5 fields only)
4. Starting photos (front/side/back, skippable)
5. Pay via Stripe

**POST-PAYMENT (3 steps, optional but incentivized):**
6. Body Stats: age, sex, height, body fat %, activity level, training days/week
7. Nutrition: goal (free text), dietary restrictions, cooking skill, meal prep, budget, foods love/hate
8. AI generates and delivers personalized plan

If post-payment profile is never completed, system generates a basic plan from pre-payment data only (weight, goal weight, track). Banner shows "Complete your profile for a more personalized plan."

## AI PIPELINE
On successful Stripe payment:
1. Collect intake data from participant record
2. Select prompt template based on Track × Tier (9 variants)
3. Inject data into {{VARIABLE}} placeholders
4. Call Claude API
5. Store generated plan as markdown in participant record
6. Send welcome email with magic link to participant dashboard
7. Enroll in tier-specific drip email sequence

## TRACK-AWARE LEADERBOARD SCORING
Each track scores differently:
- Hard Gainer: 50% weight GAINED + 30% consistency + 20% strength PRs
- Last 10: 50% weight LOST + 25% consistency + 25% 10K step days
- Transformer: 35% body comp change + 35% consistency + 30% protein adherence

## PARTICIPANT HOME SCREEN (mobile-first)
After signup, members have a personal dashboard at a magic link URL:
- Check-in CTA (primary action, prominent)
- Streak counter
- Leaderboard rank
- My Plan tabs (Nutrition | Training | Grocery List | Murph Strategy)
- My Progress (weight chart, photos)
- Messages (coach notes, AI coaching feedback for Elite)

## DAILY CHECK-IN FIELDS
- Weight (number, optional daily, required weekly)
- Protein target hit (3-way: yes/no/close)
- Trained today (3-way: yes/no/rest day)
- Steps (number, primarily for Last 10 track)
- Recovery score (1-10 tap scale)
- Meal photo (Elite tier only, AI feedback within 60 sec)
- Notes (optional free text)

Post-submission automated actions:
- Leaderboard recalculates
- Streak increments
- Elite meal photo → AI coaching response
- Check-in appears in coach review queue
- If missed by 8pm → reminder email
- If missed 2 days → flagged "at-risk" on admin dashboard

## ADMIN DASHBOARD: ACTION-ORIENTED
The dashboard shows "YOUR ACTIONS TODAY" with checkable tasks:
- Nudge at-risk athletes
- Review Elite check-ins
- Share leaderboard to WhatsApp
- Preview weekly recap email

## MARKETING HUB
Auto-generates 17 Instagram posts from challenge config (name, dates, tracks, tiers, pricing). Calendar and list views. Each post has copy-paste caption, hashtags, and AI image generation prompt. Status cycling: Draft → Scheduled → Posted.

## FILE REFERENCE
- `ARCHITECTURE.md` — this file (build context)
- `DATABASE_SCHEMA.sql` — complete Supabase schema with RLS
- `AI_PROMPTS.md` — all prompt templates with variables
- `SCREENS.md` — every screen in the app
- `WEEK_BY_WEEK.md` — 4-week build plan with daily tasks
