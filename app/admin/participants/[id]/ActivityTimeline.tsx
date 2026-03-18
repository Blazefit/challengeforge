"use client";

import { useState, useEffect } from "react";

interface Activity {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  signup: { icon: "&#128075;", color: "bg-green-500", label: "Signup" },
  checkin: { icon: "&#10003;", color: "bg-blue-500", label: "Check-in" },
  email_welcome: { icon: "&#128231;", color: "bg-green-400", label: "Welcome Email" },
  email_broadcast: { icon: "&#128227;", color: "bg-yellow-500", label: "Broadcast" },
  email_individual: { icon: "&#128172;", color: "bg-yellow-400", label: "Individual Email" },
  ai_plan_generated: { icon: "&#129302;", color: "bg-purple-500", label: "AI Plan" },
  ai_meal_plan: { icon: "&#127869;", color: "bg-purple-400", label: "Meal Plan" },
  ai_workout_mod: { icon: "&#128170;", color: "bg-purple-400", label: "Workout Mods" },
  ai_weekly_analysis: { icon: "&#128200;", color: "bg-purple-400", label: "Weekly Analysis" },
  ai_coaching_response: { icon: "&#128172;", color: "bg-purple-500", label: "AI Coaching" },
  ai_midprogram: { icon: "&#128736;", color: "bg-purple-400", label: "Mid-Program" },
  ai_murph_prep: { icon: "&#127947;", color: "bg-purple-400", label: "Murph Prep" },
  ai_motivation: { icon: "&#128293;", color: "bg-orange-500", label: "Motivation" },
  ai_supplements: { icon: "&#128138;", color: "bg-purple-400", label: "Supplements" },
  ai_post_program: { icon: "&#127937;", color: "bg-purple-400", label: "Post-Program" },
  ai_meal_substitution: { icon: "&#127860;", color: "bg-purple-400", label: "Meal Swap" },
  status_change: { icon: "&#9881;", color: "bg-gray-500", label: "Status Change" },
  payment_change: { icon: "&#128176;", color: "bg-green-500", label: "Payment" },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ActivityTimeline({ participantId }: { participantId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/participants/${participantId}/activity`)
      .then((res) => res.json())
      .then((data) => setActivities(data.activities ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [participantId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Activity Timeline</h2>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Activity Timeline</h2>
        <p className="text-xs text-gray-500 mt-0.5">{activities.length} events logged</p>
      </div>

      {activities.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-400 text-sm">
          No activity logged yet. Events will appear here as emails are sent, plans are generated, and check-ins are submitted.
        </div>
      ) : (
        <div className="px-6 py-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {activities.map((a) => {
                const config = TYPE_CONFIG[a.type] ?? { icon: "&#9679;", color: "bg-gray-400", label: a.type };
                return (
                  <div key={a.id} className="relative flex items-start gap-3 pl-1">
                    {/* Dot */}
                    <div className={`relative z-10 w-6 h-6 rounded-full ${config.color} flex items-center justify-center text-white text-xs flex-shrink-0`}
                      dangerouslySetInnerHTML={{ __html: config.icon }}
                    />
                    {/* Content */}
                    <div className="flex-1 min-w-0 -mt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(a.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">{a.description}</p>
                      {a.metadata && "subject" in a.metadata && a.metadata.subject ? (
                        <p className="text-xs text-gray-400 mt-0.5">Subject: {String(a.metadata.subject)}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
