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
      <form onSubmit={handleSave} className="rounded-xl" style={{ background: "var(--surface-container-high)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
          <h2 className="font-display font-semibold text-lg" style={{ color: "var(--on-surface)" }}>Gym Profile</h2>
        </div>
        <div className="px-6 py-6 space-y-5">
          {/* Gym Name */}
          <div>
            <label htmlFor="gym-name" className="block text-sm font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
              Gym Name
            </label>
            <input
              id="gym-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-colors"
              style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1px solid rgba(70, 69, 84, 0.3)" }}
              required
            />
          </div>

          {/* Brand Color */}
          <div>
            <label htmlFor="brand-color" className="block text-sm font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
              Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="brand-color"
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-10 w-14 rounded cursor-pointer" style={{ border: "1px solid rgba(70, 69, 84, 0.3)" }}
              />
              <span className="text-sm font-mono" style={{ color: "var(--on-surface-muted)" }}>{brandColor}</span>
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-colors"
              style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1px solid rgba(70, 69, 84, 0.3)" }}
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
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: "var(--on-surface-variant)" }}>
              Contact Email
            </label>
            <input
              id="email"
              type="email"
              value={gym.email}
              readOnly
              className="w-full px-4 py-2.5 rounded-lg cursor-not-allowed"
              style={{ background: "var(--surface-container-low)", color: "var(--on-surface-muted)", border: "1px solid rgba(70, 69, 84, 0.15)" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--on-surface-muted)" }}>
              Email is tied to your account and cannot be changed here.
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className="px-4 py-3 rounded-lg text-sm font-medium"
              style={message.type === "success"
                ? { background: "rgba(76, 175, 80, 0.15)", color: "var(--success)" }
                : { background: "rgba(239, 68, 68, 0.15)", color: "var(--tertiary)" }
              }
            >
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="ma-btn-primary px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Stripe Status Card */}
      <div className="rounded-xl" style={{ background: "var(--surface-container-high)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
          <h2 className="font-display font-semibold text-lg" style={{ color: "var(--on-surface)" }}>Stripe Integration</h2>
        </div>
        <div className="px-6 py-6">
          {gym.stripe_account_id ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(76, 175, 80, 0.15)", color: "var(--success)" }}>
                Connected
              </span>
              <span className="text-sm" style={{ color: "var(--on-surface-muted)" }}>
                Account: {gym.stripe_account_id}
              </span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(255, 193, 7, 0.15)", color: "var(--warning)" }}>
                  Not Connected
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--on-surface-muted)" }}>
                Stripe integration coming soon. You&apos;ll be able to collect payments for your challenges.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Card */}
      <div className="rounded-xl" style={{ background: "var(--surface-container-high)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
          <h2 className="font-display font-semibold text-lg" style={{ color: "var(--on-surface)" }}>Subscription</h2>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--tertiary)" }}>
              ChallengeForge MVP
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--on-surface-muted)" }}>
            You&apos;re on the free MVP tier during beta. All features are available at no cost.
          </p>
        </div>
      </div>
    </div>
  );
}
