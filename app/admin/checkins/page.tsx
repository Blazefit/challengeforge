import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import GenerateCoachingButton from "./GenerateCoachingButton";
import DateNav from "./DateNav";
import QuickCheckin from "./QuickCheckin";

export default async function CoachCheckins({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signup");
  }

  // Get gym for this user
  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("email", user.email ?? "")
    .single();

  if (!gym) {
    redirect("/admin/onboarding");
  }

  // Get the first challenge for this gym
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id")
    .eq("gym_id", gym.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challenge) {
    return (
      <div>
        <h1 className="font-display text-4xl font-bold" style={{ color: "var(--on-surface)" }}>Check-Ins</h1>
        <div className="rounded-xl p-12 text-center" style={{ background: "var(--surface-container-high)" }}>
          <p className="mb-4" style={{ color: "var(--on-surface-muted)" }}>
            No challenge found. Create a challenge first.
          </p>
          <Link
            href="/admin/challenges/new"
            className="ma-btn-primary inline-block px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Create Challenge
          </Link>
        </div>
      </div>
    );
  }

  const challengeId = challenge.id;

  // All active participants
  const { data: participants } = await supabase
    .from("participants")
    .select("id, name, email, tracks(name, icon, color)")
    .eq("challenge_id", challengeId)
    .eq("status", "active");

  const activeParticipants = participants ?? [];

  // Date from search params or today (Eastern Time)
  const resolvedParams = await searchParams;
  const today = resolvedParams.date || new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const { data: checkins } = await supabase
    .from("checkins")
    .select("*, participants(name, email, tracks(name, icon, color))")
    .eq("date", today)
    .in("participant_id", activeParticipants.map((p) => p.id));

  const todayCheckins = checkins ?? [];
  const checkinIdsWithoutFeedback = todayCheckins
    .filter((c) => !c.ai_feedback)
    .map((c) => c.id);

  // Compute missing participants
  const checkedInIds = new Set(todayCheckins.map((c) => c.participant_id));
  const missingParticipants = activeParticipants.filter(
    (p) => !checkedInIds.has(p.id)
  );

  const checkedInCount = checkedInIds.size;
  const missingCount = missingParticipants.length;
  const totalActive = activeParticipants.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl font-bold" style={{ color: "var(--on-surface)" }}>Check-Ins</h1>
        <DateNav currentDate={today} />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl p-5 text-center" style={{ background: "var(--surface-container-high)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--on-surface-muted)" }}>Checked In</p>
          <p className="text-3xl font-bold" style={{ color: "var(--success)" }}>{checkedInCount}</p>
        </div>
        <div className="rounded-xl p-5 text-center" style={{ background: "var(--surface-container-high)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--on-surface-muted)" }}>Missing</p>
          <p className="text-3xl font-bold" style={{ color: "var(--tertiary)" }}>{missingCount}</p>
        </div>
        <div className="rounded-xl p-5 text-center" style={{ background: "var(--surface-container-high)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--on-surface-muted)" }}>Total Active</p>
          <p className="text-3xl font-bold" style={{ color: "var(--on-surface)" }}>{totalActive}</p>
        </div>
      </div>

      {/* Quick Check-in */}
      <QuickCheckin participants={missingParticipants.map(p => ({ id: p.id, name: p.name }))} />

      {/* Today's Check-ins */}
      <div className="rounded-xl mb-8" style={{ background: "var(--surface-container-high)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
          <h2 className="font-display font-semibold text-lg" style={{ color: "var(--on-surface)" }}>
            Today&apos;s Check-ins
          </h2>
          <GenerateCoachingButton checkinIds={checkinIdsWithoutFeedback} />
        </div>

        {todayCheckins.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p style={{ color: "var(--on-surface-muted)" }}>No check-ins submitted today yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)", color: "var(--on-surface-muted)" }}>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Track</th>
                  <th className="px-6 py-3 font-medium">Weight</th>
                  <th className="px-6 py-3 font-medium">Protein</th>
                  <th className="px-6 py-3 font-medium">Trained</th>
                  <th className="px-6 py-3 font-medium">Steps</th>
                  <th className="px-6 py-3 font-medium">Recovery</th>
                  <th className="px-6 py-3 font-medium">Notes</th>
                  <th className="px-6 py-3 font-medium">AI Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(70, 69, 84, 0.08)" }}>
                {todayCheckins.map((c) => {
                  const p = c.participants as {
                    name: string;
                    email: string;
                    tracks: { name: string; icon: string; color: string } | null;
                  } | null;
                  const track = p?.tracks;

                  return (
                    <tr key={c.id} className="transition-colors" style={{ cursor: "default" }}>
                      <td className="px-6 py-3 font-medium" style={{ color: "var(--on-surface)" }}>
                        {p?.name ?? "Unknown"}
                      </td>
                      <td className="px-6 py-3">
                        {track ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${track.color}20`,
                              color: track.color,
                            }}
                          >
                            {track.icon} {track.name}
                          </span>
                        ) : (
                          <span style={{ color: "var(--on-surface-muted)" }}>--</span>
                        )}
                      </td>
                      <td className="px-6 py-3" style={{ color: "var(--on-surface-variant)" }}>
                        {c.weight != null ? `${c.weight} lbs` : "--"}
                      </td>
                      <td className="px-6 py-3">
                        <ProteinBadge value={c.protein_hit} />
                      </td>
                      <td className="px-6 py-3">
                        <TrainedBadge value={c.trained} />
                      </td>
                      <td className="px-6 py-3" style={{ color: "var(--on-surface-variant)" }}>
                        {c.steps != null
                          ? c.steps.toLocaleString()
                          : "--"}
                      </td>
                      <td className="px-6 py-3">
                        <RecoveryBadge value={c.recovery_score} />
                      </td>
                      <td className="px-6 py-3 max-w-[200px] truncate" style={{ color: "var(--on-surface-muted)" }}>
                        {c.notes || "--"}
                      </td>
                      <td className="px-6 py-3">
                        {c.ai_feedback ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(76, 175, 80, 0.15)", color: "var(--success)" }}>
                            ✓ Sent
                          </span>
                        ) : (
                          <span style={{ color: "var(--on-surface-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Missing Today */}
      <div className="rounded-xl" style={{ background: "var(--surface-container-high)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
          <h2 className="font-display font-semibold text-lg" style={{ color: "var(--on-surface)" }}>Missing Today</h2>
        </div>

        {missingParticipants.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="font-medium" style={{ color: "var(--success)" }}>
              Everyone has checked in today!
            </p>
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-3">
              {missingParticipants.map((p) => {
                const track = (Array.isArray(p.tracks) ? p.tracks[0] : p.tracks) as {
                  name: string;
                  icon: string;
                  color: string;
                } | null;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{ background: "var(--surface-container-low)" }}
                  >
                    <span className="text-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>
                      {p.name}
                    </span>
                    {track && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${track.color}20`,
                          color: track.color,
                        }}
                      >
                        {track.icon} {track.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProteinBadge({ value }: { value: string | null }) {
  if (!value) return <span style={{ color: "var(--on-surface-muted)" }}>--</span>;
  const config: Record<string, { label: string; style: React.CSSProperties }> = {
    yes: { label: "Yes", style: { background: "rgba(76, 175, 80, 0.15)", color: "var(--success)" } },
    close: { label: "Close", style: { background: "rgba(255, 193, 7, 0.15)", color: "var(--warning)" } },
    no: { label: "No", style: { background: "rgba(239, 68, 68, 0.15)", color: "var(--tertiary)" } },
  };
  const c = config[value] ?? { label: value, style: { background: "rgba(70, 69, 84, 0.15)", color: "var(--on-surface-muted)" } };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={c.style}>
      {c.label}
    </span>
  );
}

function TrainedBadge({ value }: { value: string | null }) {
  if (!value) return <span style={{ color: "var(--on-surface-muted)" }}>--</span>;
  const config: Record<string, { label: string; style: React.CSSProperties }> = {
    yes: { label: "Yes", style: { background: "rgba(76, 175, 80, 0.15)", color: "var(--success)" } },
    rest_day: { label: "Rest Day", style: { background: "rgba(255, 193, 7, 0.15)", color: "var(--warning)" } },
    no: { label: "No", style: { background: "rgba(239, 68, 68, 0.15)", color: "var(--tertiary)" } },
  };
  const c = config[value] ?? { label: value, style: { background: "rgba(70, 69, 84, 0.15)", color: "var(--on-surface-muted)" } };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={c.style}>
      {c.label}
    </span>
  );
}

function RecoveryBadge({ value }: { value: number | null }) {
  if (value == null) return <span style={{ color: "var(--on-surface-muted)" }}>--</span>;
  let badgeStyle: React.CSSProperties = { background: "rgba(239, 68, 68, 0.15)", color: "var(--tertiary)" };
  if (value >= 7) badgeStyle = { background: "rgba(76, 175, 80, 0.15)", color: "var(--success)" };
  else if (value >= 4) badgeStyle = { background: "rgba(255, 193, 7, 0.15)", color: "var(--warning)" };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={badgeStyle}>
      {value}/10
    </span>
  );
}
