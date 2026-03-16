"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ──────── Types ────────

interface ChallengeBasics {
  name: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  early_bird_ends: string;
}

interface Track {
  id: string;
  name: string;
  icon: string;
  color: string;
  calorie_strategy: string;
  training_days: string;
  description: string;
  scoring_direction: string;
  sort_order: number;
}

interface Tier {
  id: string;
  name: string;
  price_cents: number;
  earlybird_price_cents: number;
  features: string[];
  ai_plan_generation: boolean;
  ai_meal_plan: boolean;
  ai_daily_coaching: boolean;
  sort_order: number;
}

// ──────── Defaults (SSD Model) ────────

const DEFAULT_TRACKS: Track[] = [
  {
    id: crypto.randomUUID(),
    name: "Hard Gainer",
    icon: "\u{1F4AA}",
    color: "#3b82f6",
    calorie_strategy: "500+ calorie surplus",
    training_days: "3 strength sessions/week",
    description: "Build muscle mass with a structured surplus and heavy lifting program.",
    scoring_direction: "gain",
    sort_order: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "Last 10",
    icon: "\u{1F525}",
    color: "#ef4444",
    calorie_strategy: "300-500 calorie deficit",
    training_days: "5 training days/week",
    description: "Shed those final stubborn pounds with precision nutrition and high-frequency training.",
    scoring_direction: "lose",
    sort_order: 1,
  },
  {
    id: crypto.randomUUID(),
    name: "Transformer",
    icon: "\u{26A1}",
    color: "#8b5cf6",
    calorie_strategy: "Maintenance calories",
    training_days: "4 workouts/week",
    description: "Simultaneous fat loss and muscle gain through strategic body recomposition.",
    scoring_direction: "lose",
    sort_order: 2,
  },
];

const DEFAULT_TIERS: Tier[] = [
  {
    id: crypto.randomUUID(),
    name: "The Plan",
    price_cents: 9900,
    earlybird_price_cents: 7400,
    features: [
      "8-week structured program",
      "Track-specific training plan",
      "Basic macro targets",
      "Community leaderboard",
      "Weekly email check-ins",
    ],
    ai_plan_generation: false,
    ai_meal_plan: false,
    ai_daily_coaching: false,
    sort_order: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "The Accelerator",
    price_cents: 19900,
    earlybird_price_cents: 14900,
    features: [
      "Everything in The Plan",
      "AI-personalized macro plan",
      "Custom training program",
      "Bi-weekly coaching calls",
      "Priority support",
    ],
    ai_plan_generation: true,
    ai_meal_plan: false,
    ai_daily_coaching: false,
    sort_order: 1,
  },
  {
    id: crypto.randomUUID(),
    name: "The Elite",
    price_cents: 39900,
    earlybird_price_cents: 29900,
    features: [
      "Everything in The Accelerator",
      "Full 7-day AI meal plan",
      "AI daily coaching feedback",
      "Meal photo analysis",
      "1-on-1 PT sessions",
      "Grocery list generation",
    ],
    ai_plan_generation: true,
    ai_meal_plan: true,
    ai_daily_coaching: true,
    sort_order: 2,
  },
];

// ──────── Helpers ────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

// ──────── Step Components ────────

