"use client";

import { useState } from "react";

interface AiReadinessProps {
  intake: Record<string, unknown> | null;
  tierName: string | null;
  participantName: string;
  participantEmail: string;
  trackName: string | null;
  dashboardToken: string | null;
}

const CORE_FIELDS: { key: string; label: string; altKey?: string; friendlyAsk: string }[] = [
  { key: "weight", label: "Weight", friendlyAsk: "your current weight" },
  { key: "goal_weight", label: "Goal Weight", friendlyAsk: "your goal weight" },
  { key: "age", label: "Age", friendlyAsk: "your age" },
  { key: "sex", label: "Sex / Gender", altKey: "gender", friendlyAsk: "your biological sex (for accurate calorie calculations)" },
  { key: "height", label: "Height", friendlyAsk: "your height" },
  { key: "activity_level", label: "Activity Level", friendlyAsk: "your general activity level (sedentary, lightly active, moderately active, or very active)" },
  { key: "training_days_per_week", label: "Training Days / Week", friendlyAsk: "how many days per week you train" },
  { key: "training_experience", label: "Training Experience", friendlyAsk: "your training experience level (beginner, intermediate, or advanced)" },
  { key: "dietary_restrictions", label: "Dietary Restrictions", friendlyAsk: "any dietary restrictions or food allergies" },
  { key: "primary_goal", label: "Primary Goal", friendlyAsk: "your #1 goal for this challenge" },
];

const ELITE_FIELDS: { key: string; label: string; altKey?: string; friendlyAsk: string }[] = [
  { key: "cooking_skill", label: "Cooking Skill", friendlyAsk: "your cooking skill level (beginner, intermediate, or advanced)" },
  { key: "meal_prep_available", label: "Meal Prep Available", friendlyAsk: "whether you have time/ability to meal prep" },
  { key: "foods_they_love", label: "Foods They Love", friendlyAsk: "foods you love and want included in your meal plan" },
  { key: "foods_they_hate", label: "Foods They Hate", friendlyAsk: "foods you dislike or never want to eat" },
];

function hasValue(intake: Record<string, unknown> | null, key: string, altKey?: string): boolean {
  if (!intake) return false;
  const val = intake[key] ?? (altKey ? intake[altKey] : undefined);
  if (val == null) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  return true;
}

export default function AiReadiness({ intake, tierName, participantName, participantEmail, trackName, dashboardToken }: AiReadinessProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

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

  const firstName = participantName.split(" ")[0];

  // Build the personalized email
  const dashboardUrl = dashboardToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/${dashboardToken}/intake`
    : null;

  const missingList = missing
    .map((f, i) => `${i + 1}. ${f.friendlyAsk}`)
    .join("\n");

  const emailSubject = `Quick favor — ${missing.length} detail${missing.length !== 1 ? "s" : ""} needed for your personalized plan`;

  const emailBody = `Hey ${firstName},

Hope you're fired up for the challenge! We're putting together your personalized ${trackName ? trackName + " " : ""}plan and want to make sure it's dialed in specifically for you.

We're missing a few details that make a big difference in how accurate and personalized your nutrition and training plan will be. Could you take 2 minutes to fill these in?

${missingList}

${dashboardUrl ? `The easiest way is to update your profile here:\n${dashboardUrl}\n\nJust fill in the blanks and hit save — takes less than 2 minutes.` : "Just reply to this email with the info and we'll get it updated for you."}

The more we know, the better we can customize everything — from your calorie targets to your training programming${isElite ? " to your full custom meal plan" : ""}. We want this plan to actually work for YOUR life, not just a generic template.

Thanks ${firstName} — let's get after it!

Coach Jason
CrossFit Blaze`;

  function handleCopy(type: "subject" | "body") {
    const text = type === "subject" ? emailSubject : emailBody;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  }

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

          {/* Request Missing Info button */}
          <button
            onClick={() => setShowEmail((v) => !v)}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {showEmail ? "Hide Email" : "Request Missing Info"}
          </button>
        </div>
      )}

      {/* Generated email */}
      {showEmail && missing.length > 0 && (
        <div className="mt-4 border border-gray-200 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              To: {participantEmail}
            </p>
          </div>

          {/* Send buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <a
              href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(participantEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335"/>
              </svg>
              Send via Gmail
            </a>
            <a
              href={`https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(participantEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#0078D4"/>
              </svg>
              Send via Outlook
            </a>
            <a
              href={`mailto:${participantEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Client
            </a>
          </div>

          {/* Subject */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Subject</label>
              <button
                onClick={() => handleCopy("subject")}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {copied === "subject" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-gray-800 bg-white border border-gray-200 rounded px-3 py-2">
              {emailSubject}
            </p>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Body</label>
              <button
                onClick={() => handleCopy("body")}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {copied === "body" ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              readOnly
              value={emailBody}
              rows={14}
              className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded px-3 py-2 resize-y"
            />
          </div>
        </div>
      )}

      {/* Completed fields (collapsed) */}
      {completed.length > 0 && (
        <div className={missing.length > 0 ? "mt-3" : ""}>
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
