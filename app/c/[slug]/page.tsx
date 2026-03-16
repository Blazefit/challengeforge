import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SignupForm from "./signup-form";

// ──────── Types shared with client component ────────

export interface TrackData {
  id: string;
  name: string;
  icon: string;
  color: string;
  calorie_strategy: string | null;
  training_days: string | null;
  description: string | null;
  sort_order: number;
}

export interface TierData {
  id: string;
  name: string;
  price_cents: number;
  earlybird_price_cents: number | null;
  features: string[];
  ai_plan_generation: boolean;
  ai_meal_plan: boolean;
  ai_daily_coaching: boolean;
  sort_order: number;
}

export interface ChallengeData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  start_date: string;
  end_date: string;
  early_bird_ends: string | null;
  gym: {
    name: string;
    logo_url: string | null;
    brand_color: string;
  };
}

export default async function ChallengeSignup({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch challenge by slug (RLS: public_challenge_read allows anon SELECT on active challenges)
  const { data: challenge } = await supabase
    .from("challenges")
    .select(
      `
      id,
      name,
      slug,
      description,
      start_date,
      end_date,
      early_bird_ends,
      gym:gyms!challenges_gym_id_fkey (
        name,
        logo_url,
        brand_color
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!challenge) {
    notFound();
  }

  // Fetch tracks for this challenge
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, name, icon, color, calorie_strategy, training_days, description, sort_order")
    .eq("challenge_id", challenge.id)
    .order("sort_order", { ascending: true });

  // Fetch tiers for this challenge
  const { data: tiers } = await supabase
    .from("tiers")
    .select(
      "id, name, price_cents, earlybird_price_cents, features, ai_plan_generation, ai_meal_plan, ai_daily_coaching, sort_order"
    )
    .eq("challenge_id", challenge.id)
    .order("sort_order", { ascending: true });

  if (!tracks?.length || !tiers?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Challenge Not Ready
          </h1>
          <p className="text-gray-500">
            This challenge is still being set up. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  // Normalize gym to a single object (Supabase may return array for joins)
  const gymRaw = challenge.gym;
  const gym = Array.isArray(gymRaw) ? gymRaw[0] : gymRaw;

  const challengeData: ChallengeData = {
    id: challenge.id,
    name: challenge.name,
    slug: challenge.slug,
    description: challenge.description,
    start_date: challenge.start_date,
    end_date: challenge.end_date,
    early_bird_ends: challenge.early_bird_ends,
    gym: {
      name: gym?.name ?? "Gym",
      logo_url: gym?.logo_url ?? null,
      brand_color: gym?.brand_color ?? "#dc2626",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SignupForm
        challenge={challengeData}
        tracks={tracks as TrackData[]}
        tiers={tiers as TierData[]}
      />
    </div>
  );
}
