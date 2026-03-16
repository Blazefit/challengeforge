"use client";

import { useState } from "react";

interface ParticipantInfo {
  id: string;
  name: string;
  email: string;
  track_id: string;
  tier_id: string;
  status: string;
}

interface Checkin {
  id: string;
  participant_id: string;
  date: string;
  weight: number | null;
  protein_hit: string | null;
  trained: string | null;
  steps: number | null;
  recovery_score: number | null;
  meal_photo_url: string | null;
  ai_feedback: string | null;
  coach_note: string | null;
  notes: string | null;
  created_at: string;
}

interface Track {
  id: string;
  name: string;
  color: string;
}

interface Tier {
  id: string;
  name: string;
}

export default function CheckinsView({
  participants,
  todayCheckins,
  missingParticipants,
  tracks,
  tiers,
  atRiskIds,
  today,
}: {
  participants: ParticipantInfo[];
  todayCheckins: Checkin[];
  missingParticipants: ParticipantInfo[];
  tracks: Track[];
  tiers: Tier[];
  atRiskIds: string[];
  today: string;
}) {
  const [tab, setTab] = useState<"submitted" | "missing">("submitted");

  const trackMap: Record<string, Track> = {};
  for (const t of tracks) trackMap[t.id] = t;

  const tierMap: Record<string, Tier> = {};
  for (const t of tiers) tierMap[t.id] = t;

  const participantMap: Record<string, ParticipantInfo> = {};
  for (const p of participants) participantMap[p.id] = p;

  const atRiskSet = new Set(atRiskIds);

  const submitted = todayCheckins.length;
  const missing = missingParticipants.length;
  const atRisk = atRiskIds.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Check-Ins</h1>
        <p className="text-gray-500 text-sm mt-1">
          {today} &middot; Daily overview
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{submitted}</div>
          <div className="text-sm text-green-600">Submitted</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{missing}</div>
          <div className="text-sm text-amber-600">Missing</div>
        </div>
        <div
          className={`border rounded-xl p-4 text-center ${
            atRisk > 0
              ? "bg-red-50 border-red-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div
            className={`text-2xl font-bold ${
              atRisk > 0 ? "text-red-700" : "text-gray-500"
            }`}
          >
            {atRisk}
          </div>
          <div
            className={`text-sm ${
              atRisk > 0 ? "text-red-600" : "text-gray-500"
            }`}
          >
            At-Risk
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setTab("submitted")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "submitted"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Submitted ({submitted})
        </button>
        <button
          onClick={() => setTab("missing")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "missing"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Missing ({missing})
        </button>
      </div>

      {/* Content */}
      {tab === "submitted" ? (
        <div className="space-y-4">
          {todayCheckins.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-12 text-center">
              <p className="text-gray-400">
                No check-ins submitted yet today.
              </p>
            </div>
          ) : (
            todayCheckins.map((checkin) => {
              const participant = participantMap[checkin.participant_id];
              const track = participant
                ? trackMap[participant.track_id]
                : undefined;

              return (
                <CheckinCard
                  key={checkin.id}
                  checkin={checkin}
                  participantName={participant?.name ?? "Unknown"}
                  track={track}
                />
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {missingParticipants.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-12 text-center">
              <p className="text-green-600 font-medium">
                Everyone has checked in today!
              </p>
            </div>
          ) : (
            missingParticipants.map((p) => {
              const track = trackMap[p.track_id];
              const isAtRisk = atRiskSet.has(p.id);

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl border shadow-sm px-5 py-4 flex items-center justify-between ${
                    isAtRisk ? "border-red-200" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {p.name}
                        </span>
                        {track && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor: track.color || "#6b7280",
                            }}
                          >
                            {track.name}
                          </span>
                        )}
                        {isAtRisk && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            At-Risk
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{p.email}</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-red-600 hover:text-red-700 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                    Send Reminder
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function CheckinCard({
  checkin,
  participantName,
  track,
}: {
  checkin: Checkin;
  participantName: string;
  track: Track | undefined;
}) {
  const [coachNote, setCoachNote] = useState(checkin.coach_note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/checkins/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkin_id: checkin.id, coach_note: coachNote }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // Silently fail for now
    } finally {
      setSaving(false);
    }
  };

  const proteinLabel =
    checkin.protein_hit === "yes"
      ? "Hit"
      : checkin.protein_hit === "close"
      ? "Close"
      : checkin.protein_hit === "no"
      ? "Missed"
      : "-";

  const trainedLabel =
    checkin.trained === "yes"
      ? "Yes"
      : checkin.trained === "rest_day"
      ? "Rest Day"
      : checkin.trained === "no"
      ? "No"
      : "-";

  const time = new Date(checkin.created_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{participantName}</span>
          {track && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: track.color || "#6b7280" }}
            >
              {track.name}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{time}</span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <MetricPill label="Weight" value={checkin.weight != null ? `${checkin.weight} lbs` : "-"} />
        <MetricPill
          label="Protein"
          value={proteinLabel}
          color={
            checkin.protein_hit === "yes"
              ? "text-green-700"
              : checkin.protein_hit === "no"
              ? "text-red-600"
              : undefined
          }
        />
        <MetricPill
          label="Trained"
          value={trainedLabel}
          color={
            checkin.trained === "yes"
              ? "text-green-700"
              : checkin.trained === "no"
              ? "text-red-600"
              : undefined
          }
        />
        <MetricPill
          label="Recovery"
          value={
            checkin.recovery_score != null
              ? `${checkin.recovery_score}/10`
              : "-"
          }
        />
        <MetricPill
          label="Steps"
          value={
            checkin.steps != null ? checkin.steps.toLocaleString() : "-"
          }
        />
      </div>

      {checkin.notes && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
          <span className="text-xs font-medium text-gray-500 uppercase block mb-1">
            Participant Notes
          </span>
          {checkin.notes}
        </div>
      )}

      {/* Coach Note */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
          Coach Note
        </label>
        <div className="flex gap-2">
          <textarea
            value={coachNote}
            onChange={(e) => setCoachNote(e.target.value)}
            placeholder="Add a coach note..."
            rows={2}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
          <button
            onClick={handleSaveNote}
            disabled={saving}
            className="self-end px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {saving ? "..." : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className={`text-sm font-semibold ${color ?? "text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}
