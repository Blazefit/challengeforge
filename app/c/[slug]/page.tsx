"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

interface Track {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  calorie_strategy: string;
  training_days: string;
}

interface Tier {
  id: string;
  name: string;
  price_cents: number;
  earlybird_price_cents: number | null;
  features: string[];
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  early_bird_ends: string | null;
}

const STEPS = ["Track", "Tier", "Info", "Done"];

export default function PublicSignup() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");

  const [magicLink, setMagicLink] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: ch } = await supabase
        .from("challenges")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (!ch) {
        setError("Challenge not found.");
        setLoading(false);
        return;
      }
      setChallenge(ch);

      const { data: tr } = await supabase
        .from("tracks")
        .select("*")
        .eq("challenge_id", ch.id)
        .order("sort_order");
      setTracks(tr || []);

      const { data: ti } = await supabase
        .from("tiers")
        .select("*")
        .eq("challenge_id", ch.id)
        .order("sort_order");
      setTiers(ti || []);

      setLoading(false);
    }
    load();
  }, [slug, supabase]);

  async function handleSubmit() {
    if (!challenge || !selectedTrack || !selectedTier || !name || !email) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challenge.id,
          track_id: selectedTrack.id,
          tier_id: selectedTier.id,
          name,
          email,
          phone,
          weight,
          goal_weight: goalWeight,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        setSubmitting(false);
        return;
      }

      setMagicLink(`${window.location.origin}/dashboard/${data.magic_link_token}`);
      setStep(3);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-red-400">{error || "Challenge not found."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-red-900 to-red-700 px-6 py-8 text-center">
        <h1 className="text-3xl font-bold">{challenge.name}</h1>
        <p className="text-red-200 mt-2">{challenge.description}</p>
        <p className="text-red-300 text-sm mt-2">
          {challenge.start_date} to {challenge.end_date}
        </p>
      </div>

      <div className="flex justify-center gap-2 py-4 bg-gray-900 border-b border-gray-800">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              i === step ? "bg-red-600 text-white" : i < step ? "bg-red-900 text-red-300" : "bg-gray-800 text-gray-500"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {error && step < 3 && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
          <div className="bg-red-900/50 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Choose Your Track</h2>
            <div className="space-y-4">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => { setSelectedTrack(track); setStep(1); }}
                  className="w-full text-left p-5 rounded-xl border-2 border-gray-700 bg-gray-900 hover:border-gray-500 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{track.icon}</span>
                    <h3 className="text-lg font-bold" style={{ color: track.color }}>{track.name}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{track.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>{track.calorie_strategy}</span>
                    <span>{track.training_days}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Choose Your Tier</h2>
            <div className="space-y-4">
              {tiers.map((tier, i) => (
                <button
                  key={tier.id}
                  onClick={() => { setSelectedTier(tier); setStep(2); }}
                  className={`w-full text-left p-5 rounded-xl border-2 border-gray-700 bg-gray-900 hover:border-gray-500 transition-all ${i === 1 ? "ring-1 ring-red-500/30" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">{tier.name}</h3>
                    <span className="text-2xl font-bold text-red-400">${tier.price_cents / 100}</span>
                  </div>
                  {tier.earlybird_price_cents && (
                    <p className="text-green-400 text-xs mb-2">Early bird: ${tier.earlybird_price_cents / 100}</p>
                  )}
                  <ul className="space-y-1">
                    {(tier.features as string[]).map((f, fi) => (
                      <li key={fi} className="text-gray-400 text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#10003;</span>{f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(0)} className="mt-4 text-gray-500 text-sm hover:text-gray-300">&larr; Back to tracks</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Your Information</h2>
            <p className="text-gray-400 text-sm mb-6">
              <span style={{ color: selectedTrack?.color }}>{selectedTrack?.icon} {selectedTrack?.name}</span>{" / "}
              <span className="text-red-400">{selectedTier?.name}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(239) 555-0123" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Weight (lbs)</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="175" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Goal Weight (lbs)</label>
                  <input type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} placeholder="165" className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-800">Back</button>
              <button onClick={handleSubmit} disabled={submitting || !name || !email} className="flex-1 px-5 py-2.5 bg-red-600 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {submitting ? "Signing up..." : "Claim My Spot"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">&#127881;</div>
            <h2 className="text-2xl font-bold mb-2">You&apos;re In!</h2>
            <p className="text-gray-400 mb-6">Welcome to {challenge.name}, <span style={{ color: selectedTrack?.color }}>{selectedTrack?.name}</span> track.</p>
            <div className="bg-gray-800 rounded-xl p-6 text-left mb-6">
              <h3 className="font-semibold mb-2">Your Personal Dashboard</h3>
              <p className="text-gray-400 text-sm mb-3">Bookmark this link for check-ins, plans, and the leaderboard:</p>
              {magicLink && <a href={magicLink} className="text-red-400 hover:text-red-300 underline break-all text-sm">{magicLink}</a>}
            </div>
            <div className="bg-gray-900 rounded-xl p-4 text-sm text-gray-500 space-y-1">
              <p><strong className="text-gray-300">Track:</strong> {selectedTrack?.icon} {selectedTrack?.name}</p>
              <p><strong className="text-gray-300">Tier:</strong> {selectedTier?.name} (${(selectedTier?.price_cents || 0) / 100})</p>
              <p><strong className="text-gray-300">Starts:</strong> {challenge.start_date}</p>
            </div>
            {magicLink && <a href={magicLink} className="inline-block mt-6 px-8 py-3 bg-red-600 rounded-lg font-medium hover:bg-red-700 transition-colors">Go to My Dashboard</a>}
          </div>
        )}
      </div>
    </div>
  );
}
