"use client";

import { useState, useTransition } from "react";
import { submitCheckin } from "./actions";

interface CheckinFormProps {
  token: string;
  participantId: string;
  lastWeight: number | null;
  proteinTarget: string | null;
  isElite: boolean;
  trackName: string;
}

type ThreeWay = "yes" | "no" | "close" | null;
type TrainedWay = "yes" | "no" | "rest_day" | null;

export default function CheckinForm({
  token,
  participantId,
  lastWeight,
  proteinTarget,
  isElite,
  trackName,
}: CheckinFormProps) {
  const [weight, setWeight] = useState<string>("");
  const [proteinHit, setProteinHit] = useState<ThreeWay>(null);
  const [trained, setTrained] = useState<TrainedWay>(null);
  const [steps, setSteps] = useState<string>("");
  const [recoveryScore, setRecoveryScore] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitCheckin({
        token,
        participantId,
        weight: weight ? parseFloat(weight) : null,
        proteinHit,
        trained,
        steps: steps ? parseInt(steps, 10) : null,
        recoveryScore,
        notes,
      });
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const recoveryColors = [
    "bg-red-500",
    "bg-red-400",
    "bg-orange-500",
    "bg-orange-400",
    "bg-yellow-500",
    "bg-yellow-400",
    "bg-lime-400",
    "bg-green-400",
    "bg-green-500",
    "bg-emerald-500",
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Weight (lbs)
        </label>
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={lastWeight ? `Last: ${lastWeight} lbs` : "Enter weight"}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
        />
      </div>

      {/* Protein Target Hit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Protein target hit?
          {proteinTarget && (
            <span className="text-gray-400 font-normal ml-1">
              (target: {proteinTarget})
            </span>
          )}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "yes", label: "Yes", activeColor: "bg-green-500 text-white" },
              { value: "no", label: "No", activeColor: "bg-red-500 text-white" },
              { value: "close", label: "Close", activeColor: "bg-yellow-500 text-white" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setProteinHit(opt.value)}
              className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                proteinHit === opt.value
                  ? opt.activeColor
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trained Today */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trained today?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "yes", label: "Yes", activeColor: "bg-green-500 text-white" },
              { value: "no", label: "No", activeColor: "bg-red-500 text-white" },
              { value: "rest_day", label: "Rest Day", activeColor: "bg-blue-500 text-white" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTrained(opt.value)}
              className={`py-3 rounded-xl text-sm font-semibold transition-colors ${
                trained === opt.value
                  ? opt.activeColor
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Steps
          {trackName.toLowerCase().includes("last 10") && (
            <span className="text-gray-400 font-normal ml-1">
              (10K target)
            </span>
          )}
        </label>
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="e.g. 8500"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
          {steps && parseInt(steps) >= 10000 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xl">
              &#10003;
            </span>
          )}
        </div>
      </div>

      {/* Recovery Score */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recovery score
        </label>
        <div className="flex gap-1.5 justify-between">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRecoveryScore(n)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                recoveryScore === n
                  ? `${recoveryColors[n - 1]} text-white ring-2 ring-offset-1 ring-gray-400 scale-110`
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
          <span>Poor</span>
          <span>Great</span>
        </div>
      </div>

      {/* Meal Photo - Elite only */}
      {isElite && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meal photo
          </label>
          <p className="text-xs text-gray-400 mb-2">
            AI feedback within 60 seconds
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 text-sm">
            Photo upload coming soon
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="How are you feeling? Any wins today?"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
      >
        {isPending ? "Submitting..." : "Submit Check-In"}
      </button>
    </div>
  );
}
