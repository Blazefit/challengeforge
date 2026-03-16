import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BulkGeneratePlans from "./BulkGeneratePlans";

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signup");

  const { data: challenge, error } = await supabase
    .from("challenges")
    .select("*, tracks(*), tiers(*)")
    .eq("id", id)
    .single();

  if (error || !challenge) redirect("/admin/dashboard");

  const { data: participants } = await supabase
    .from("participants")
    .select("*, tracks(name, icon, color), tiers(name)")
    .eq("challenge_id", id);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  const { data: todayCheckins } = await supabase
    .from("checkins")
    .select("participant_id")
    .eq("date", today);

  // Fetch ALL checkins for this challenge's participants to compute at-risk
  const participantIds = (participants ?? []).map((p) => p.id);
  const { data: allCheckins } = participantIds.length > 0
    ? await supabase
        .from("checkins")
        .select("participant_id, date")
        .in("participant_id", participantIds)
    : { data: [] };

  // Build a map of participant_id -> latest checkin date
  const latestCheckinMap = new Map<string, string>();
  for (const ci of allCheckins ?? []) {
    const existing = latestCheckinMap.get(ci.participant_id);
    if (!existing || ci.date > existing) {
      latestCheckinMap.set(ci.participant_id, ci.date);
    }
  }

  // At-risk: latest checkin is 2+ days ago or no checkins at all
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  const atRiskParticipants = (participants ?? []).filter((p) => {
    const latest = latestCheckinMap.get(p.id);
    return !latest || latest <= twoDaysAgoStr;
  });

  const checkedInTodayCount = new Set((todayCheckins ?? []).map((c) => c.participant_id)).size;
  const totalEnrolled = (participants ?? []).length;
  const tracks = challenge.tracks ?? [];
  const tiers = challenge.tiers ?? [];

  // Compute spots remaining per track
  const trackSpots = tracks.map((t: { id: string; name: string; icon: string; capacity: number | null }) => {
    const enrolled = (participants ?? []).filter((p) => p.track_id === t.id).length;
    return { name: t.name, icon: t.icon, capacity: t.capacity, enrolled };
  });

  // Enrollment matrix: track x tier counts
  const enrollmentMatrix: Record<string, Record<string, number>> = {};
  for (const t of tracks) {
    enrollmentMatrix[t.id] = {};
    for (const tier of tiers) {
      enrollmentMatrix[t.id][tier.id] = 0;
    }
  }
  for (const p of participants ?? []) {
    if (p.track_id && p.tier_id && enrollmentMatrix[p.track_id]) {
      enrollmentMatrix[p.track_id][p.tier_id] = (enrollmentMatrix[p.track_id][p.tier_id] || 0) + 1;
    }
  }

  const statusColor =
    challenge.status === "active"
      ? "bg-green-100 text-green-700"
      : challenge.status === "completed"
      ? "bg-gray-100 text-gray-600"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{challenge.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {challenge.status}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            {challenge.start_date} to {challenge.end_date}
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Total Enrolled</p>
          <p className="text-3xl font-bold text-gray-900">{totalEnrolled}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Checked In Today</p>
          <p className="text-3xl font-bold text-gray-900">{checkedInTodayCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">At Risk</p>
          <p className="text-3xl font-bold text-red-600">{atRiskParticipants.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Spots by Track</p>
          <div className="space-y-1 mt-1">
            {trackSpots.map((t: { name: string; icon: string; enrolled: number; capacity: number | null }) => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{t.icon} {t.name}</span>
                <span className="text-gray-500">
                  {t.capacity ? `${t.enrolled}/${t.capacity}` : t.enrolled}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk AI Plan Generation */}
      <BulkGeneratePlans
        participants={(participants ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          has_plan: !!p.ai_nutrition_plan,
        }))}
      />

      {/* Enrollment Matrix */}
      {tracks.length > 0 && tiers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Enrollment Matrix</h2>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Track</th>
                  {tiers.map((tier: { id: string; name: string }) => (
                    <th key={tier.id} className="text-center py-2 px-3 text-gray-500 font-medium">
                      {tier.name}
                    </th>
                  ))}
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tracks.map((track: { id: string; name: string; icon: string }) => {
                  const rowTotal = tiers.reduce(
                    (sum: number, tier: { id: string }) => sum + (enrollmentMatrix[track.id]?.[tier.id] ?? 0),
                    0
                  );
                  return (
                    <tr key={track.id}>
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {track.icon} {track.name}
                      </td>
                      {tiers.map((tier: { id: string }) => (
                        <td key={tier.id} className="text-center py-2 px-3 text-gray-700">
                          {enrollmentMatrix[track.id]?.[tier.id] ?? 0}
                        </td>
                      ))}
                      <td className="text-center py-2 px-3 font-semibold text-gray-900">{rowTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/participants"
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:bg-gray-50 transition-colors block text-center"
        >
          <p className="font-semibold text-gray-900">View Participants</p>
          <p className="text-sm text-gray-500 mt-1">Manage enrolled members</p>
        </Link>
        <Link
          href="/admin/checkins"
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:bg-gray-50 transition-colors block text-center"
        >
          <p className="font-semibold text-gray-900">Check-Ins</p>
          <p className="text-sm text-gray-500 mt-1">Daily check-in management</p>
        </Link>
        <Link
          href="/admin/leaderboard"
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:bg-gray-50 transition-colors block text-center"
        >
          <p className="font-semibold text-gray-900">Leaderboard</p>
          <p className="text-sm text-gray-500 mt-1">Rankings and streaks</p>
        </Link>
      </div>

      {/* At-Risk Participants */}
      {atRiskParticipants.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              At-Risk Participants
              <span className="ml-2 text-sm font-normal text-gray-500">
                Missing 2+ days
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {atRiskParticipants.map((p) => {
              const lastDate = latestCheckinMap.get(p.id);
              return (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    {p.tracks && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: p.tracks.color ? `${p.tracks.color}20` : "#f3f4f6",
                          color: p.tracks.color || "#6b7280",
                        }}
                      >
                        {p.tracks.icon} {p.tracks.name}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {lastDate ? `Last: ${lastDate}` : "No check-ins"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
