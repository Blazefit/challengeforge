-- ═══════════════════════════════════════
-- ChallengeForge Database Schema
-- Supabase (PostgreSQL)
-- Multi-gym from Day 1
-- ═══════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── ENUMS ───
create type challenge_status as enum ('draft', 'active', 'completed');
create type participant_status as enum ('active', 'dropped', 'completed');
create type protein_hit as enum ('yes', 'no', 'close');
create type trained_status as enum ('yes', 'no', 'rest_day');
create type email_type as enum ('welcome', 'checkin', 'value', 'motivation', 'milestone', 'murph', 'coaching', 'recap', 'results', 'retention');

-- ─── GYMS ───
create table gyms (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  logo_url text,
  brand_color text default '#dc2626',
  stripe_account_id text,
  timezone text default 'America/New_York',
  created_at timestamptz default now()
);

-- ─── CHALLENGES ───
create table challenges (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid not null references gyms(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  start_date date not null,
  end_date date not null,
  status challenge_status default 'draft',
  scoring_config jsonb default '{}',
  early_bird_ends date,
  created_at timestamptz default now()
);

-- ─── TRACKS ───
-- Tracks define WHAT the participant does (programming, nutrition strategy)
create table tracks (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  name text not null,
  icon text default '💪',
  color text default '#ef4444',
  calorie_strategy text,         -- '500+ surplus', '300-500 deficit', 'Maintenance'
  training_days text,            -- '3 strength/week', '5 training/week', etc
  description text,
  scoring_direction text default 'lose',  -- 'gain' for Hard Gainer, 'lose' for others
  sort_order integer default 0
);

-- ─── TIERS ───
-- Tiers define HOW MUCH SUPPORT the participant gets
create table tiers (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  name text not null,
  price_cents integer not null,           -- 9900 = $99.00
  earlybird_price_cents integer,          -- 7400 = $74.00, null = no early bird
  features jsonb default '[]',            -- Array of feature strings for display
  ai_plan_generation boolean default false,  -- Accelerator + Elite
  ai_meal_plan boolean default false,        -- Elite only
  ai_daily_coaching boolean default false,   -- Elite only
  sort_order integer default 0
);

-- ─── PARTICIPANTS ───
create table participants (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  track_id uuid not null references tracks(id),
  tier_id uuid not null references tiers(id),
  name text not null,
  email text not null,
  phone text,

  -- Pre-payment data (always present)
  intake_pre jsonb not null default '{}',
  -- Expected: { weight: 172, goal_weight: 155 }

  -- Post-payment data (nullable — may never be completed)
  intake_post jsonb,
  -- Expected: { age: 34, sex: "Female", height: "5'6\"", body_fat: "28%",
  --   activity: "Moderately Active", train_days: 5, restrictions: "Gluten-free",
  --   goal: "Lose body fat, keep muscle", cooking: "Moderate", meal_prep: "Yes",
  --   budget: "Moderate", foods_love: "salmon, sweet potatoes", foods_hate: "mushrooms, tofu" }

  starting_photos jsonb,          -- [front_url, side_url, back_url]
  final_photos jsonb,             -- [front_url, side_url, back_url]

  -- AI-generated content (cached)
  ai_nutrition_plan text,         -- Markdown
  ai_training_plan text,          -- Markdown
  ai_meal_plan text,              -- Elite only: full 7-day meal plan markdown
  ai_generated_at timestamptz,

  stripe_payment_id text,
  status participant_status default 'active',
  magic_link_token uuid default uuid_generate_v4(),  -- Passwordless dashboard access
  profile_completed boolean default false,
  created_at timestamptz default now()
);

-- Unique: one signup per email per challenge
create unique index idx_participants_email_challenge on participants(email, challenge_id);

-- ─── CHECK-INS ───
create table checkins (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid not null references participants(id) on delete cascade,
  date date not null,
  weight decimal,                 -- Lbs, nullable (optional daily, required weekly)
  protein_hit protein_hit,
  trained trained_status,
  steps integer,                  -- Primarily for Last 10 track
  recovery_score integer check (recovery_score between 1 and 10),
  meal_photo_url text,            -- Elite: uploaded meal photo
  ai_feedback text,               -- Elite: AI coaching response
  coach_note text,                -- Manual note from coach
  notes text,                     -- Free text from participant
  created_at timestamptz default now()
);

-- One check-in per participant per day
create unique index idx_checkins_participant_date on checkins(participant_id, date);

-- ─── DRIP EMAILS ───
create table drip_emails (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  tier_id uuid references tiers(id),     -- null = all tiers
  track_id uuid references tracks(id),   -- null = all tracks
  send_day integer not null,             -- Day offset from challenge start
  subject_template text not null,
  body_template text not null,           -- Markdown with {{name}}, {{track}}, {{week}} variables
  type email_type not null
);

-- ═══════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════

alter table gyms enable row level security;
alter table challenges enable row level security;
alter table tracks enable row level security;
alter table tiers enable row level security;
alter table participants enable row level security;
alter table checkins enable row level security;
alter table drip_emails enable row level security;

-- Gym owners see only their own gym
create policy "gym_owner_select" on gyms for select using (auth.email() = email);
create policy "gym_owner_update" on gyms for update using (auth.email() = email);

-- Gym owners see only their challenges
create policy "gym_challenges" on challenges for all using (
  gym_id in (select id from gyms where email = auth.email())
);

-- Tracks/tiers belong to challenges
create policy "gym_tracks" on tracks for all using (
  challenge_id in (select id from challenges where gym_id in (select id from gyms where email = auth.email()))
);

create policy "gym_tiers" on tiers for all using (
  challenge_id in (select id from challenges where gym_id in (select id from gyms where email = auth.email()))
);

-- Participants: gym owners see all their participants, participants see themselves via magic link
create policy "gym_participants" on participants for all using (
  challenge_id in (select id from challenges where gym_id in (select id from gyms where email = auth.email()))
);

-- Public read for participant signup pages (anon can view challenge/track/tier info)
create policy "public_challenge_read" on challenges for select using (status = 'active');
create policy "public_tracks_read" on tracks for select using (true);
create policy "public_tiers_read" on tiers for select using (true);

-- Anon can insert participants (signup flow)
create policy "public_participant_insert" on participants for insert with check (true);

-- Check-ins: participants can insert their own, gym owners can read all
create policy "participant_checkin_insert" on checkins for insert with check (true);
create policy "gym_checkins_read" on checkins for select using (
  participant_id in (
    select id from participants where challenge_id in (
      select id from challenges where gym_id in (select id from gyms where email = auth.email())
    )
  )
);

-- Drip emails: gym owners manage their own
create policy "gym_drip_emails" on drip_emails for all using (
  challenge_id in (select id from challenges where gym_id in (select id from gyms where email = auth.email()))
);

-- ═══════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════

create index idx_challenges_gym on challenges(gym_id);
create index idx_challenges_slug on challenges(slug);
create index idx_tracks_challenge on tracks(challenge_id);
create index idx_tiers_challenge on tiers(challenge_id);
create index idx_participants_challenge on participants(challenge_id);
create index idx_participants_magic_link on participants(magic_link_token);
create index idx_checkins_participant on checkins(participant_id);
create index idx_checkins_date on checkins(date);
create index idx_drip_emails_challenge on drip_emails(challenge_id);
