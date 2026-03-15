"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function GymOnboarding() {
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [brandColor, setBrandColor] = useState("#dc2626");
  const [logoPlaceholder, setLogoPlaceholder] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGym, setLoadingGym] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadGym() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signup");
        return;
      }

      const { data: gym } = await supabase
        .from("gyms")
        .select("*")
        .eq("email", user.email!)
        .single();

      if (gym) {
        setName(gym.name || "");
        setTimezone(gym.timezone || "America/New_York");
        setBrandColor(gym.brand_color || "#dc2626");
      }
      setLoadingGym(false);
    }
    loadGym();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("gyms")
      .update({
        name,
        timezone,
        brand_color: brandColor,
        logo_url: logoPlaceholder || null,
      })
      .eq("email", user.email!);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  if (loadingGym) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Set Up Your Gym</h1>
          <p className="text-gray-500 mt-2">Complete your gym profile to get started</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Gym Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="CrossFit Blaze Naples"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="logo"
                  type="text"
                  value={logoPlaceholder}
                  onChange={(e) => setLogoPlaceholder(e.target.value)}
                  placeholder="https://yourgym.com/logo.png"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
                <div
                  className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs"
                >
                  {logoPlaceholder ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPlaceholder} alt="Logo preview" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    "Logo"
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Full upload support coming soon. Paste a URL for now.</p>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700 mb-1">
                Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="brandColor"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono text-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Saving..." : "Save & Continue"}
              </button>
              <a
                href="/admin/onboarding/stripe"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
              >
                Connect Stripe
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
