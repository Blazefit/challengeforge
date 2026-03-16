import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WeeklyReport({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
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

  // Get the most recent challenge for this gym
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
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Weekly Report
        </h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-400 mb-4">
            No challenge found. Create a challenge first.
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

  // Week calculation
  const resolvedParams = await searchParams;
  const challengeStart = new Date(challenge.start_date + "T00:00:00");
  const weekParam = resolvedParams.week
    ? parseInt(resolvedParams.week)
    : null;

  const now = new Date();
  const daysSinceStart = Math.max(
    0,
    Math.floor((now.getTime() - challengeStart.getTime()) / 86400000)
  );
  const currentWeekNum = Math.floor(daysSinceStart / 7) + 1;
  const weekNum = weekParam || currentWeekNum;

  // Week boundaries (aligned to challenge start)
  const weekStartDate = new Date(challengeStart);
  weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const weekStart = weekStartDate.toLocaleDateString("en-CA");
  const weekEnd = weekEndDate.toLocaleDateString("en-CA");

  // How many days in this week have actually passed (for avg calc)
  const today = now.toLocaleDateString("en-CA");
  const effectiveEnd = weekEnd < today ? weekEnd : today;
  const effectiveEndDate = new Date(effectiveEnd + "T00:00:00");
  const daysElapsed = Math.max(
    1,
    Math.min(
      7,
      Math.floor(
        (effectiveEndDate.getTime() - weekStartDate.getTime()) / 86400000
      ) + 1
    )
  );

  // Total weeks in challenge
  const challengeEnd = new Date(challenge.end_date + "T00:00:00");
  const totalWeeks = Math.ceil(
    (challengeEnd.getTime() - challengeStart.getTime()) / (7 * 86400000)
  );

  // Fetch active participants with tracks
  const { data: participants } = await supabase
    .from("participants")
    .select(
      "id, name, intake_pre, tracks(name, icon, color, scoring_direction)"
    )
    .eq("challenge_id", challenge.id)
    .eq("status", "active");

  const activeParticipants = participants ?? [];
  const participantIds = activeParticipants.map((p) => p.id);

  // Fetch all checkins for the week
  const { data: weekCheckins } =
    participantIds.length > 0
      ? await supabase
          .from("checkins")
          .select("participant_id, date, weight, protein_hit")
          .gte("date", weekStart)
          .lte("date", weekEnd)
          .in("participant_id", participantIds)
      : { data: [] as { participant_id: string; date: string; weight: number | null; protein_hit: string | null }[] };

  const checkins = weekCheckins ?? [];

  // --- Compute stats ---

  // Total check-ins this week
  const totalCheckins = checkins.length;

  // Unique participants who checked in
  const uniqueCheckedIn = new Set(checkins.map((c) => c.participant_id));

  // Average consistency: for each day elapsed, what % of participants checked in
  const checkinsByDate: Record<string, Set<string>> = {};
  for (const c of checkins) {
    if (!checkinsByDate[c.date]) checkinsByDate[c.date] = new Set();
    checkinsByDate[c.date].add(c.participant_id);
  }

  let consistencySum = 0;
  const tempDate = new Date(weekStartDate);
  for (let d = 0; d < daysElapsed; d++) {
    const dateStr = tempDate.toLocaleDateString("en-CA");
    const count = checkinsByDate[dateStr]?.size ?? 0;
    consistencySum +=
      activeParticipants.length > 0 ? count / activeParticipants.length : 0;
    tempDate.setDate(tempDate.getDate() + 1);
  }
  const avgConsistency =
    daysElapsed > 0 ? Math.round((consistencySum / daysElapsed) * 100) : 0;

  // Average weight change (start of week to end of week)
  const participantWeights: Record<
    string,
    { first: number | null; last: number | null; firstDate: string; lastDate: string }
  > = {};
  for (const c of checkins) {
    if (c.weight == null) continue;
    const pid = c.participant_id;
    if (!participantWeights[pid]) {
      participantWeights[pid] = {
        first: c.weight,
        last: c.weight,
        firstDate: c.date,
        lastDate: c.date,
      };
    } else {
      if (c.date < participantWeights[pid].firstDate) {
        participantWeights[pid].first = c.weight;
        participantWeights[pid].firstDate = c.date;
      }
      if (c.date > participantWeights[pid].lastDate) {
        participantWeights[pid].last = c.weight;
        participantWeights[pid].lastDate = c.date;
      }
    }
  }

  const weightChanges: number[] = [];
  for (const pid of Object.keys(participantWeights)) {
    const pw = participantWeights[pid];
    if (pw.first != null && pw.last != null && pw.firstDate !== pw.lastDate) {
      weightChanges.push(pw.last - pw.first);
    }
  }
  const avgWeightChange =
    weightChanges.length > 0
      ? weightChanges.reduce((a, b) => a + b, 0) / weightChanges.length
      : 0;

  // Protein adherence
  const proteinCheckins = checkins.filter((c) => c.protein_hit != null);
  const proteinYes = proteinCheckins.filter(
    (c) => c.protein_hit === "yes"
  ).length;
  const proteinPct =
    proteinCheckins.length > 0
      ? Math.round((proteinYes / proteinCheckins.length) * 100)
      : 0;

  // --- Top Performers by consistency ---
  const participantCheckinCounts: Record<string, number> = {};
  for (const c of checkins) {
    participantCheckinCounts[c.participant_id] =
      (participantCheckinCounts[c.participant_id] ?? 0) + 1;
  }

  const participantMap = new Map(activeParticipants.map((p) => [p.id, p]));

  const topPerformers = Object.entries(participantCheckinCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pid, count]) => {
      const p = participantMap.get(pid);
      const track = p?.tracks
        ? Array.isArray(p.tracks)
          ? p.tracks[0]
          : p.tracks
        : null;
      return {
        name: p?.name ?? "Unknown",
        checkins: count,
        consistency: Math.round((count / daysElapsed) * 100),
        track: track as { name: string; icon: string; color: string } | null,
      };
    });

  // --- Needs Attention (0 or 1 check-ins) ---
  const needsAttention = activeParticipants
    .filter((p) => (participantCheckinCounts[p.id] ?? 0) <= 1)
    .map((p) => {
      const track = p.tracks
        ? Array.isArray(p.tracks)
          ? p.tracks[0]
          : p.tracks
        : null;
      return {
        name: p.name,
        checkins: participantCheckinCounts[p.id] ?? 0,
        track: track as { name: string; icon: string; color: string } | null,
      };
    })
    .sort((a, b) => a.checkins - b.checkins);

  // --- Weight Movers (top 3 biggest changes in "right" direction) ---
  interface WeightMover {
    name: string;
    change: number;
    direction: string;
    track: { name: string; icon: string; color: string } | null;
  }
  const weightMovers: WeightMover[] = [];

  for (const pid of Object.keys(participantWeights)) {
    const pw = participantWeights[pid];
    if (pw.first == null || pw.last == null || pw.firstDate === pw.lastDate)
      continue;

    const p = participantMap.get(pid);
    if (!p) continue;

    const trackRaw = p.tracks
      ? Array.isArray(p.tracks)
        ? p.tracks[0]
        : p.tracks
      : null;
    const track = trackRaw as {
      name: string;
      icon: string;
      color: string;
      scoring_direction?: string;
    } | null;

    const change = pw.last - pw.first;
    const direction = track?.scoring_direction ?? "lose";

    // "Right direction" means: if lose track, negative change is good; if gain, positive is good
    const isRightDirection =
      direction === "gain" ? change > 0 : change < 0;

    if (isRightDirection) {
      weightMovers.push({
        name: p.name,
        change,
        direction,
        track: track
          ? { name: track.name, icon: track.icon, color: track.color }
          : null,
      });
    }
  }

  weightMovers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const topWeightMovers = weightMovers.slice(0, 3);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Report</h1>
          <p className="text-gray-500 mt-1">
            {challenge.name} &middot; Week {weekNum} of {totalWeeks}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500 mr-2">
            {weekStart} &mdash; {weekEnd}
          </p>
          {weekNum > 1 && (
            <Link
              href={`/admin/reports?week=${weekNum - 1}`}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              &larr; Prev
            </Link>
          )}
          {weekNum < currentWeekNum && (
            <Link
              href={`/admin/reports?week=${weekNum + 1}`}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Next &rarr;
            </Link>
          )}
          {weekNum !== currentWeekNum && (
            <Link
              href="/admin/reports"
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Current Week
            </Link>
          )}
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Total Check-ins</p>
          <p className="text-3xl font-bold text-gray-900">{totalCheckins}</p>
          <p className="text-xs text-gray-400 mt-1">
            {uniqueCheckedIn.size} unique participants
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Avg Consistency</p>
          <p className="text-3xl font-bold text-red-600">{avgConsistency}%</p>
          <p className="text-xs text-gray-400 mt-1">
            daily check-in rate
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Avg Weight Change</p>
          <p className="text-3xl font-bold text-gray-900">
            {avgWeightChange > 0 ? "+" : ""}
            {avgWeightChange.toFixed(1)} lbs
          </p>
          <p className="text-xs text-gray-400 mt-1">
            across {weightChanges.length} participants
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Protein Adherence</p>
          <p className="text-3xl font-bold text-red-600">{proteinPct}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {proteinYes}/{proteinCheckins.length} check-ins hit target
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Performers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Top Performers
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Most consistent this week
            </p>
          </div>
          {topPerformers.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-400">No check-ins this week yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topPerformers.map((p, i) => (
                <div
                  key={p.name}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {p.name}
                      </p>
                      {p.track && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${p.track.color}20`,
                            color: p.track.color,
                          }}
                        >
                          {p.track.icon} {p.track.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {p.consistency}%
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.checkins}/{daysElapsed} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Needs Attention */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Needs Attention
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              0-1 check-ins this week
            </p>
          </div>
          {needsAttention.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-green-600 font-medium">
                Everyone is staying active!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {needsAttention.map((p) => (
                <div
                  key={p.name}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-red-100 text-red-700">
                      !
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {p.name}
                      </p>
                      {p.track && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${p.track.color}20`,
                            color: p.track.color,
                          }}
                        >
                          {p.track.icon} {p.track.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {p.checkins === 0
                      ? "No check-ins"
                      : "1 check-in"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weight Movers */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Weight Movers
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Biggest weight changes in the right direction this week
          </p>
        </div>
        {topWeightMovers.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-400">
              Not enough weight data this week to show movers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
            {topWeightMovers.map((m, i) => (
              <div
                key={m.name}
                className="border border-gray-100 rounded-lg p-4 text-center"
              >
                <p className="text-xs text-gray-400 mb-1">
                  #{i + 1} {m.direction === "gain" ? "Gainer" : "Loser"}
                </p>
                <p className="text-lg font-bold text-gray-900">{m.name}</p>
                {m.track && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                    style={{
                      backgroundColor: `${m.track.color}20`,
                      color: m.track.color,
                    }}
                  >
                    {m.track.icon} {m.track.name}
                  </span>
                )}
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {m.change > 0 ? "+" : ""}
                  {m.change.toFixed(1)} lbs
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
