import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getStreak } from "@/lib/scoring";

interface CheckinRow {
  participant_id: string;
  date: string;
  weight: number | null;
  protein_hit: string | null;
  trained: boolean | null;
  steps: number | null;
  recovery_score: number | null;
}

interface TrackData {
  name: string;
  icon: string;
  color: string;
  scoring_direction: string;
}

interface ParticipantRow {
  id: string;
  name: string;
  intake_pre: { weight?: number; goal_weight?: number } | null;
  status: string;
  tracks: TrackData | null;
}

function getWeekNumber(dateStr: string, startDateStr: string): number {
  const date = new Date(dateStr + "T00:00:00");
  const start = new Date(startDateStr + "T00:00:00");
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (7 * 86400000)) + 1;
}

function getWeekDateRange(weekNum: number, startDateStr: string): string {
  const start = new Date(startDateStr + "T00:00:00");
  const weekStart = new Date(start.getTime() + (weekNum - 1) * 7 * 86400000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

function getCurrentWeek(startDateStr: string): number {
  const now = new Date();
  const start = new Date(startDateStr + "T00:00:00");
  const diff = now.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (7 * 86400000)) + 1);
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signup");

  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("email", user.email ?? "")
    .single();

  if (!gym) redirect("/admin/onboarding");

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, name, start_date, end_date")
    .eq("gym_id", gym.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challenge) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Weekly Reports</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">No active challenge found.</p>
          <Link
            href="/admin/challenges/new"
            className="inline-block mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Create a Challenge
          </Link>
        </div>
      </div>
    );
  }

  // Fetch all active participants with track data
  const { data: participants } = (await supabase
    .from("participants")
    .select(
      "id, name, intake_pre, status, tracks(name, icon, color, scoring_direction)"
    )
    .eq("challenge_id", challenge.id)
    .eq("status", "active")) as { data: ParticipantRow[] | null };

  const activeParticipants = participants ?? [];

  // Fetch all checkins
  const participantIds = activeParticipants.map((p) => p.id);
  const { data: checkins } =
    participantIds.length > 0
      ? ((await supabase
          .from("checkins")
          .select(
            "participant_id, date, weight, protein_hit, trained, steps, recovery_score"
          )
          .in("participant_id", participantIds)) as {
          data: CheckinRow[] | null;
        })
      : { data: [] as CheckinRow[] };

  const allCheckins = checkins ?? [];

  // Build checkins-by-participant map
  const checkinsByParticipant = new Map<string, CheckinRow[]>();
  for (const c of allCheckins) {
    const list = checkinsByParticipant.get(c.participant_id) || [];
    list.push(c);
    checkinsByParticipant.set(c.participant_id, list);
  }

  // Determine total weeks
  const currentWeek = getCurrentWeek(challenge.start_date);
  const endDate = new Date(challenge.end_date + "T00:00:00");
  const startDate = new Date(challenge.start_date + "T00:00:00");
  const totalWeeks = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (7 * 86400000)
  );
  const maxWeek = Math.min(currentWeek, totalWeeks);

  // Weekly summaries
  interface WeeklySummary {
    week: number;
    dateRange: string;
    avgCheckinRate: number;
    avgWeightChange: number;
    proteinAdherence: number;
    atRiskCount: number;
  }

  const weeklySummaries: WeeklySummary[] = [];

  for (let w = 1; w <= maxWeek; w++) {
    const weekCheckins = allCheckins.filter(
      (c) => getWeekNumber(c.date, challenge.start_date) === w
    );

    // Checkin rate: unique participant-days / (participants * 7)
    const expectedDays = activeParticipants.length * 7;
    const uniqueParticipantDays = new Set(
      weekCheckins.map((c) => `${c.participant_id}_${c.date}`)
    ).size;
    const avgCheckinRate =
      expectedDays > 0 ? (uniqueParticipantDays / expectedDays) * 100 : 0;

    // Avg weight change from start for each participant with data this week
    let totalWeightChange = 0;
    let weightCount = 0;
    for (const p of activeParticipants) {
      const pWeekCheckins = weekCheckins
        .filter((c) => c.participant_id === p.id && c.weight != null)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (pWeekCheckins.length > 0) {
        const sWeight = p.intake_pre?.weight ?? null;
        const latestWeight = pWeekCheckins[pWeekCheckins.length - 1].weight;
        if (sWeight && latestWeight) {
          totalWeightChange += latestWeight - sWeight;
          weightCount++;
        }
      }
    }
    const avgWeightChange = weightCount > 0 ? totalWeightChange / weightCount : 0;

    // Protein adherence
    const proteinCheckins = weekCheckins.filter((c) => c.protein_hit != null);
    const proteinHits = proteinCheckins.filter(
      (c) => c.protein_hit === "yes"
    ).length;
    const proteinAdherence =
      proteinCheckins.length > 0
        ? (proteinHits / proteinCheckins.length) * 100
        : 0;

    // At-risk: participants who missed 2+ days that week
    const checkinDaysByParticipant = new Map<string, Set<string>>();
    for (const c of weekCheckins) {
      const days =
        checkinDaysByParticipant.get(c.participant_id) || new Set<string>();
      days.add(c.date);
      checkinDaysByParticipant.set(c.participant_id, days);
    }
    let atRiskCount = 0;
    for (const p of activeParticipants) {
      const days = checkinDaysByParticipant.get(p.id);
      const checkedDays = days ? days.size : 0;
      if (7 - checkedDays >= 2) {
        atRiskCount++;
      }
    }

    weeklySummaries.push({
      week: w,
      dateRange: getWeekDateRange(w, challenge.start_date),
      avgCheckinRate,
      avgWeightChange,
      proteinAdherence,
      atRiskCount,
    });
  }

  // Track comparison
  interface TrackStats {
    name: string;
    icon: string;
    color: string;
    avgWeightChange: number;
    avgConsistency: number;
    bestPerformer: string;
    worstPerformer: string;
    participantCount: number;
  }

  const trackMap = new Map<string, ParticipantRow[]>();
  for (const p of activeParticipants) {
    const trackName = p.tracks?.name || "Unknown";
    const list = trackMap.get(trackName) || [];
    list.push(p);
    trackMap.set(trackName, list);
  }

  const now = new Date();
  const daysElapsed = Math.max(
    1,
    Math.floor((now.getTime() - startDate.getTime()) / 86400000)
  );

  const trackStats: TrackStats[] = [];
  for (const [trackName, trackParticipants] of trackMap) {
    const track = trackParticipants[0]?.tracks;
    let totalWeightChange = 0;
    let weightCount = 0;
    let totalConsistency = 0;

    interface ParticipantScore {
      name: string;
      score: number;
    }
    const scores: ParticipantScore[] = [];

    for (const p of trackParticipants) {
      const pCheckins = checkinsByParticipant.get(p.id) || [];
      const consistency = Math.min(100, (pCheckins.length / daysElapsed) * 100);
      totalConsistency += consistency;

      const weightsWithDates = pCheckins
        .filter((c) => c.weight != null)
        .sort((a, b) => a.date.localeCompare(b.date));
      const sWeight = p.intake_pre?.weight ?? null;
      const lWeight =
        weightsWithDates.length > 0
          ? weightsWithDates[weightsWithDates.length - 1].weight
          : null;
      let wChange = 0;
      if (sWeight && lWeight) {
        wChange = ((lWeight - sWeight) / sWeight) * 100;
        totalWeightChange += wChange;
        weightCount++;
      }

      scores.push({ name: p.name, score: consistency + Math.abs(wChange) });
    }

    scores.sort((a, b) => b.score - a.score);
    const firstName = (name: string) => name.split(" ")[0];

    trackStats.push({
      name: trackName,
      icon: track?.icon || "",
      color: track?.color || "#6b7280",
      avgWeightChange: weightCount > 0 ? totalWeightChange / weightCount : 0,
      avgConsistency:
        trackParticipants.length > 0
          ? totalConsistency / trackParticipants.length
          : 0,
      bestPerformer: scores.length > 0 ? firstName(scores[0].name) : "—",
      worstPerformer:
        scores.length > 0 ? firstName(scores[scores.length - 1].name) : "—",
      participantCount: trackParticipants.length,
    });
  }

  // Engagement trends
  const thisWeekSummary = weeklySummaries.find((w) => w.week === maxWeek);
  const lastWeekSummary = weeklySummaries.find((w) => w.week === maxWeek - 1);
  const thisWeekRate = thisWeekSummary?.avgCheckinRate ?? 0;
  const lastWeekRate = lastWeekSummary?.avgCheckinRate ?? 0;
  const rateDiff = thisWeekRate - lastWeekRate;
  const rateArrow = rateDiff >= 0 ? "\u2191" : "\u2193";

  // Most consistent participant (longest streak)
  let bestStreakName = "—";
  let bestStreakCount = 0;
  for (const p of activeParticipants) {
    const pCheckins = checkinsByParticipant.get(p.id) || [];
    const dates = pCheckins.map((c) => c.date);
    const streak = getStreak(dates);
    if (streak > bestStreakCount) {
      bestStreakCount = streak;
      bestStreakName = p.name.split(" ")[0];
    }
  }

  // Participants who haven't checked in this week
  const thisWeekCheckins = allCheckins.filter(
    (c) => getWeekNumber(c.date, challenge.start_date) === maxWeek
  );
  const thisWeekParticipantIds = new Set(
    thisWeekCheckins.map((c) => c.participant_id)
  );
  const missingThisWeek = activeParticipants.filter(
    (p) => !thisWeekParticipantIds.has(p.id)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Reports</h1>
          <p className="text-gray-500 mt-1">{challenge.name}</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-gray-500 hover:text-red-600"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Week-by-Week Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Week-by-Week Summary
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Week</th>
                <th className="px-6 py-3 font-medium">Date Range</th>
                <th className="px-6 py-3 font-medium text-right">
                  Check-in Rate
                </th>
                <th className="px-6 py-3 font-medium text-right">
                  Avg Weight Change
                </th>
                <th className="px-6 py-3 font-medium text-right">
                  Protein Adherence
                </th>
                <th className="px-6 py-3 font-medium text-right">At-Risk</th>
              </tr>
            </thead>
            <tbody>
              {weeklySummaries.map((ws) => (
                <tr
                  key={ws.week}
                  className={`border-b border-gray-50 ${ws.week === maxWeek ? "bg-red-50/40" : ""}`}
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {ws.week}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{ws.dateRange}</td>
                  <td className="px-6 py-3 text-right text-gray-900">
                    {ws.avgCheckinRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-3 text-right text-gray-900">
                    {ws.avgWeightChange >= 0 ? "+" : ""}
                    {ws.avgWeightChange.toFixed(1)} lbs
                  </td>
                  <td className="px-6 py-3 text-right text-gray-900">
                    {ws.proteinAdherence.toFixed(1)}%
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span
                      className={
                        ws.atRiskCount > 0
                          ? "text-red-600 font-semibold"
                          : "text-gray-900"
                      }
                    >
                      {ws.atRiskCount}
                    </span>
                  </td>
                </tr>
              ))}
              {weeklySummaries.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No weekly data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Track Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Track Comparison
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {trackStats.map((ts) => (
            <div key={ts.name} className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{ts.icon}</span>
                <h3 className="font-semibold text-gray-900">{ts.name}</h3>
                <span className="text-xs text-gray-400 ml-auto">
                  {ts.participantCount} participants
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Weight Change</span>
                  <span className="font-medium text-gray-900">
                    {ts.avgWeightChange >= 0 ? "+" : ""}
                    {ts.avgWeightChange.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Consistency</span>
                  <span className="font-medium text-gray-900">
                    {ts.avgConsistency.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Best Performer</span>
                  <span className="font-medium text-green-600">
                    {ts.bestPerformer}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Needs Support</span>
                  <span className="font-medium text-red-600">
                    {ts.worstPerformer}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {trackStats.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400 col-span-3">
              No track data available.
            </div>
          )}
        </div>
      </div>

      {/* Engagement Trends */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Engagement Trends
          </h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className={`text-2xl font-bold ${rateDiff >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {rateArrow}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Check-in rate:{" "}
                <span className="font-bold">{thisWeekRate.toFixed(1)}%</span>{" "}
                this week
                {lastWeekSummary && (
                  <span className="text-gray-500">
                    {" "}
                    vs {lastWeekRate.toFixed(1)}% last week (
                    {rateDiff >= 0 ? "+" : ""}
                    {rateDiff.toFixed(1)}pp)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-orange-500">&#9733;</span>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Most consistent:{" "}
                <span className="font-bold">{bestStreakName}</span>
                {bestStreakCount > 0 && (
                  <span className="text-gray-500">
                    {" "}
                    ({bestStreakCount}-day streak)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl font-bold text-yellow-500">!</span>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                No check-ins this week ({missingThisWeek.length})
              </p>
              {missingThisWeek.length > 0 ? (
                <p className="text-sm text-gray-500">
                  {missingThisWeek
                    .map((p) => p.name.split(" ")[0])
                    .join(", ")}
                </p>
              ) : (
                <p className="text-sm text-green-600">
                  Everyone has checked in!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
