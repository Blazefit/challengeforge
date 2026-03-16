"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface QuickCheckinProps {
  participants: { id: string; name: string }[];
}

export default function QuickCheckin({ participants }: QuickCheckinProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [weight, setWeight] = useState("");
  const [proteinHit, setProteinHit] = useState<string | null>(null);
  const [trained, setTrained] = useState<string | null>(null);
  const [recoveryScore, setRecoveryScore] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedName = participants.find((p) => p.id === selectedId)?.name ?? "";

  function resetForm() {
    setSelectedId("");
    setSearch("");
    setWeight("");
    setProteinHit(null);
    setTrained(null);
    setRecoveryScore("");
    setNotes("");
  }

  async function handleSubmit() {
    if (!selectedId) {
      setFeedback({ type: "error", message: "Please select a participant." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: selectedId,
          weight: weight || null,
          protein_hit: proteinHit,
          trained,
          recovery_score: recoveryScore || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Something went wrong." });
      } else {
        const verb = data.updated ? "Updated" : "Submitted";
        setFeedback({ type: "success", message: `${verb} check-in for ${selectedName}.` });
        resetForm();
        router.refresh();
      }
    } catch {
      setFeedback({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function ToggleButtons({
    options,
    value,
    onChange,
  }: {
    options: { key: string; label: string; activeClass: string }[];
    value: string | null;
    onChange: (v: string | null) => void;
  }) {
    return (
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(value === opt.key ? null : opt.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              value === opt.key
                ? opt.activeClass
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Quick Check-in
      </button>

      {open && (
        <div className="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Participant selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participant
              </label>
              <input
                type="text"
                placeholder="Search participant..."
                value={selectedId ? selectedName : search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedId("");
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
              {dropdownOpen && !selectedId && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">No match</div>
                  ) : (
                    filtered.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(p.id);
                          setSearch("");
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
                      >
                        {p.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (lbs)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 185.2"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            {/* Recovery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recovery (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                placeholder="e.g. 7"
                value={recoveryScore}
                onChange={(e) => setRecoveryScore(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            {/* Protein */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hit Protein?
              </label>
              <ToggleButtons
                options={[
                  { key: "yes", label: "Yes", activeClass: "bg-green-100 border-green-300 text-green-700" },
                  { key: "close", label: "Close", activeClass: "bg-yellow-100 border-yellow-300 text-yellow-700" },
                  { key: "no", label: "No", activeClass: "bg-red-100 border-red-300 text-red-700" },
                ]}
                value={proteinHit}
                onChange={setProteinHit}
              />
            </div>

            {/* Trained */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trained?
              </label>
              <ToggleButtons
                options={[
                  { key: "yes", label: "Yes", activeClass: "bg-green-100 border-green-300 text-green-700" },
                  { key: "rest_day", label: "Rest Day", activeClass: "bg-yellow-100 border-yellow-300 text-yellow-700" },
                  { key: "no", label: "No", activeClass: "bg-red-100 border-red-300 text-red-700" },
                ]}
                value={trained}
                onChange={setTrained}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
          </div>

          {/* Submit + Feedback */}
          <div className="mt-5 flex items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedId}
              className="bg-red-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Check-in"}
            </button>

            {feedback && (
              <p
                className={`text-sm font-medium ${
                  feedback.type === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {feedback.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
