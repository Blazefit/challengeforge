import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ParticipantSearch from "./ParticipantSearch";
import ExportButton from "./ExportButton";
import BulkActions from "./BulkActions";
import ContactList from "./ContactList";

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
    .select("id")
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

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: (p.phone as string) ?? null,
      status: p.status,
      track_name: p.tracks?.name ?? null,
      track_icon: p.tracks?.icon ?? null,
      track_color: p.tracks?.color ?? null,
      tier_name: p.tiers?.name ?? null,
      last_checkin_date: lastCheckinDate,
      weight_change: weightChange,
      total_checkins: pCheckins.length,
      payment_status: (p.payment_status as string) ?? "unpaid",
    };
  });

  // Count participants by tier
  const tierCounts: Record<string, number> = {};
  enriched.forEach((p) => {
    const t = p.tier_name ?? "No Tier";
    tierCounts[t] = (tierCounts[t] ?? 0) + 1;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold" style={{ color: "var(--on-surface)" }}>Participants</h1>
        <ExportButton />
      </div>

      {/* Tier Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="ma-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold" style={{ color: "var(--on-surface-variant)" }}>The Plan</h3>
            <span className="font-display text-2xl font-bold" style={{ color: "var(--on-surface)" }}>{tierCounts["The Plan"] ?? 0}</span>
          </div>
          <ul className="space-y-1.5 text-xs" style={{ color: "var(--on-surface-muted)" }}>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--success)" }}>&#10003;</span> AI nutrition + training plan</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--success)" }}>&#10003;</span> Daily check-ins + leaderboard</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--success)" }}>&#10003;</span> Murph prep guide (template)</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--outline)" }}>&#10005;</span> <span style={{ color: "var(--outline)" }}>No coaching feedback</span></li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--outline)" }}>&#10005;</span> <span style={{ color: "var(--outline)" }}>No meal plan or workout mods</span></li>
          </ul>
        </div>

        <div className="p-6" style={{ background: "var(--surface-container-high)", borderRadius: "var(--radius-lg)", borderLeft: "3px solid var(--primary-container)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold" style={{ color: "var(--primary)" }}>The Accelerator</h3>
            <span className="font-display text-2xl font-bold" style={{ color: "var(--primary)" }}>{tierCounts["The Accelerator"] ?? 0}</span>
          </div>
          <ul className="space-y-1.5 text-xs" style={{ color: "var(--on-surface-muted)" }}>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--success)" }}>&#10003;</span> Everything in The Plan</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--primary-container)" }}>&#10003;</span> Weekly AI performance analysis</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--primary-container)" }}>&#10003;</span> Custom workout modifications</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--primary-container)" }}>&#10003;</span> Mid-program macro adjustment</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--primary-container)" }}>&#10003;</span> AI coaching on check-ins</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--primary-container)" }}>&#10003;</span> Meal substitutions + supplements</li>
          </ul>
        </div>

        <div className="p-6" style={{ background: "var(--surface-container-high)", borderRadius: "var(--radius-lg)", borderLeft: "3px solid var(--secondary)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold" style={{ color: "var(--secondary)" }}>The Elite</h3>
            <span className="font-display text-2xl font-bold" style={{ color: "var(--secondary)" }}>{tierCounts["The Elite"] ?? 0}</span>
          </div>
          <ul className="space-y-1.5 text-xs" style={{ color: "var(--on-surface-muted)" }}>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--success)" }}>&#10003;</span> Everything in Accelerator</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--secondary)" }}>&#10003;</span> Custom 7-day meal plan</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--secondary)" }}>&#10003;</span> Daily AI coaching feedback</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--secondary)" }}>&#10003;</span> Meal photo analysis</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--secondary)" }}>&#10003;</span> Supplement recommendations</li>
            <li className="flex items-start gap-1.5"><span style={{ color: "var(--secondary)" }}>&#10003;</span> Post-program transition plan</li>
          </ul>
        </div>
      </div>

      <BulkActions participants={enriched.map((p) => ({ id: p.id, name: p.name }))} />
      <ContactList
        participants={enriched.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          track_name: p.track_name,
          track_color: p.track_color,
          status: p.status,
          payment_status: p.payment_status,
          last_checkin_date: p.last_checkin_date,
        }))}
      />
      <ParticipantSearch participants={enriched} />
    </div>
  );
}
