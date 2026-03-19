"use client";

import { useState, useEffect } from "react";

interface Activity {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Props {
  participantId: string;
  tierName: string;
  challengeStartDate: string;
  challengeEndDate: string;
  hasNutritionPlan: boolean;
  hasTrainingPlan: boolean;
  hasMealPlan: boolean;
  hasWorkoutMod: boolean;
  hasWeeklyAnalysis: boolean;
  hasMidprogram: boolean;
  hasMurphPrep: boolean;
  hasMotivation: boolean;
  hasSupplements: boolean;
  hasPostProgram: boolean;
  hasMealSubstitution: boolean;
  intakeComplete: boolean;
  totalCheckins: number;
}

interface ChecklistItem {
  key: string;
  label: string;
  category: "onboarding" | "plans" | "coaching" | "endgame";
  tiers: string[];
  done: boolean;
  doneAt?: string;
  dueDate?: string; // when this should be done by
  description: string;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dueDate: string | undefined): boolean {
  if (!dueDate) return false;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return dueDate < today;
}

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

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  onboarding: { label: "Onboarding", color: "text-green-700 bg-green-50" },
  plans: { label: "AI Plans", color: "text-purple-700 bg-purple-50" },
  coaching: { label: "Coaching", color: "text-blue-700 bg-blue-50" },
  endgame: { label: "End of Challenge", color: "text-orange-700 bg-orange-50" },
};

