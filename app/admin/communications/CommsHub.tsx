"use client";

import { useState, useMemo } from "react";

interface Track {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Tier {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  status: string;
  track_id: string | null;
  tier_id: string | null;
  tracks: { name: string } | null;
  tiers: { name: string } | null;
}

interface CommsHubProps {
  challengeName: string;
  tracks: Track[];
  tiers: Tier[];
  participants: Participant[];
}

// -------------------------------------------------------------------
// Welcome email templates keyed by track slug => tier slug
// -------------------------------------------------------------------

const TRACK_LABELS = ["Hard Gainer", "Last 10", "Transformer"] as const;
const TIER_LABELS = ["The Plan", "The Accelerator", "The Elite"] as const;

type TrackLabel = (typeof TRACK_LABELS)[number];
type TierLabel = (typeof TIER_LABELS)[number];

interface EmailTemplate {
  subject: string;
  body: string;
}

function getWelcomeEmail(track: TrackLabel, tier: TierLabel): EmailTemplate {
  const trackContent: Record<
    TrackLabel,
    { focus: string; nutrition: string; training: string }
  > = {
    "Hard Gainer": {
      focus: "building lean muscle and healthy weight gain",
      nutrition:
        "Your nutrition plan focuses on caloric surplus with clean, whole-food sources. Expect structured meal timing around your training sessions to maximize muscle protein synthesis.",
      training:
        "Your training program emphasizes progressive overload with compound lifts. We will track your strength gains weekly alongside body composition changes.",
    },
    "Last 10": {
      focus: "shedding those final stubborn pounds",
      nutrition:
        "Your nutrition plan is precision-calibrated for a moderate deficit. We will dial in your macros to preserve muscle while targeting fat loss in those stubborn areas.",
      training:
        "Your training blends high-intensity intervals with strategic strength work. The programming is designed to boost your metabolism and keep your body burning long after the workout ends.",
    },
    Transformer: {
      focus: "a complete body composition transformation",
      nutrition:
        "Your nutrition plan is a comprehensive overhaul designed for sustainable change. We start with foundational habits and progressively build toward optimized macros as your body adapts.",
      training:
        "Your training program ramps progressively over 8 weeks. We start with movement quality and build toward high-intensity work as your fitness base grows.",
    },
  };

  const tierContent: Record<
    TierLabel,
    { features: string; support: string }
  > = {
    "The Plan": {
      features:
        "daily check-ins, access to the group leaderboard, and your personalized nutrition guide",
      support:
        "You will have access to the community dashboard where you can track your progress and see how you stack up.",
    },
    "The Accelerator": {
      features:
        "everything in The Plan plus weekly 1-on-1 coaching check-ins, custom macro adjustments, and priority support",
      support:
        "Your dedicated coach will review your check-ins weekly and make real-time adjustments to keep you on track. Expect a personal coaching message every Monday.",
    },
    "The Elite": {
      features:
        "the full VIP experience: daily coaching feedback, custom meal plans, personalized training modifications, and direct text access to your coach",
      support:
        "You are getting the white-glove treatment. Your coach reviews every single check-in and you can reach out anytime. We will also schedule bi-weekly video calls to deep-dive your progress.",
    },
  };

  const t = trackContent[track];
  const r = tierContent[tier];

  return {
    subject: `Welcome to Summer Slim Down 2026, {name}! Your ${track} journey starts now`,
    body: `Hi {name},

Welcome to the Summer Slim Down 2026 challenge! You are signed up for the ${track} track on the ${tier} tier, and we could not be more excited to have you.

YOUR FOCUS
Your journey is all about ${t.focus}. Over the next 8 weeks, every workout, every meal, and every check-in is designed to move you closer to your goal.

NUTRITION
${t.nutrition}

TRAINING
${t.training}

YOUR ${tier.toUpperCase()} TIER INCLUDES
As a ${tier} member, you get ${r.features}.

${r.support}

GETTING STARTED
1. Complete your intake form if you have not already
2. Log your first check-in (weight + photo) before April 1
3. Review your dashboard at your personal link: {dashboard_link}

The challenge officially kicks off April 1. Use the next few days to settle into your routine and get familiar with the dashboard.

Let us make these 8 weeks count.

- The CrossFit Blaze Team`,
  };
}

// -------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------

export default function CommsHub({
  tracks,
  tiers,
  participants,
}: CommsHubProps) {
  const [activeTab, setActiveTab] = useState<
    "welcome" | "broadcast" | "history"
  >("welcome");

  const tabs = [
    { key: "welcome" as const, label: "Welcome Emails" },
    { key: "broadcast" as const, label: "Broadcast Composer" },
    { key: "history" as const, label: "Message History" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "welcome" && <WelcomeEmails />}
      {activeTab === "broadcast" && (
        <BroadcastComposer
          tracks={tracks}
          tiers={tiers}
          participants={participants}
        />
      )}
      {activeTab === "history" && <MessageHistory />}
    </div>
  );
}

// -------------------------------------------------------------------
// Section 1: Welcome Emails
// -------------------------------------------------------------------

function WelcomeEmails() {
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">
          Welcome Email Templates
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Pre-generated welcome emails for each Track and Tier combination.
          Click a cell to preview.
        </p>
      </div>

      <div className="p-6">
        {/* Header row */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div />
          {TIER_LABELS.map((tier) => (
            <div
              key={tier}
              className="text-center text-sm font-semibold text-gray-700"
            >
              {tier}
            </div>
          ))}
        </div>

        {/* Matrix rows */}
        {TRACK_LABELS.map((track) => (
          <div key={track} className="mb-3">
            <div className="grid grid-cols-4 gap-3">
              <div className="flex items-center text-sm font-semibold text-gray-700 pr-2">
                {track}
              </div>
              {TIER_LABELS.map((tier) => {
                const cellKey = `${track}::${tier}`;
                const isExpanded = expandedCell === cellKey;
                return (
                  <button
                    key={cellKey}
                    onClick={() =>
                      setExpandedCell(isExpanded ? null : cellKey)
                    }
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      isExpanded
                        ? "border-red-300 bg-red-50 ring-2 ring-red-200"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium text-gray-800 truncate">
                      {track} + {tier}
                    </div>
                    <div className="text-gray-500 mt-0.5">
                      {isExpanded ? "Click to collapse" : "Click to preview"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Expanded preview */}
            {TIER_LABELS.map((tier) => {
              const cellKey = `${track}::${tier}`;
              if (expandedCell !== cellKey) return null;
              const email = getWelcomeEmail(track, tier);
              return (
                <div
                  key={`preview-${cellKey}`}
                  className="mt-3 p-5 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Subject
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {email.subject}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Body
                    </span>
                    <pre className="text-sm text-gray-700 mt-1 whitespace-pre-wrap font-sans leading-relaxed">
                      {email.body}
                    </pre>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-200">
                      Placeholders: {"{name}"}, {"{dashboard_link}"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Section 2: Broadcast Composer
// -------------------------------------------------------------------

function BroadcastComposer({
  tracks,
  tiers,
  participants,
}: {
  tracks: Track[];
  tiers: Tier[];
  participants: Participant[];
}) {
  const [audienceMode, setAudienceMode] = useState<
    "all" | "track" | "tier"
  >("all");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedTierId, setSelectedTierId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const recipients = useMemo(() => {
    if (audienceMode === "track" && selectedTrackId) {
      return participants.filter((p) => p.track_id === selectedTrackId);
    }
    if (audienceMode === "tier" && selectedTierId) {
      return participants.filter((p) => p.tier_id === selectedTierId);
    }
    return participants;
  }, [audienceMode, selectedTrackId, selectedTierId, participants]);

  const audienceLabel = useMemo(() => {
    if (audienceMode === "track" && selectedTrackId) {
      const t = tracks.find((tr) => tr.id === selectedTrackId);
      return t ? `${t.name} track` : "Selected track";
    }
    if (audienceMode === "tier" && selectedTierId) {
      const t = tiers.find((ti) => ti.id === selectedTierId);
      return t ? `${t.name} tier` : "Selected tier";
    }
    return "All participants";
  }, [audienceMode, selectedTrackId, selectedTierId, tracks, tiers]);

  function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setToast("Please fill in both subject and message body.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setToast(
      `Messages queued for delivery to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`
    );
    setTimeout(() => setToast(null), 4000);
    setShowPreview(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Broadcast Composer</h2>
        <p className="text-sm text-gray-500 mt-1">
          Send a message to challenge participants.
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Audience selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audience
          </label>
          <div className="flex gap-2 mb-3">
            {(
              [
                { key: "all", label: "All Participants" },
                { key: "track", label: "By Track" },
                { key: "tier", label: "By Tier" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAudienceMode(opt.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  audienceMode === opt.key
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {audienceMode === "track" && (
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a track...</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon ? `${t.icon} ` : ""}
                  {t.name}
                </option>
              ))}
            </select>
          )}

          {audienceMode === "tier" && (
            <select
              value={selectedTierId}
              onChange={(e) => setSelectedTierId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a tier...</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <div className="mt-2 text-sm text-gray-500">
            {audienceLabel} &middot;{" "}
            <span className="font-medium text-gray-700">
              {recipients.length}
            </span>{" "}
            recipient{recipients.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Line
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Week 3 Update: Keep the momentum going!"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here. Use {name} to personalize..."
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">
            Available placeholders: {"{name}"}, {"{track}"}, {"{tier}"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={!subject.trim() && !body.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
          <button
            onClick={handleSend}
            disabled={recipients.length === 0}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send to {recipients.length} Recipient
            {recipients.length !== 1 ? "s" : ""}
          </button>
        </div>

        {/* Preview panel */}
        {showPreview && (subject.trim() || body.trim()) && (
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Message Preview
            </h3>
            <div className="mb-2">
              <span className="text-xs text-gray-500">To:</span>{" "}
              <span className="text-sm text-gray-700">{audienceLabel}</span>
            </div>
            <div className="mb-3">
              <span className="text-xs text-gray-500">Subject:</span>{" "}
              <span className="text-sm font-medium text-gray-900">
                {subject || "(no subject)"}
              </span>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {body || "(no message body)"}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// Section 3: Message History
// -------------------------------------------------------------------

function MessageHistory() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Message History</h2>
        <p className="text-sm text-gray-500 mt-1">
          Past broadcasts and automated messages.
        </p>
      </div>

      {/* Table structure for future use */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 font-medium">
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Subject</th>
              <th className="px-6 py-3">Audience</th>
              <th className="px-6 py-3">Recipients</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={5}
                className="px-6 py-16 text-center text-gray-400"
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-10 h-10 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z"
                    />
                  </svg>
                  <span>No broadcasts sent yet</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