function StepBasics({
  basics,
  setBasics,
}: {
  basics: ChallengeBasics;
  setBasics: React.Dispatch<React.SetStateAction<ChallengeBasics>>;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Challenge Name
        </label>
        <input
          type="text"
          required
          value={basics.name}
          onChange={(e) => {
            const name = e.target.value;
            setBasics((prev) => ({
              ...prev,
              name,
              slug: slugify(name),
            }));
          }}
          placeholder="Summer Slim Down 2026"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL Slug
        </label>
        <div className="flex items-center">
          <span className="text-sm text-gray-400 mr-2">yourgym.challengeforge.com/c/</span>
          <input
            type="text"
            required
            value={basics.slug}
            onChange={(e) =>
              setBasics((prev) => ({ ...prev, slug: slugify(e.target.value) }))
            }
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          rows={3}
          value={basics.description}
          onChange={(e) =>
            setBasics((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="An 8-week body transformation challenge with personalized AI coaching..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            required
            value={basics.start_date}
            onChange={(e) =>
              setBasics((prev) => ({ ...prev, start_date: e.target.value }))
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            required
            value={basics.end_date}
            onChange={(e) =>
              setBasics((prev) => ({ ...prev, end_date: e.target.value }))
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Early Bird Ends
          </label>
          <input
            type="date"
            value={basics.early_bird_ends}
            onChange={(e) =>
              setBasics((prev) => ({
                ...prev,
                early_bird_ends: e.target.value,
              }))
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function StepTracks({
  tracks,
  setTracks,
}: {
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
}) {
  function addTrack() {
    if (tracks.length >= 5) return;
    setTracks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        icon: "\u{1F3CB}",
        color: "#6b7280",
        calorie_strategy: "",
        training_days: "",
        description: "",
        scoring_direction: "lose",
        sort_order: prev.length,
      },
    ]);
  }

  function removeTrack(id: string) {
    if (tracks.length <= 1) return;
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTrack(id: string, field: keyof Track, value: string) {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Tracks define what participants do. Add 1-5 tracks for your challenge.
      </p>

      {tracks.map((track, index) => (
        <div
          key={track.id}
          className="border border-gray-200 rounded-xl p-5 space-y-4"
          style={{ borderLeftColor: track.color, borderLeftWidth: 4 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Track {index + 1}
            </h3>
            {tracks.length > 1 && (
              <button
                type="button"
                onClick={() => removeTrack(track.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={track.name}
                onChange={(e) => updateTrack(track.id, "name", e.target.value)}
                placeholder="e.g. Hard Gainer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  value={track.icon}
                  onChange={(e) =>
                    updateTrack(track.id, "icon", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={track.color}
                  onChange={(e) =>
                    updateTrack(track.id, "color", e.target.value)
                  }
                  className="w-12 h-9 rounded border border-gray-300 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <input
              type="text"
              value={track.description}
              onChange={(e) =>
                updateTrack(track.id, "description", e.target.value)
              }
              placeholder="Brief description of this track"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Calorie Strategy
              </label>
              <input
                type="text"
                value={track.calorie_strategy}
                onChange={(e) =>
                  updateTrack(track.id, "calorie_strategy", e.target.value)
                }
                placeholder="e.g. 500+ surplus"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Training Days
              </label>
              <input
                type="text"
                value={track.training_days}
                onChange={(e) =>
                  updateTrack(track.id, "training_days", e.target.value)
                }
                placeholder="e.g. 3 strength/week"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Scoring Direction
              </label>
              <select
                value={track.scoring_direction}
                onChange={(e) =>
                  updateTrack(track.id, "scoring_direction", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
              >
                <option value="lose">Weight Loss</option>
                <option value="gain">Weight Gain</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      {tracks.length < 5 && (
        <button
          type="button"
          onClick={addTrack}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium hover:border-red-400 hover:text-red-500 transition-colors"
        >
          + Add Track
        </button>
      )}
    </div>
  );
}

function StepTiers({
  tiers,
  setTiers,
}: {
  tiers: Tier[];
  setTiers: React.Dispatch<React.SetStateAction<Tier[]>>;
}) {
  function addTier() {
    if (tiers.length >= 3) return;
    setTiers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        price_cents: 0,
        earlybird_price_cents: 0,
        features: [""],
        ai_plan_generation: false,
        ai_meal_plan: false,
        ai_daily_coaching: false,
        sort_order: prev.length,
      },
    ]);
  }

  function removeTier(id: string) {
    if (tiers.length <= 1) return;
    setTiers((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTier(id: string, field: string, value: unknown) {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  function updateFeature(tierId: string, index: number, value: string) {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        const features = [...t.features];
        features[index] = value;
        return { ...t, features };
      })
    );
  }

  function addFeature(tierId: string) {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        return { ...t, features: [...t.features, ""] };
      })
    );
  }

  function removeFeature(tierId: string, index: number) {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.id !== tierId) return t;
        const features = t.features.filter((_, i) => i !== index);
        return { ...t, features };
      })
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Tiers define how much support participants get. Add 1-3 tiers.
      </p>

      {tiers.map((tier, index) => (
        <div
          key={tier.id}
          className="border border-gray-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Tier {index + 1}
              {tier.name && (
                <span className="ml-2 text-gray-400 font-normal">
                  &mdash; {tier.name}
                </span>
              )}
            </h3>
            {tiers.length > 1 && (
              <button
                type="button"
                onClick={() => removeTier(tier.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tier Name
              </label>
              <input
                type="text"
                required
                value={tier.name}
                onChange={(e) => updateTier(tier.id, "name", e.target.value)}
                placeholder="e.g. The Elite"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  required
                  min={0}
                  value={tier.price_cents / 100 || ""}
                  onChange={(e) =>
                    updateTier(
                      tier.id,
                      "price_cents",
                      Math.round(parseFloat(e.target.value || "0") * 100)
                    )
                  }
                  placeholder="99"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Early Bird Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  value={tier.earlybird_price_cents / 100 || ""}
                  onChange={(e) =>
                    updateTier(
                      tier.id,
                      "earlybird_price_cents",
                      Math.round(parseFloat(e.target.value || "0") * 100)
                    )
                  }
                  placeholder="74"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Features
            </label>
            <div className="space-y-2">
              {tier.features.map((feature, fi) => (
                <div key={fi} className="flex gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) =>
                      updateFeature(tier.id, fi, e.target.value)
                    }
                    placeholder="e.g. AI-personalized macro plan"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                  {tier.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(tier.id, fi)}
                      className="px-2 text-gray-400 hover:text-red-500"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addFeature(tier.id)}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                + Add feature
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              AI Features
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={tier.ai_plan_generation}
                  onChange={(e) =>
                    updateTier(tier.id, "ai_plan_generation", e.target.checked)
                  }
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                AI Plan Generation
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={tier.ai_meal_plan}
                  onChange={(e) =>
                    updateTier(tier.id, "ai_meal_plan", e.target.checked)
                  }
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                AI Meal Plan
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={tier.ai_daily_coaching}
                  onChange={(e) =>
                    updateTier(tier.id, "ai_daily_coaching", e.target.checked)
                  }
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                AI Daily Coaching
              </label>
            </div>
          </div>

          <div className="text-right text-sm text-gray-400">
            {formatPrice(tier.price_cents)}
            {tier.earlybird_price_cents > 0 && (
              <span className="ml-2">
                (early bird: {formatPrice(tier.earlybird_price_cents)})
              </span>
            )}
          </div>
        </div>
      ))}

      {tiers.length < 3 && (
        <button
          type="button"
          onClick={addTier}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium hover:border-red-400 hover:text-red-500 transition-colors"
        >
          + Add Tier
        </button>
      )}
    </div>
  );
}

// ──────── Main Wizard ────────

const STEP_LABELS = ["Basics", "Tracks", "Tiers"];

export default function NewChallenge() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const [basics, setBasics] = useState<ChallengeBasics>({
    name: "Summer Slim Down 2026",
    slug: "summer-slim-down-2026",
    description: "An 8-week body transformation challenge at CrossFit Blaze. Three tracks — Hard Gainer, Last 10, and Transformer — with AI-personalized coaching, nutrition plans, and a grand finale Murph on May 23rd.",
    start_date: "2026-04-01",
    end_date: "2026-05-23",
    early_bird_ends: "2026-03-25",
  });

  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS);

  const [gymId, setGymId] = useState<string | null>(null);

  const loadGym = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/signup");
      return;
    }
    const { data: gym } = await supabase
      .from("gyms")
      .select("id")
      .eq("email", user.email!)
      .single();
    if (gym) {
      setGymId(gym.id);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadGym();
  }, [loadGym]);

  async function handleSave() {
    if (!gymId) {
      setError("Gym not found. Please complete onboarding first.");
      return;
    }

    // Validate
    if (!basics.name || !basics.slug || !basics.start_date || !basics.end_date) {
      setError("Please fill in all required fields in the Basics step.");
      return;
    }

    if (tracks.some((t) => !t.name)) {
      setError("All tracks must have a name.");
      return;
    }

    if (tiers.some((t) => !t.name || t.price_cents <= 0)) {
      setError("All tiers must have a name and price.");
      return;
    }

    setSaving(true);
    setError(null);

    // 1. Create challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .insert({
        gym_id: gymId,
        name: basics.name,
        slug: basics.slug,
        description: basics.description || null,
        start_date: basics.start_date,
        end_date: basics.end_date,
        early_bird_ends: basics.early_bird_ends || null,
        status: "draft",
      })
      .select("id")
      .single();

    if (challengeError || !challenge) {
      setError(challengeError?.message || "Failed to create challenge");
      setSaving(false);
      return;
    }

    // 2. Create tracks
    const trackInserts = tracks.map((t) => ({
      challenge_id: challenge.id,
      name: t.name,
      icon: t.icon,
      color: t.color,
      calorie_strategy: t.calorie_strategy || null,
      training_days: t.training_days || null,
      description: t.description || null,
      scoring_direction: t.scoring_direction,
      sort_order: t.sort_order,
    }));

    const { error: trackError } = await supabase
      .from("tracks")
      .insert(trackInserts);

    if (trackError) {
      setError("Challenge created but failed to save tracks: " + trackError.message);
      setSaving(false);
      return;
    }

    // 3. Create tiers
    const tierInserts = tiers.map((t) => ({
      challenge_id: challenge.id,
      name: t.name,
      price_cents: t.price_cents,
      earlybird_price_cents: t.earlybird_price_cents || null,
      features: t.features.filter((f) => f.trim() !== ""),
      ai_plan_generation: t.ai_plan_generation,
      ai_meal_plan: t.ai_meal_plan,
      ai_daily_coaching: t.ai_daily_coaching,
      sort_order: t.sort_order,
    }));

    const { error: tierError } = await supabase
      .from("tiers")
      .insert(tierInserts);

    if (tierError) {
      setError("Challenge and tracks created but failed to save tiers: " + tierError.message);
      setSaving(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Challenge</h1>
        <p className="text-gray-500 mt-1">Set up your fitness transformation challenge</p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-12 h-0.5 ${
                  i <= step ? "bg-red-500" : "bg-gray-200"
                }`}
              />
            )}
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                i === step
                  ? "bg-red-600 text-white"
                  : i < step
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {i + 1}
              </span>
              {label}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {step === 0 && <StepBasics basics={basics} setBasics={setBasics} />}
        {step === 1 && <StepTracks tracks={tracks} setTracks={setTracks} />}
        {step === 2 && <StepTiers tiers={tiers} setTiers={setTiers} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>

        {step < STEP_LABELS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Creating Challenge..." : "Create Challenge"}
          </button>
        )}
      </div>
    </div>
  );
}
