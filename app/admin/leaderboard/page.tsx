import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeLeaderboard } from "@/lib/scoring";
import LeaderboardView from "./LeaderboardView";
import Link from "next/link";

export default async function AdminLeaderboard() {
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
    .select("id, start_date")
    .eq("gym_id", gym.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challenge) {
    return (
      <div>
        <h1 className="font-display text-4xl font-bold mb-6" style={{ color: "var(--on-surface)" }}>Leaderboard</h1>
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

  // All active participants with tracks
  const { data: participants } = await supabase
    .from("participants")
    .select(
      "id, name, intake_pre, tracks(name, icon, color, scoring_direction)"
    )
    .eq("challenge_id", challengeId)
    .eq("status", "active");

  const activeParticipants = participants ?? [];

  if (activeParticipants.length === 0) {
    return (
      <div>
        <h1 className="font-display text-4xl font-bold mb-6" style={{ color: "var(--on-surface)" }}>Leaderboard</h1>
        <div className="rounded-xl p-12 text-center" style={{ background: "var(--surface-container-high)" }}>
          <p style={{ color: "var(--on-surface-muted)" }}>
            No active participants yet.
          </p>
        </div>
      </div>
    );
  }

  const participantIds = activeParticipants.map((p) => p.id);

  // All checkins for active participants
  const { data: checkins } = await supabase
    .from("checkins")
    .select("participant_id, date, weight, protein_hit, steps")
    .in("participant_id", participantIds);

  const allCheckins = checkins ?? [];

  // Compute leaderboard
  const scored = computeLeaderboard(
    activeParticipants as unknown as Parameters<typeof computeLeaderboard>[0],
    allCheckins,
    challenge.start_date
  );

  return (
    <div>
      <h1 className="font-display text-4xl font-bold mb-6" style={{ color: "var(--on-surface)" }}>Leaderboard</h1>
      <LeaderboardView data={scored} />
    </div>
  );
}
