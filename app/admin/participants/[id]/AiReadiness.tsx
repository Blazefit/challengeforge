"use client";

import { useState } from "react";

interface AiReadinessProps {
  intake: Record<string, unknown> | null;
  tierName: string | null;
}

const CORE_FIELDS: { key: string; label: string; altKey?: string }[] = [
  { key: "weight", label: "Weight" },
  { key: "goal_weight", label: "Goal Weight" },
  { key: "age", label: "Age" },
  { key: "sex", label: "Sex / Gender", altKey: "gender" },
  { key: "height", label: "Height" },
  { key: "activity_level", label: "Activity Level" },
  { key: "training_days_per_week", label: "Training Days / Week" },
  { key: "training_experience", label: "Training Experience" },
  { key: "dietary_restrictions", label: "Dietary Restrictions" },
  { key: "primary_goal", label: "Primary Goal" },
];

const ELITE_FIELDS: { key: string; label: string; altKey?: string }[] = [
  { key: "cooking_skill", label: "Cooking Skill" },
  { key: "meal_prep_available", label: "Meal Prep Available" },
  { key: "foods_they_love", label: "Foods They Love" },
  { key: "foods_they_hate", label: "Foods They Hate" },
];

function hasValue(intake: Record<string, unknown> | null, key: string, altKey?: string): boolean {
  if (!intake) return false;
  const val = intake[key] ?? (altKey ? intake[altKey] : undefined);
  if (val == null) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  return true;
}

export default function AiReadiness({ intake, tierName }: AiReadinessProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const isElite = tierName?.toLowerCase().includes("elite") ?? false;
  const requiredFields = isElite ? [...CORE_FIELDS, ...ELITE_FIELDS] : CORE_FIELDS;

  const completed = requiredFields.filter((f) => hasValue(intake, f.key, f.altKey));
  const missing = requiredFields.filter((f) => !hasValue(intake, f.key, f.altKey));

  const total = requiredFields.length;
  const pct = total === 0 ? 100 : Math.round((completed.length / total) * 100);

  const barColor =
    pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  const badgeColor =
    pct >= 80
      ? "text-green-700 bg-green-50"
      : pct >= 40
      ? "text-yellow-700 bg-yellow-50"
      : "text-red-700 bg-red-50";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">AI Plan Readiness</h2>
        <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
          {pct}% Ready
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Missing fields */}
      {missing.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Missing ({missing.length})
          </p>
          <ul className="space-y-1">
            {missing.map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {f.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Completed fields (collapsed) */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${showCompleted ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Completed ({completed.length})
          </button>
          {showCompleted && (
            <ul className="mt-2 space-y-1">
              {completed.map((f) => (
                <li key={f.key} className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pct === 100 && (
        <p className="mt-3 text-sm text-green-700 font-medium">
          All required fields are present. Ready to generate an AI plan.
        </p>
      )}
    </div>
  );
}
