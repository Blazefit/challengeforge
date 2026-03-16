"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Props {
  token: string;
  lastWeight: number | null;
  showSteps: boolean;
  existing: {
    weight: number | null;
    protein_hit: string | null;
    trained: string | null;
    steps: number | null;
    recovery_score: number | null;
    notes: string | null;
  } | null;
}

export default function CheckinForm({ token, lastWeight, showSteps, existing }: Props) {
  const router = useRouter();
  const params = useParams();
  const dashToken = params.token as string;

  const [weight, setWeight] = useState(existing?.weight?.toString() || "");
  const [proteinHit, setProteinHit] = useState<string>(existing?.protein_hit || "");
  const [trained, setTrained] = useState<string>(existing?.trained || "");
  const [steps, setSteps] = useState(existing?.steps?.toString() || "");
  const [recovery, setRecovery] = useState<number | null>(existing?.recovery_score || null);
  const [notes, setNotes] = useState(existing?.notes || "");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          weight: weight || null,
          protein_hit: proteinHit || null,
          trained: trained || null,
          steps: steps || null,
          recovery_score: recovery,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Check-in failed");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/${dashToken}`), 1500);
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">&#10003;</div>
        <h2 className="text-xl font-bold text-green-400">Check-in Submitted!</h2>
        <p className="text-gray-500 mt-2">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-900/50 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Weight */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Weight (lbs) {lastWeight && <span className="text-gray-600">— last: {lastWeight}</span>}
        </label>
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={lastWeight?.toString() || "175"}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg focus:ring-2 focus:ring-red-500 outline-none"
        />
      </div>

      {/* Protein Hit */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Hit your protein target?</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: "yes", label: "Yes", color: "green" },
            { val: "close", label: "Close", color: "yellow" },
            { val: "no", label: "No", color: "red" },
          ].map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setProteinHit(opt.val)}
              className={`py-3 rounded-xl font-medium text-sm transition-all ${
                proteinHit === opt.val
                  ? opt.color === "green"
                    ? "bg-green-600 text-white"
                    : opt.color === "yellow"
                    ? "bg-yellow-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trained */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Train today?</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: "yes", label: "Yes", color: "green" },
            { val: "rest_day", label: "Rest Day", color: "yellow" },
            { val: "no", label: "No", color: "red" },
          ].map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setTrained(opt.val)}
              className={`py-3 rounded-xl font-medium text-sm transition-all ${
                trained === opt.val
                  ? opt.color === "green"
                    ? "bg-green-600 text-white"
                    : opt.color === "yellow"
                    ? "bg-yellow-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Steps (Last 10 track) */}
      {showSteps && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Steps today</label>
          <input
            type="number"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="10000"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 outline-none"
          />
          {steps && Number(steps) >= 10000 && <p className="text-green-400 text-xs mt-1">&#10003; 10K goal hit!</p>}
        </div>
      )}

      {/* Recovery Score */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Recovery (1-10)</label>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRecovery(n)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                recovery === n
                  ? n <= 3
                    ? "bg-red-600 text-white"
                    : n <= 6
                    ? "bg-yellow-600 text-white"
                    : "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-500 hover:bg-gray-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="How are you feeling? Any wins or struggles today?"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-red-600 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting..." : existing ? "Update Check-in" : "Submit Check-in"}
      </button>
    </form>
  );
}
