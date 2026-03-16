import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ParticipantTable from "./ParticipantTable";

export default async function Participants() {
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
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Participants</h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-400 mb-4">
            No challenge found. Create a challenge first to manage participants.
          </p>
          <Link
            href="/admin/challenges/new"
            className="inline-block bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Create Challenge
          </Link>
        </div>
      </div>
    );
  }

  const challengeId = challenge.id;
  const challengeStart = new Date(challenge.start_date);

  // Fetch all participants with track/tier joins
  const { data: participants } = await supabase
    .from("participants")
    .select("*, tracks(name, icon, color), tiers(name)")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: false });

  if (!participants || participants.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Participants</h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-400">No participants have signed up yet.</p>
        </div>
      </div>
    );
  }

  const participantIds = participants.map((p) => p.id);

  // Fetch all checkins for those participants
  const { data: checkins } = await supabase
    .from("checkins")
    .select("participant_id, date, weight")
    .in("participant_id", participantIds);

  const allCheckins = checkins ?? [];

  // Compute enriched data
  const now = new Date();
  const daysSinceStart = Math.max(
    1,
    Math.ceil(
      (now.getTime() - challengeStart.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const enriched = participants.map((p) => {
    const pCheckins = allCheckins
      .filter((c) => c.participant_id === p.id)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    const lastCheckin = pCheckins.length
      ? pCheckins[pCheckins.length - 1]
      : null;
    const lastCheckinDate = lastCheckin ? lastCheckin.date : null;
    const latestWeight = lastCheckin?.weight ?? null;

    // First weight: from intake_pre.weight or first checkin with weight
    const intakeWeight =
      p.intake_pre && typeof p.intake_pre === "object"
        ? (p.intake_pre as Record<string, unknown>).weight
        : null;
    const firstCheckinWeight = pCheckins.find((c) => c.weight != null)?.weight;
    const firstWeight =
      intakeWeight != null ? Number(intakeWeight) : firstCheckinWeight ?? null;

    const weightChange =
      latestWeight != null && firstWeight != null
        ? Math.round((latestWeight - firstWeight) * 10) / 10
        : null;

    const consistencyPct =
      pCheckins.length > 0
        ? Math.round((pCheckins.length / daysSinceStart) * 100)
        : 0;

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      status: p.status,
      track_name: p.tracks?.name ?? null,
      track_icon: p.tracks?.icon ?? null,
      track_color: p.tracks?.color ?? null,
      tier_name: p.tiers?.name ?? null,
      last_checkin_date: lastCheckinDate,
      latest_weight: latestWeight,
      first_weight: firstWeight,
      weight_change: weightChange,
      consistency_pct: Math.min(consistencyPct, 100),
      payment_status: (p.payment_status as string) ?? "unpaid",
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Participants</h1>
      <ParticipantTable participants={enriched} />
    </div>
  );
}
