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

export default function CommsHub({
  challengeName,
  tracks,
  tiers,
  participants,
}: CommsHubProps) {
  const [activeTab, setActiveTab] = useState<"quick-send" | "broadcast" | "welcome">("quick-send");

  const tabs = [
    { key: "quick-send" as const, label: "Send to Participant" },
    { key: "broadcast" as const, label: "Broadcast" },
    { key: "welcome" as const, label: "Welcome Emails" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--surface-container-low)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors`}
            style={activeTab === tab.key
              ? { background: "var(--surface-container-high)", color: "var(--on-surface)" }
              : { color: "var(--on-surface-muted)" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "quick-send" && <QuickSend participants={participants} />}
      {activeTab === "broadcast" && (
        <BroadcastComposer tracks={tracks} tiers={tiers} participants={participants} />
      )}
      {activeTab === "welcome" && <WelcomeEmails participants={participants} challengeName={challengeName} />}
    </div>
  );
}

// ─── Quick Send: Email individual participant ───

function QuickSend({ participants }: { participants: Participant[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const selected = participants.find((p) => p.id === selectedId);

  async function handleSend() {
    if (!selected || !subject.trim() || !body.trim()) return;

    setSending(true);
    setResult(null);

    try {
      const personalizedBody = body
        .replace(/\{name\}/g, selected.name.split(" ")[0])
        .replace(/\{track\}/g, selected.tracks?.name ?? "")
        .replace(/\{tier\}/g, selected.tiers?.name ?? "");

      const res = await fetch("/api/comms/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.replace(/\{name\}/g, selected.name.split(" ")[0]),
          message: personalizedBody,
          recipientEmails: [selected.email],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ type: "success", message: `Sent to ${selected.name}!` });
        setSubject("");
        setBody("");
      } else {
        setResult({ type: "error", message: data.error || "Failed to send" });
      }
    } catch {
      setResult({ type: "error", message: "Network error" });
    }
    setSending(false);
    setTimeout(() => setResult(null), 4000);
  }

  return (
    <div className="rounded-xl" style={{ background: "var(--surface-container-high)" }}>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
        <h2 className="font-display font-semibold text-lg" style={{ color: "var(--on-surface)" }}>Send to Individual</h2>
        <p className="text-sm mt-1" style={{ color: "var(--on-surface-muted)" }}>Send a personal email to a specific participant.</p>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--on-surface-variant)" }}>Participant</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1px solid rgba(70, 69, 84, 0.3)" }}
          >
            <option value="">Select a participant...</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.email} ({p.tracks?.name ?? "No track"})
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "var(--surface-container-low)" }}>
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--on-surface)" }}>{selected.name}</p>
              <p className="text-xs" style={{ color: "var(--on-surface-muted)" }}>{selected.email} &middot; {selected.tracks?.name} &middot; {selected.tiers?.name}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--on-surface-variant)" }}>Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Quick check-in from Coach Jason"
            className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1px solid rgba(70, 69, 84, 0.3)" }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--on-surface-variant)" }}>Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Hey {name}, just checking in on your progress..."
            className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y" style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1px solid rgba(70, 69, 84, 0.3)" }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--on-surface-muted)" }}>Placeholders: {"{name}"}, {"{track}"}, {"{tier}"}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={!selected || !subject.trim() || !body.trim() || sending}
            className="ma-btn-primary px-5 py-2.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
          {result && (
            <span className={`text-sm font-medium ${result.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {result.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Broadcast Composer ───

function BroadcastComposer({
  tracks,
  tiers,
  participants,
}: {
  tracks: Track[];
  tiers: Tier[];
  participants: Participant[];
}) {
  const [audienceMode, setAudienceMode] = useState<"all" | "track" | "tier">("all");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedTierId, setSelectedTierId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const recipients = useMemo(() => {
    if (audienceMode === "track" && selectedTrackId)
      return participants.filter((p) => p.track_id === selectedTrackId);
    if (audienceMode === "tier" && selectedTierId)
      return participants.filter((p) => p.tier_id === selectedTierId);
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

  async function handleSend() {
    if (!subject.trim() || !body.trim() || recipients.length === 0) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/comms/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message: body,
          recipientEmails: recipients.map((r) => r.email),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ type: "success", message: `Sent to ${data.count} recipient${data.count !== 1 ? "s" : ""}!` });
        setSubject("");
        setBody("");
      } else {
        setResult({ type: "error", message: data.error || "Send failed" });
      }
    } catch {
      setResult({ type: "error", message: "Network error" });
    }
    setSending(false);
    setTimeout(() => setResult(null), 5000);
  }

  return (
    <div className="rounded-xl" style={{ background: "var(--surface-container-high)" }}>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
        <h2 className="font-display font-semibold text-lg" style={{ color: "var(--on-surface)" }}>Broadcast Message</h2>
        <p className="text-sm mt-1" style={{ color: "var(--on-surface-muted)" }}>Send an email to multiple participants at once.</p>
      </div>
      <div className="p-6 space-y-5">
        {/* Audience */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--on-surface-variant)" }}>Audience</label>
          <div className="flex gap-2 mb-3">
            {([
              { key: "all" as const, label: "All" },
              { key: "track" as const, label: "By Track" },
              { key: "tier" as const, label: "By Tier" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAudienceMode(opt.key)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={audienceMode === opt.key
                  ? { background: "var(--primary)", color: "var(--on-primary)" }
                  : { background: "var(--surface-container-low)", color: "var(--on-surface-variant)", border: "1px solid rgba(70, 69, 84, 0.3)" }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          {audienceMode === "track" && (
            <select value={selectedTrackId} onChange={(e) => setSelectedTrackId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1px solid rgba(70, 69, 84, 0.3)" }}>
              <option value="">Select a track...</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>{t.icon ? `${t.icon} ` : ""}{t.name}</option>
              ))}
            </select>
          )}

          {audienceMode === "tier" && (
            <select value={selectedTierId} onChange={(e) => setSelectedTierId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1px solid rgba(70, 69, 84, 0.3)" }}>
              <option value="">Select a tier...</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          <p className="mt-2 text-sm" style={{ color: "var(--on-surface-muted)" }}>
            {audienceLabel} &middot; <span className="font-medium" style={{ color: "var(--on-surface-variant)" }}>{recipients.length}</span> recipient{recipients.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--on-surface-variant)" }}>Subject</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Week 3 Update: Keep the momentum going!"
            className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1px solid rgba(70, 69, 84, 0.3)" }} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--on-surface-variant)" }}>Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)}
            rows={8} placeholder="Write your message here..."
            className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y" style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1px solid rgba(70, 69, 84, 0.3)" }} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={recipients.length === 0 || !subject.trim() || !body.trim() || sending}
            className="ma-btn-primary px-5 py-2.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "Sending..." : `Send to ${recipients.length} Recipient${recipients.length !== 1 ? "s" : ""}`}
          </button>
          {result && (
            <span className={`text-sm font-medium ${result.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {result.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Welcome Emails: Resend welcome emails to participants ───

function WelcomeEmails({ participants }: { participants: Participant[]; challengeName: string }) {
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, "sent" | "failed">>({});

  async function resendWelcome(p: Participant) {
    setSendingTo(p.id);
    try {
      // Use the signup API pattern — call the welcome email endpoint directly
      const res = await fetch("/api/comms/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: p.id }),
      });
      if (res.ok) {
        setResults((prev) => ({ ...prev, [p.id]: "sent" }));
      } else {
        setResults((prev) => ({ ...prev, [p.id]: "failed" }));
      }
    } catch {
      setResults((prev) => ({ ...prev, [p.id]: "failed" }));
    }
    setSendingTo(null);
  }

  return (
    <div className="rounded-xl" style={{ background: "var(--surface-container-high)" }}>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
        <h2 className="font-display font-semibold text-lg" style={{ color: "var(--on-surface)" }}>Welcome Emails</h2>
        <p className="text-sm mt-1" style={{ color: "var(--on-surface-muted)" }}>
          Resend welcome emails to participants who may not have received theirs. Each email includes their dashboard link, track/tier info, and getting started steps.
        </p>
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(70, 69, 84, 0.15)" }}>
        {participants.length === 0 ? (
          <div className="px-6 py-12 text-center" style={{ color: "var(--on-surface-muted)" }}>No active participants yet.</div>
        ) : (
          participants.map((p) => (
            <div key={p.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm" style={{ color: "var(--on-surface)" }}>{p.name}</p>
                <p className="text-xs" style={{ color: "var(--on-surface-muted)" }}>{p.email} &middot; {p.tracks?.name ?? "—"} &middot; {p.tiers?.name ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                {results[p.id] === "sent" && (
                  <span className="text-xs text-green-600 font-medium">Sent!</span>
                )}
                {results[p.id] === "failed" && (
                  <span className="text-xs text-red-600 font-medium">Failed</span>
                )}
                <button
                  onClick={() => resendWelcome(p)}
                  disabled={sendingTo === p.id}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
                  style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
                >
                  {sendingTo === p.id ? "Sending..." : "Send Welcome Email"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
