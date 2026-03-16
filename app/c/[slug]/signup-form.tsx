"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
export interface TrackData {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  calorie_strategy: string;
  training_days: string;
}

export interface TierData {
  id: string;
  name: string;
  price_cents: number;
  earlybird_price_cents: number | null;
  features: string[];
  ai_plan_generation?: boolean;
  ai_meal_plan?: boolean;
  ai_daily_coaching?: boolean;
}

export interface ChallengeData {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  early_bird_ends: string | null;
  gym: {
    name: string;
    logo_url?: string;
  };
}

// ──────── Helpers ────────

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function isEarlyBird(earlyBirdEnds: string | null): boolean {
  if (!earlyBirdEnds) return false;
  return new Date(earlyBirdEnds) > new Date();
}

// ──────── Step 1: Track Selection ────────

function StepTrackSelection({
  tracks,
  selectedTrackId,
  onSelect,
}: {
  tracks: TrackData[];
  selectedTrackId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Choose Your Track</h2>
        <p className="text-sm text-gray-500 mt-1">
          Pick the path that matches your goal
        </p>
      </div>

      <div className="space-y-3">
        {tracks.map((track) => {
          const isSelected = selectedTrackId === track.id;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => onSelect(track.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-current shadow-md ring-1 ring-current"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={
                isSelected
                  ? { borderColor: track.color, color: track.color }
                  : undefined
              }
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">
                  {track.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-semibold text-base"
                      style={isSelected ? { color: track.color } : { color: "#111827" }}
                    >
                      {track.name}
                    </h3>
                    {isSelected && (
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  {track.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {track.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {track.calorie_strategy && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {track.calorie_strategy}
                      </span>
                    )}
                    {track.training_days && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {track.training_days}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ──────── Step 2: Tier Selection ────────

function StepTierSelection({
  tiers,
  selectedTierId,
  earlyBird,
  onSelect,
}: {
  tiers: TierData[];
  selectedTierId: string | null;
  earlyBird: boolean;
  onSelect: (id: string) => void;
}) {
  // Middle tier is recommended
  const recommendedIndex = Math.floor(tiers.length / 2);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Choose Your Support Level
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          More support means faster results
        </p>
        {earlyBird && (
          <div className="inline-block mt-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            Early bird pricing active!
          </div>
        )}
      </div>

      <div className="space-y-3">
        {tiers.map((tier, index) => {
          const isSelected = selectedTierId === tier.id;
          const isRecommended = index === recommendedIndex;
          const showEarlyBird =
            earlyBird && tier.earlybird_price_cents && tier.earlybird_price_cents > 0;
          const displayPrice = showEarlyBird
            ? tier.earlybird_price_cents!
            : tier.price_cents;

          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => onSelect(tier.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all relative ${
                isSelected
                  ? "border-red-500 shadow-md bg-red-50/30"
                  : isRecommended
                  ? "border-red-200 hover:border-red-300"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-red-600 text-white text-xs font-medium rounded-full">
                  Recommended
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-gray-900">
                      {tier.name}
                    </h3>
                    {isSelected && (
                      <svg
                        className="w-5 h-5 text-red-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  <ul className="mt-2 space-y-1">
                    {(tier.features as string[]).map((feature, fi) => (
                      <li
                        key={fi}
                        className="text-sm text-gray-600 flex items-start gap-1.5"
                      >
                        <svg
                          className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* AI feature badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tier.ai_plan_generation && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        AI Plans
                      </span>
                    )}
                    {tier.ai_meal_plan && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        AI Meals
                      </span>
                    )}
                    {tier.ai_daily_coaching && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        AI Coaching
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(displayPrice)}
                  </div>
                  {showEarlyBird && (
                    <div className="text-sm text-gray-400 line-through">
                      {formatPrice(tier.price_cents)}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ──────── Step 3: Quick Info ────────

interface QuickInfo {
  name: string;
  email: string;
  phone: string;
  weight: string;
  goal_weight: string;
}

function StepQuickInfo({
  info,
  setInfo,
  errors,
}: {
  info: QuickInfo;
  setInfo: React.Dispatch<React.SetStateAction<QuickInfo>>;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Quick Info</h2>
        <p className="text-sm text-gray-500 mt-1">
          Just 5 fields — takes about 30 seconds
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          value={info.name}
          onChange={(e) => setInfo((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Jane Smith"
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
            errors.name ? "border-red-400" : "border-gray-300"
          }`}
        />
        {errors.name && (
          <p className="text-xs text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={info.email}
          onChange={(e) =>
            setInfo((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="jane@email.com"
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
            errors.email ? "border-red-400" : "border-gray-300"
          }`}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="tel"
          value={info.phone}
          onChange={(e) =>
            setInfo((prev) => ({ ...prev, phone: e.target.value }))
          }
          placeholder="(555) 123-4567"
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
            errors.phone ? "border-red-400" : "border-gray-300"
          }`}
        />
        {errors.phone && (
          <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Weight (lbs)
          </label>
          <input
            type="number"
            value={info.weight}
            onChange={(e) =>
              setInfo((prev) => ({ ...prev, weight: e.target.value }))
            }
            placeholder="172"
            min={50}
            max={600}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
              errors.weight ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.weight && (
            <p className="text-xs text-red-500 mt-1">{errors.weight}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Goal Weight (lbs)
          </label>
          <input
            type="number"
            value={info.goal_weight}
            onChange={(e) =>
              setInfo((prev) => ({ ...prev, goal_weight: e.target.value }))
            }
            placeholder="155"
            min={50}
            max={600}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${
              errors.goal_weight ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.goal_weight && (
            <p className="text-xs text-red-500 mt-1">{errors.goal_weight}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────── Step 4: Starting Photos ────────

/*
 * NOTE: The Supabase Storage bucket "progress-photos" must be created manually
 * in the Supabase Dashboard under Storage. Set it as a public bucket or configure
 * appropriate RLS policies for anon uploads. The bucket should allow uploads from
 * unauthenticated users for the signup flow.
 *
 * Path convention: {participant_id}/starting/{front|side|back}.jpg
 */

type PhotoAngle = "front" | "side" | "back";

function StepPhotos({
  photos,
  setPhotos,
}: {
  photos: Record<PhotoAngle, File | null>;
  setPhotos: React.Dispatch<React.SetStateAction<Record<PhotoAngle, File | null>>>;
}) {
  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
  };

  const angles: { key: PhotoAngle; label: string }[] = [
    { key: "front", label: "Front" },
    { key: "side", label: "Side" },
    { key: "back", label: "Back" },
  ];

  function handleFileChange(angle: PhotoAngle, file: File | null) {
    setPhotos((prev) => ({ ...prev, [angle]: file }));
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Starting Photos</h2>
        <p className="text-sm text-gray-500 mt-1">
          Optional but recommended for tracking progress
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {angles.map(({ key, label }) => {
          const file = photos[key];
          const previewUrl = file ? URL.createObjectURL(file) : null;

          return (
            <div key={key} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => fileInputRefs[key].current?.click()}
                className={`w-full aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                  file
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-red-300 bg-gray-50"
                }`}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={`${label} photo`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <svg
                      className="w-8 h-8 text-gray-400 mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-xs text-gray-400">Tap to add</span>
                  </>
                )}
              </button>
              <span className="text-xs font-medium text-gray-600 mt-1.5">
                {label}
              </span>
              <input
                ref={fileInputRefs[key]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(key, e.target.files?.[0] ?? null)
                }
              />
              {file && (
                <button
                  type="button"
                  onClick={() => handleFileChange(key, null)}
                  className="text-xs text-red-500 mt-0.5"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────── Step 5: Payment / Confirmation ────────

function StepConfirmation({
  dashboardUrl,
  participantName,
}: {
  dashboardUrl: string;
  participantName: string;
}) {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        You&apos;re In, {participantName.split(" ")[0]}!
      </h2>
      <p className="text-gray-500 mb-6">
        Your spot is confirmed. Access your personal dashboard below to view
        your plan and start checking in.
      </p>

      <a
        href={dashboardUrl}
        className="inline-block px-8 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
      >
        Go to My Dashboard
      </a>

      <p className="text-xs text-gray-400 mt-4">
        Bookmark this link — it&apos;s your personal access to the challenge.
      </p>
    </div>
  );
}

// ──────── Progress Bar ────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= step ? "bg-red-500" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ──────── Main Form ────────

const STEP_LABELS = [
  "Track",
  "Tier",
  "Info",
  "Photos",
  "Confirm",
];

export default function SignupForm({
  challenge,
  tracks,
  tiers,
}: {
  challenge: ChallengeData;
  tracks: TrackData[];
  tiers: TierData[];
}) {
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Step 2
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  // Step 3
  const [quickInfo, setQuickInfo] = useState<QuickInfo>({
    name: "",
    email: "",
    phone: "",
    weight: "",
    goal_weight: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 4
  const [photos, setPhotos] = useState<Record<PhotoAngle, File | null>>({
    front: null,
    side: null,
    back: null,
  });

  // Step 5
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);

  const earlyBird = isEarlyBird(challenge.early_bird_ends);

  function validateQuickInfo(): boolean {
    const errs: Record<string, string> = {};
    if (!quickInfo.name.trim()) errs.name = "Name is required";
    if (!quickInfo.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickInfo.email))
      errs.email = "Enter a valid email";
    if (!quickInfo.phone.trim()) errs.phone = "Phone is required";
    if (!quickInfo.weight) errs.weight = "Required";
    else if (Number(quickInfo.weight) < 50 || Number(quickInfo.weight) > 600)
      errs.weight = "Enter a valid weight";
    if (!quickInfo.goal_weight) errs.goal_weight = "Required";
    else if (
      Number(quickInfo.goal_weight) < 50 ||
      Number(quickInfo.goal_weight) > 600
    )
      errs.goal_weight = "Enter a valid weight";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return selectedTrackId !== null;
      case 1:
        return selectedTierId !== null;
      case 2:
        return true; // validated on click
      case 3:
        return true; // photos are optional
      default:
        return false;
    }
  }

  async function handleNext() {
    setError(null);

    if (step === 2) {
      if (!validateQuickInfo()) return;
    }

    if (step === 3) {
      // Submit everything
      await handleSubmit();
      return;
    }

    setStep((s) => s + 1);
  }

  async function uploadPhotos(
    participantId: string
  ): Promise<Record<string, string>> {
    const urls: Record<string, string> = {};
    const angles: PhotoAngle[] = ["front", "side", "back"];

    for (const angle of angles) {
      const file = photos[angle];
      if (!file) continue;

      const path = `${participantId}/starting/${angle}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("progress-photos").getPublicUrl(path);
        urls[angle] = publicUrl;
      }
      // If upload fails, silently skip — photos are optional
    }

    return urls;
  }

  async function handleSubmit() {
    if (!selectedTrackId || !selectedTierId) return;

    setSubmitting(true);
    setError(null);

    try {
      // TODO: Integrate Stripe Checkout here.
      // When Stripe keys are available, create a Checkout Session before inserting
      // the participant. The participant record should be created in the Stripe
      // webhook handler (checkout.session.completed) to ensure payment succeeded.
      // For now, we create the participant directly as a placeholder for the
      // payment flow.

      // 1. Insert participant
      const { data: participant, error: insertError } = await supabase
        .from("participants")
        .insert({
          challenge_id: challenge.id,
          track_id: selectedTrackId,
          tier_id: selectedTierId,
          name: quickInfo.name.trim(),
          email: quickInfo.email.trim().toLowerCase(),
          phone: quickInfo.phone.trim(),
          intake_pre: {
            weight: Number(quickInfo.weight),
            goal_weight: Number(quickInfo.goal_weight),
          },
          starting_photos: null, // Will update after upload
        })
        .select("id, magic_link_token")
        .single();

      if (insertError || !participant) {
        const msg = insertError?.message || "Failed to create account";
        if (msg.includes("idx_participants_email_challenge")) {
          setError(
            "This email is already registered for this challenge. Check your email for your dashboard link."
          );
        } else {
          setError(msg);
        }
        setSubmitting(false);
        return;
      }

      // 2. Upload photos if any
      const hasPhotos = photos.front || photos.side || photos.back;
      if (hasPhotos) {
        const photoUrls = await uploadPhotos(participant.id);
        if (Object.keys(photoUrls).length > 0) {
          await supabase
            .from("participants")
            .update({ starting_photos: photoUrls })
            .eq("id", participant.id);
        }
      }

      // 3. Show confirmation with dashboard link
      setDashboardUrl(`/dashboard/${participant.magic_link_token}`);
      setStep(4);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ──────── Render ────────

  // Confirmation step (after submit)
  if (step === 4 && dashboardUrl) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <ProgressBar step={4} total={5} />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <StepConfirmation
            dashboardUrl={dashboardUrl}
            participantName={quickInfo.name}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        {challenge.gym.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={challenge.gym.logo_url}
            alt={challenge.gym.name}
            className="h-10 mx-auto mb-3"
          />
        )}
        <h1 className="text-2xl font-bold text-gray-900">{challenge.name}</h1>
        {challenge.description && (
          <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          by {challenge.gym.name}
        </p>
      </div>

      {/* Progress */}
      <ProgressBar step={step} total={5} />

      {/* Step label */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Step {step + 1} of {STEP_LABELS.length} &mdash; {STEP_LABELS[step]}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {step === 0 && (
          <StepTrackSelection
            tracks={tracks}
            selectedTrackId={selectedTrackId}
            onSelect={setSelectedTrackId}
          />
        )}
        {step === 1 && (
          <StepTierSelection
            tiers={tiers}
            selectedTierId={selectedTierId}
            earlyBird={earlyBird}
            onSelect={setSelectedTierId}
          />
        )}
        {step === 2 && (
          <StepQuickInfo
            info={quickInfo}
            setInfo={setQuickInfo}
            errors={fieldErrors}
          />
        )}
        {step === 3 && <StepPhotos photos={photos} setPhotos={setPhotos} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep((s) => Math.max(0, s - 1));
          }}
          disabled={step === 0}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>

        <div className="flex gap-3">
          {step === 3 && (
            <button
              type="button"
              onClick={() => {
                // Skip photos
                setPhotos({ front: null, side: null, back: null });
                handleSubmit();
              }}
              disabled={submitting}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Skip for now
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance() || submitting}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
          >
            {submitting
              ? "Signing up..."
              : step === 3
              ? "Complete Signup"
              : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
