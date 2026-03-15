# ChallengeForge — Screens Inventory

## Gym Owner (Admin) Screens

### 1. Onboarding
- **Signup**: Email, password, gym name, timezone → Supabase Auth
- **Stripe Connect**: Redirect to Stripe onboarding, return with connected account ID
- **Gym Profile**: Logo upload, brand color picker, gym URL, social handles

### 2. Setup Wizard (7 Steps)
1. **Basics**: Challenge name, slug, description, start/end dates, early bird end date
2. **Tracks**: Add 1-5 tracks, each with name, icon, color, calorie strategy, training approach, scoring direction
3. **Tiers**: Add 1-3 tiers, each with name, price, early bird price, features list, AI toggles
4. **Intake Form**: Preview the pre/post payment fields (mostly fixed, with toggles for optional fields)
5. **Email Drips**: Configure welcome emails (9 variants), set up weekly email schedule
6. **Marketing Kit**: Preview auto-generated IG posts, edit captions if desired
7. **Review & Launch**: Summary of everything, "Go Live" button

### 3. Dashboard (Daily Action Center)
- **Your Actions Today**: Checkable task list (nudge at-risk, review Elite check-ins, share leaderboard, preview recap email)
- **Stats Row**: Enrolled / Checked In Today / At-Risk / Revenue
- **Enrollment Matrix**: 3×3 grid showing count per Track × Tier
- **At-Risk List**: Participants who missed 2+ consecutive check-ins, with nudge button

### 4. Participants
- Searchable/filterable table: name, track, tier, status, last check-in, weight change, consistency %
- Click through to individual detail: intake data, AI plans, check-in history, photos, coach notes

### 5. Leaderboard
- Filter by track (All / Hard Gainer / Last 10 / Transformer)
- Columns: Rank, Name, Track, % Change, Consistency, Score
- Track-specific scoring weights displayed as labels
- Shareable public URL (first names only)
- Castable to TV (full-screen mode)

### 6. Check-Ins (Coach View)
- Today's overview: X submitted / Y missing / Z at-risk
- List of submitted check-ins with summary data
- Elite tier check-ins flagged for review (meal photo + AI feedback shown, coach can add note)
- Missing list with individual nudge buttons (sends reminder email)

### 7. Communications Hub
- **Welcome Emails**: 3×3 matrix (Track × Tier), preview each variant
- **Drip Timeline**: Visual timeline showing all scheduled emails over 8 weeks, filterable by tier/track
- **Broadcast Composer**: Send to All / by Tier / by Track / Individual, subject + body, schedule or send now

### 8. Marketing Hub
- **Calendar View**: 7-column grid by week, post cards with date/title/tag/status
- **List View**: Sortable table with all 17 posts
- **Post Detail**: IG preview mockup, caption with copy button, hashtags with copy button, AI image prompt with copy button, status cycling (Draft → Scheduled → Posted)

### 9. Gym Settings
- Edit profile (name, logo, colors)
- Stripe connection status
- Subscription/billing (ChallengeForge plan)
- Timezone

---

## Participant (Member) Screens

### 1. Signup Flow
**Pre-payment (Steps 1-5):**
- Step 1: Track selection (card per track with icon, name, description)
- Step 2: Tier selection (card per tier with price, features list, highlight recommended)
- Step 3: Quick info form (name, email, phone, weight, goal weight)
- Step 4: Starting photos (front/side/back upload, skip option)
- Step 5: Stripe checkout (embedded or redirect)

**Post-payment (Steps 6-8):**
- Step 6: Body stats (age, sex, height, body fat %, activity level, training days/week)
- Step 7: Nutrition deep dive (goal free text, restrictions, cooking skill, meal prep, budget, foods love/hate)
- Step 8: Plan delivery (animated generation sequence → plan sections appear one by one)

### 2. Home Screen (Daily Hub) — MOBILE FIRST
- **Header**: Challenge name, track badge, tier badge, "Week 3 Day 4", Murph countdown
- **Today's Action**: Large check-in button. States: "Check in now" (red) or "✓ Checked in at 7:12pm" (green). Streak counter with fire emoji
- **My Scores**: Leaderboard rank (#4 of 28), weight change (−3.2 lbs), consistency (92%). Tap to view full leaderboard
- **My Plan**: Tabs — Nutrition Plan | Training Plan | Grocery List | Murph Strategy. Content = AI-generated markdown rendered
- **My Progress**: Weight sparkline (trend over time), latest photo vs starting photo side by side
- **Messages**: Coach notes, broadcast messages, AI coaching feedback (Elite). Badge count for unread

### 3. Check-In Form (target: 90 seconds)
- Weight (number input, shows last weight for reference)
- Protein target hit (3-way toggle: Yes / No / Close, target displayed e.g. "145g")
- Trained today (3-way toggle: Yes / No / Rest Day)
- Steps (number, shown for Last 10 track, 10K target indicator)
- Recovery score (1-10 horizontal tap scale, color gradient)
- Meal photo (Elite only, labeled "AI feedback within 60 seconds")
- Notes (optional text area)
- Submit → confirmation with streak update

### 4. Leaderboard (Participant View)
- Same data as admin but first names only
- Participant's own row highlighted
- Track filter tabs
- Scoring breakdown visible (what counts for their track)

### 5. My Progress
- Weight chart (sparkline with trend line)
- Progress photos: before vs latest, organized by angle (front/side/back)
- Key stats: starting weight, current weight, change, body fat change, check-in streak
