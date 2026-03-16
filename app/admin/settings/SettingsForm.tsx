"use client";

import { useState } from "react";

interface Gym {
  id: string;
  email: string;
  name: string;
  logo_url: string | null;
  brand_color: string | null;
  timezone: string | null;
  stripe_account_id: string | null;
  created_at: string;
}

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (America/New_York)" },
  { value: "America/Chicago", label: "Central (America/Chicago)" },
  { value: "America/Denver", label: "Mountain (America/Denver)" },
  { value: "America/Los_Angeles", label: "Pacific (America/Los_Angeles)" },
  { value: "America/Phoenix", label: "Arizona (America/Phoenix)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Pacific/Honolulu)" },
];

export default function SettingsForm({ gym }: { gym: Gym }) {
  const [name, setName] = useState(gym.name || "");
  const [brandColor, setBrandColor] = useState(gym.brand_color || "#dc2626");
  const [timezone, setTimezone] = useState(gym.timezone || "America/New_York");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brand_color: brandColor, timezone }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      setMessage({ type: "success", text: "Settings saved successfully." });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Gym Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Gym Profile</h2>
        </div>
        <div className="px-6 py-6 space-y-5">
          {/* Gym Name */}
          <div>
            <label htmlFor="gym-name" className="block text-sm font-medium text-gray-700 mb-1">
              Gym Name
            </label>
            <input
              id="gym-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
              required
            />
          </div>

          {/* Brand Color */}
          <div>
            <label htmlFor="brand-color" className="block text-sm font-medium text-gray-700 mb-1">
              Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="brand-color"
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500 font-mono">{brandColor}</span>
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Email (read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              id="email"
              type="email"
              value={gym.email}
              readOnly
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-500 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Email is tied to your account and cannot be changed here.
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`px-4 py-3 rounded-lg text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Stripe Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Stripe Integration</h2>
        </div>
        <div className="px-6 py-6">
          {gym.stripe_account_id ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Connected
              </span>
              <span className="text-sm text-gray-600">
                Account: {gym.stripe_account_id}
              </span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  Not Connected
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Stripe integration coming soon. You&apos;ll be able to collect payments for your challenges.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Subscription</h2>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              ChallengeForge MVP
            </span>
          </div>
          <p className="text-sm text-gray-500">
            You&apos;re on the free MVP tier during beta. All features are available at no cost.
          </p>
        </div>
      </div>
    </div>
  );
}