export default function ActivityTimeline({
  participantId,
  tierName,
  hasNutritionPlan,
  hasTrainingPlan,
  hasMealPlan,
  hasWorkoutMod,
  hasWeeklyAnalysis,
  hasMidprogram,
  hasMurphPrep,
  hasMotivation,
  hasSupplements,
  hasPostProgram,
  hasMealSubstitution,
  intakeComplete,
  totalCheckins,
  challengeStartDate,
  challengeEndDate,
}: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);

  const tn = tierName.toLowerCase();
  const isAccelOrElite = tn.includes("accelerator") || tn.includes("elite");
  const isElite = tn.includes("elite");

  useEffect(() => {
    fetch(`/api/admin/participants/${participantId}/activity`)
      .then((res) => res.json())
      .then((data) => setActivities(data.activities ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [participantId]);

  // Build activity lookup for timestamps
  const activityMap = new Map<string, string>();
  activities.forEach((a) => {
    if (!activityMap.has(a.type)) activityMap.set(a.type, a.created_at);
  });

  // Calculate key dates from challenge
  const week1 = challengeStartDate;
  const week2 = addDays(challengeStartDate, 7);
  const week4 = addDays(challengeStartDate, 21);
  const week5 = addDays(challengeStartDate, 28);
  const week6 = addDays(challengeStartDate, 35);
  const preStart = addDays(challengeStartDate, -3);
  const postEnd = addDays(challengeEndDate, 3);

  // Build checklist
  const allItems: ChecklistItem[] = [
    // Onboarding
    { key: "signup", label: "Participant Signed Up", category: "onboarding", tiers: ["all"], done: true, doneAt: activityMap.get("signup"), description: "Registration complete" },
    { key: "welcome_email", label: "Welcome Email Sent", category: "onboarding", tiers: ["all"], done: !!activityMap.get("email_welcome"), doneAt: activityMap.get("email_welcome"), dueDate: preStart, description: "Dashboard link + getting started info" },
    { key: "intake", label: "Intake Form Completed", category: "onboarding", tiers: ["all"], done: intakeComplete, dueDate: preStart, description: "Weight, age, sex, height + goals" },
    { key: "first_checkin", label: "First Check-in Submitted", category: "onboarding", tiers: ["all"], done: totalCheckins > 0, dueDate: addDays(challengeStartDate, 1), description: "Participant has started checking in" },

    // AI Plans
    { key: "nutrition_plan", label: "Nutrition Plan Generated", category: "plans", tiers: ["all"], done: hasNutritionPlan, doneAt: activityMap.get("ai_plan_generated"), dueDate: week1, description: "Macros, meal timing, calorie targets" },
    { key: "training_plan", label: "Training Plan Generated", category: "plans", tiers: ["all"], done: hasTrainingPlan, doneAt: activityMap.get("ai_plan_generated"), dueDate: week1, description: "Weekly programming + Murph prep" },
    { key: "workout_mod", label: "Workout Modifications", category: "plans", tiers: ["accelerator", "elite"], done: hasWorkoutMod, doneAt: activityMap.get("ai_workout_mod"), dueDate: week1, description: "Scaling, injury mods, progressions" },
    { key: "meal_plan", label: "Custom 7-Day Meal Plan", category: "plans", tiers: ["elite"], done: hasMealPlan, doneAt: activityMap.get("ai_meal_plan"), dueDate: week1, description: "Full weekly meal plan with grocery list" },
    { key: "supplements", label: "Supplement Recommendations", category: "plans", tiers: ["accelerator", "elite"], done: hasSupplements, doneAt: activityMap.get("ai_supplements"), dueDate: week2, description: "Evidence-based supplement stack" },

    // Coaching
    { key: "weekly_analysis", label: "Weekly Analysis (first)", category: "coaching", tiers: ["accelerator", "elite"], done: hasWeeklyAnalysis, doneAt: activityMap.get("ai_weekly_analysis"), dueDate: addDays(week2, 0), description: "Monday performance review + next week focus" },
    { key: "motivation", label: "Motivation Message Sent", category: "coaching", tiers: ["accelerator", "elite"], done: hasMotivation, doneAt: activityMap.get("ai_motivation"), dueDate: week5, description: "Personalized message when energy dips" },
    { key: "meal_sub", label: "Meal Substitution Provided", category: "coaching", tiers: ["accelerator", "elite"], done: hasMealSubstitution, doneAt: activityMap.get("ai_meal_substitution"), description: "As needed — quick swap alternatives" },

    // End of challenge
    { key: "midprogram", label: "Mid-Program Adjustment", category: "endgame", tiers: ["accelerator", "elite"], done: hasMidprogram, doneAt: activityMap.get("ai_midprogram"), dueDate: week4, description: "Week 4 — macro recalibration + training changes" },
    { key: "murph_prep", label: "Murph Prep Strategy", category: "endgame", tiers: ["all"], done: hasMurphPrep, doneAt: activityMap.get("ai_murph_prep"), dueDate: week6, description: "Weeks 5-6 — partition strategy + prep plan" },
    { key: "post_program", label: "Post-Program Transition Plan", category: "endgame", tiers: ["all"], done: hasPostProgram, doneAt: activityMap.get("ai_post_program"), dueDate: postEnd, description: "After Murph — reverse diet + maintenance plan" },
  ];

  // Filter to items relevant for this participant's tier
  const items = allItems.filter((item) => {
    if (item.tiers.includes("all")) return true;
    if (item.tiers.includes("elite") && isElite) return true;
    if (item.tiers.includes("accelerator") && isAccelOrElite) return true;
    return false;
  });

  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  // Group by category
  const categories = ["onboarding", "plans", "coaching", "endgame"];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Coaching Checklist</h2>
            <p className="text-xs text-gray-500 mt-0.5">{tierName} — {doneCount}/{totalCount} completed</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold ${pct === 100 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}>
              {pct}%
            </span>
            <button
              onClick={() => setShowLog(!showLog)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showLog ? "Hide Log" : "Activity Log"}
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="divide-y divide-gray-50">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          if (catItems.length === 0) return null;
          const catConfig = CATEGORY_LABELS[cat];
          const catDone = catItems.filter((i) => i.done).length;

          return (
            <div key={cat}>
              <div className="px-6 py-2.5 bg-gray-50 flex items-center justify-between">
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${catConfig.color}`}>
                  {catConfig.label}
                </span>
                <span className="text-[10px] text-gray-400">{catDone}/{catItems.length}</span>
              </div>
              {catItems.map((item) => {
                const overdue = !item.done && isOverdue(item.dueDate);
                return (
                  <div key={item.key} className={`px-6 py-3 flex items-start gap-3 ${overdue ? "bg-red-50/50" : item.done ? "" : "bg-yellow-50/30"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.done ? "bg-green-500 text-white" : overdue ? "border-2 border-red-400 bg-red-100" : "border-2 border-gray-300"
                    }`}>
                      {item.done && <span className="text-[10px]">&#10003;</span>}
                      {overdue && <span className="text-[10px] text-red-500">!</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm ${item.done ? "text-gray-500" : overdue ? "text-red-700 font-medium" : "text-gray-900 font-medium"}`}>
                          {item.label}
                        </span>
                        {item.done && item.doneAt && (
                          <span className="text-[10px] text-green-600">Done {timeAgo(item.doneAt)}</span>
                        )}
                        {!item.done && overdue && (
                          <span className="text-[10px] text-red-600 font-semibold">Overdue</span>
                        )}
                        {!item.done && !overdue && (
                          <span className="text-[10px] text-yellow-600 font-medium">Pending</span>
                        )}
                        {item.dueDate && (
                          <span className={`text-[10px] ${item.done ? "text-gray-300" : overdue ? "text-red-400" : "text-gray-400"}`}>
                            {item.done ? "" : "Due "}{formatShortDate(item.dueDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Raw Activity Log (collapsible) */}
      {showLog && (
        <div className="border-t border-gray-200">
          <div className="px-6 py-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Activity Log ({activities.length} events)</p>
          </div>
          {loading ? (
            <div className="px-6 py-4 text-sm text-gray-400">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="px-6 py-4 text-sm text-gray-400">No events logged yet. Run the backfill or wait for new actions.</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {activities.map((a) => (
                <div key={a.id} className="px-6 py-2 flex items-center gap-3 text-xs border-b border-gray-50">
                  <span className="text-gray-400 w-20 flex-shrink-0">{timeAgo(a.created_at)}</span>
                  <span className="text-gray-500 w-28 flex-shrink-0 truncate">{a.type}</span>
                  <span className="text-gray-700 truncate">{a.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
