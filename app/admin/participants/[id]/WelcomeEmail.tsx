"use client";

import { useState } from "react";

interface WelcomeEmailProps {
  participant: {
    name: string;
    email: string;
    magic_link_token: string;
  };
  trackName: string;
  tierName: string;
}

type TrackLabel = "Hard Gainer" | "Last 10" | "Transformer";
type TierLabel = "The Plan" | "The Accelerator" | "The Elite";

function generateEmail(
  name: string,
  track: string,
  tier: string,
  dashboardLink: string
): { subject: string; body: string } {
  const trackContent: Record<
    TrackLabel,
    { focus: string; nutrition: string; training: string }
  > = {
    "Hard Gainer": {
      focus: "building lean muscle and healthy weight gain",
      nutrition:
        "Your nutrition plan focuses on caloric surplus with clean, whole-food sources. Expect structured meal timing around your training sessions to maximize muscle protein synthesis.",
      training:
        "Your training program emphasizes progressive overload with compound lifts. We will track your strength gains weekly alongside body composition changes.",
    },
    "Last 10": {
      focus: "shedding those final stubborn pounds",
      nutrition:
        "Your nutrition plan is precision-calibrated for a moderate deficit. We will dial in your macros to preserve muscle while targeting fat loss in those stubborn areas.",
      training:
        "Your training blends high-intensity intervals with strategic strength work. The programming is designed to boost your metabolism and keep your body burning long after the workout ends.",
    },
    Transformer: {
      focus: "a complete body composition transformation",
      nutrition:
        "Your nutrition plan is a comprehensive overhaul designed for sustainable change. We start with foundational habits and progressively build toward optimized macros as your body adapts.",
      training:
        "Your training program ramps progressively over 8 weeks. We start with movement quality and build toward high-intensity work as your fitness base grows.",
    },
  };

  const tierContent: Record<
    TierLabel,
    { features: string; support: string }
  > = {
    "The Plan": {
      features:
        "daily check-ins, access to the group leaderboard, and your personalized nutrition guide",
      support:
        "You will have access to the community dashboard where you can track your progress and see how you stack up.",
    },
    "The Accelerator": {
      features:
        "everything in The Plan plus weekly 1-on-1 coaching check-ins, custom macro adjustments, and priority support",
      support:
        "Your dedicated coach will review your check-ins weekly and make real-time adjustments to keep you on track. Expect a personal coaching message every Monday.",
    },
    "The Elite": {
      features:
        "the full VIP experience: daily coaching feedback, custom meal plans, personalized training modifications, and direct text access to your coach",
      support:
        "You are getting the white-glove treatment. Your coach reviews every single check-in and you can reach out anytime. We will also schedule bi-weekly video calls to deep-dive your progress.",
    },
  };

  const t = trackContent[track as TrackLabel] ?? trackContent["Transformer"];
  const r = tierContent[tier as TierLabel] ?? tierContent["The Plan"];

  const subject = `Welcome to Summer Slim Down 2026, ${name}! Your ${track} journey starts now`;

  const body = `Hi ${name},

Welcome to the Summer Slim Down 2026 challenge! You are signed up for the ${track} track on the ${tier} tier, and we could not be more excited to have you.

YOUR FOCUS
Your journey is all about ${t.focus}. Over the next 8 weeks, every workout, every meal, and every check-in is designed to move you closer to your goal.

NUTRITION
${t.nutrition}

TRAINING
${t.training}

YOUR ${tier.toUpperCase()} TIER INCLUDES
As a ${tier} member, you get ${r.features}.

${r.support}

GETTING STARTED
1. Complete your intake form if you have not already
2. Log your first check-in (weight + photo) before April 1
3. Review your dashboard at your personal link: ${dashboardLink}

The challenge officially kicks off April 1. Use the next few days to settle into your routine and get familiar with the dashboard.

Let us make these 8 weeks count.

- The CrossFit Blaze Team`;

  return { subject, body };
}

export default function WelcomeEmail({
  participant,
  trackName,
  tierName,
}: WelcomeEmailProps) {
  const [copiedField, setCopiedField] = useState<"subject" | "body" | null>(
    null
  );

  const dashboardLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/${participant.magic_link_token}`
      : `/dashboard/${participant.magic_link_token}`;

  const email = generateEmail(
    participant.name,
    trackName,
    tierName,
    dashboardLink
  );

  async function copyToClipboard(text: string, field: "subject" | "body") {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Welcome Email</h2>
        <p className="text-sm text-gray-500 mt-1">
          Personalized welcome email for {participant.name}. Copy and paste into
          your email client.
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Subject line */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Subject
            </label>
            <button
              onClick={() => copyToClipboard(email.subject, "subject")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copiedField === "subject" ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                "Copy Subject"
              )}
            </button>
          </div>
          <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
            {email.subject}
          </p>
        </div>

        {/* Email body */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Body
            </label>
            <button
              onClick={() => copyToClipboard(email.body, "body")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copiedField === "body" ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                "Copy Email"
              )}
            </button>
          </div>
          <textarea
            readOnly
            value={email.body}
            rows={20}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 font-sans leading-relaxed resize-y focus:outline-none"
          />
        </div>

        {/* Recipient info */}
        <div className="text-xs text-gray-400">
          To: {participant.email}
        </div>
      </div>
    </div>
  );
}
