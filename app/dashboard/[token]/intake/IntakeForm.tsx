"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface IntakeFormProps {
  token: string;
  participantId: string;
  existingIntake: Record<string, unknown> | null;
}

export default function IntakeForm({ token, participantId, existingIntake }: IntakeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Initialize from existing intake or empty
  const v = (key: string): string => String(existingIntake?.[key] ?? "");
  const [form, setForm] = useState({
    weight: v("weight"),
    height: v("height"),
    age: v("age"),
    gender: v("gender"),
    goal_weight: v("goal_weight"),
    body_fat_pct: v("body_fat_pct"),
    training_experience: v("training_experience"),
    training_days_per_week: v("training_days_per_week"),
    current_diet: v("current_diet"),
    dietary_restrictions: v("dietary_restrictions"),
    supplements: v("supplements"),
    meals_per_day: v("meals_per_day"),
    primary_goal: v("primary_goal"),
    motivation: v("motivation"),
    injuries: v("injuries"),
    sleep_hours: v("sleep_hours"),
    stress_level: v("stress_level"),
  });

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Convert numeric fields
    const intake: Record<string, unknown> = { ...form };
    if (form.weight) intake.weight = Number(form.weight);
    if (form.height) intake.height = String(form.height);
    if (form.age) intake.age = Number(form.age);
    if (form.goal_weight) intake.goal_weight = Number(form.goal_weight);
    if (form.body_fat_pct) intake.body_fat_pct = Number(form.body_fat_pct);
    if (form.training_days_per_week) intake.training_days_per_week = Number(form.training_days_per_week);
    if (form.meals_per_day) intake.meals_per_day = Number(form.meals_per_day);
    if (form.sleep_hours) intake.sleep_hours = Number(form.sleep_hours);
    if (form.stress_level) intake.stress_level = Number(form.stress_level);

    try {
      const res = await fetch(`/api/participants/${participantId}/intake`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_pre: intake, token }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setSaved(true);
      setTimeout(() => {
        router.push(`/dashboard/${token}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none";
  const selectClass =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saved && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-center text-green-400 font-medium">
          Intake saved! Redirecting to your dashboard...
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-center text-red-400">
          {error}
        </div>
      )}

      {/* Body Stats */}
      <div className="bg-gray-900 rounded-xl p-5">
        <h2 className="font-bold mb-4">Body Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Current Weight (lbs) *</label>
            <input
              type="number"
              step="0.1"
              required
              value={form.weight}
              onChange={(e) => update("weight", e.target.value)}
              placeholder="185"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Goal Weight (lbs)</label>
            <input
              type="number"
              step="0.1"
              value={form.goal_weight}
              onChange={(e) => update("goal_weight", e.target.value)}
              placeholder="175"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Height</label>
            <input
              type="text"
              value={form.height}
              onChange={(e) => update("height", e.target.value)}
              placeholder="5'10&quot;"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Age</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => update("age", e.target.value)}
              placeholder="32"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select
              value={form.gender as string}
              onChange={(e) => update("gender", e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Body Fat % (est.)</label>
            <input
              type="number"
              step="0.1"
              value={form.body_fat_pct}
              onChange={(e) => update("body_fat_pct", e.target.value)}
              placeholder="20"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Training */}
      <div className="bg-gray-900 rounded-xl p-5">
        <h2 className="font-bold mb-4">Training</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Training Experience</label>
            <select
              value={form.training_experience as string}
              onChange={(e) => update("training_experience", e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="beginner">Beginner (0-1 years)</option>
              <option value="intermediate">Intermediate (1-3 years)</option>
              <option value="advanced">Advanced (3+ years)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Training Days per Week</label>
            <select
              value={form.training_days_per_week as string}
              onChange={(e) => update("training_days_per_week", e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n} days</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Injuries or Limitations</label>
            <textarea
              value={form.injuries as string}
              onChange={(e) => update("injuries", e.target.value)}
              placeholder="Any current injuries, pain points, or movement limitations..."
              rows={2}
              className={inputClass + " resize-y"}
            />
          </div>
        </div>
      </div>

      {/* Nutrition */}
      <div className="bg-gray-900 rounded-xl p-5">
        <h2 className="font-bold mb-4">Nutrition</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Current Diet Style</label>
            <select
              value={form.current_diet as string}
              onChange={(e) => update("current_diet", e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="no_structure">No structure</option>
              <option value="basic_healthy">Eat healthy, no tracking</option>
              <option value="calorie_counting">Calorie counting</option>
              <option value="macro_tracking">Macro tracking</option>
              <option value="keto">Keto</option>
              <option value="paleo">Paleo</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Meals per Day</label>
            <select
              value={form.meals_per_day as string}
              onChange={(e) => update("meals_per_day", e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} meals</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Dietary Restrictions / Allergies</label>
            <input
              type="text"
              value={form.dietary_restrictions as string}
              onChange={(e) => update("dietary_restrictions", e.target.value)}
              placeholder="e.g. dairy-free, gluten-free, nut allergy"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Supplements</label>
            <input
              type="text"
              value={form.supplements as string}
              onChange={(e) => update("supplements", e.target.value)}
              placeholder="e.g. protein, creatine, multivitamin"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Lifestyle & Goals */}
      <div className="bg-gray-900 rounded-xl p-5">
        <h2 className="font-bold mb-4">Lifestyle & Goals</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Primary Goal</label>
            <input
              type="text"
              value={form.primary_goal as string}
              onChange={(e) => update("primary_goal", e.target.value)}
              placeholder="e.g. Lose 15 lbs, get visible abs, build muscle"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>What Motivates You?</label>
            <textarea
              value={form.motivation as string}
              onChange={(e) => update("motivation", e.target.value)}
              placeholder="Why are you doing this challenge? What does success look like?"
              rows={3}
              className={inputClass + " resize-y"}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Avg Sleep (hours)</label>
              <select
                value={form.sleep_hours as string}
                onChange={(e) => update("sleep_hours", e.target.value)}
                className={selectClass}
              >
                <option value="">Select...</option>
                {[4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n} hours</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Stress Level (1-10)</label>
              <select
                value={form.stress_level as string}
                onChange={(e) => update("stress_level", e.target.value)}
                className={selectClass}
              >
                <option value="">Select...</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || saved}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : saved ? "Saved!" : existingIntake ? "Update Intake" : "Submit Intake"}
      </button>
    </form>
  );
}
