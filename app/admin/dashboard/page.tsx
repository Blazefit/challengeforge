import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: gym } = await supabase
    .from("gyms")
    .select("*")
    .eq("email", user?.email ?? "")
    .single();

  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, name, slug, status, start_date, end_date")
    .order("created_at", { ascending: false });

  if (!gym) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <a
            href="/admin/challenges/new"
            className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            + New Challenge
          </a>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-yellow-800 mb-1">
            Complete Your Setup
          </h2>
          <p className="text-yellow-700 text-sm mb-3">
            Finish setting up your gym profile to get started.
          </p>
          <a
            href="/admin/onboarding"
            className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
          >
            Complete Onboarding
          </a>
        </div>
      </div>
    );
  }

  const challengeIds = (challenges ?? []).map((c) => c.id);

  // Fetch tracks, tiers, participants, and today's checkins in parallel
  const today = new Date().toISOString().split("T")[0];

  const [tracksRes, tiersRes, participantsRes, checkinsRes, recentCheckinsRes] =
    await Promise.all([
      supabase
        .from("tracks")
        .select("id, name, color, challenge_id")
        .in("challenge_id", challengeIds.length > 0 ? challengeIds : ["none"])
        .order("sort_order"),
      supabase
        .from("tiers")
        .select("id, name, price_cents, challenge_id")
        .in("challenge_id", challengeIds.length > 0 ? challengeIds : ["none"])
        .order("sort_order"),
      supabase
        .from("participants")
        .select(
          "id, name, email, track_id, tier_id, challenge_id, status, created_at"
        )
        .in("challenge_id", challengeIds.length > 0 ? challengeIds : ["none"]),
      supabase
        .from("checkins")
        .select("id, participant_id, date, created_at")
        .eq("date", today),
      supabase
        .from("checkins")
        .select("id, participant_id, date, weight, protein_hit, trained, recovery_score, notes, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const tracks = tracksRes.data ?? [];
  const tiers = tiersRes.data ?? [];
  const participants = participantsRes.data ?? [];
  const todayCheckins = checkinsRes.data ?? [];
  const recentCheckins = recentCheckinsRes.data ?? [];

  // Find the most recent checkin date for each participant (for at-risk calc)
  // We need all checkins for active participants to find who's at-risk
  const activeParticipants = participants.filter((p) => p.status === "active");
  const activeIds = activeParticipants.map((p) => p.id);

  const latestCheckinMap: Record<string, string> = {};
  if (activeIds.length > 0) {
    const { data: allCheckins } = await supabase
      .from("checkins")
      .select("participant_id, date")
      .in("participant_id", activeIds)
      .order("date", { ascending: false });

    if (allCheckins) {
      for (const c of allCheckins) {
        if (!latestCheckinMap[c.participant_id]) {
          latestCheckinMap[c.participant_id] = c.date;
        }
      }
    }
  }

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

  const atRiskParticipants = activeParticipants.filter((p) => {
    const lastDate = latestCheckinMap[p.id];
    if (!lastDate) return true; // Never checked in = at risk
    return lastDate < twoDaysAgoStr;
  });

  // Stats
  const totalEnrolled = activeParticipants.length;
  const checkedInToday = todayCheckins.length;
  const atRiskCount = atRiskParticipants.length;

  // Revenue: sum of tier price_cents for all participants
  const tierPriceMap: Record<string, number> = {};
  for (const t of tiers) tierPriceMap[t.id] = t.price_cents;
  const totalRevenueCents = participants.reduce((sum, p) => {
    return sum + (tierPriceMap[p.tier_id] || 0);
  }, 0);
  const totalRevenue = (totalRevenueCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });

  // Action items
  const todayStr = today;
  const newSignupsToday = participants.filter(
    (p) => p.created_at && p.created_at.startsWith(todayStr)
  );

  // Enrollment matrix: track x tier counts
  const trackMap: Record<string, { name: string; color: string }> = {};
  for (const t of tracks) trackMap[t.id] = { name: t.name, color: t.color };
  const tierMap: Record<string, string> = {};
  for (const t of tiers) tierMap[t.id] = t.name;

  const matrix: Record<string, Record<string, number>> = {};
  for (const t of tracks) {
    matrix[t.id] = {};
    for (const tier of tiers) {
      if (tier.challenge_id === t.challenge_id) {
        matrix[t.id][tier.id] = 0;
      }
    }
  }
  for (const p of participants) {
    if (matrix[p.track_id] && matrix[p.track_id][p.tier_id] !== undefined) {
      matrix[p.track_id][p.tier_id]++;
    }
  }

  // Build participant lookup for recent activity
  const participantMap: Record<string, { name: string; track_id: string }> = {};
  for (const p of participants) {
    participantMap[p.id] = { name: p.name, track_id: p.track_id };
  }

  // Recent activity: merge recent signups and checkins, sort by time
  type ActivityItem = {
    type: "signup" | "checkin";
    name: string;
    trackName: string;
    trackColor: string;
    time: string;
  };

  const recentActivity: ActivityItem[] = [];

  // Add recent signups
  const recentSignups = [...participants]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  for (const p of recentSignups) {
    const track = trackMap[p.track_id];
    recentActivity.push({
      type: "signup",
      name: p.name,
      trackName: track?.name ?? "Unknown",
      trackColor: track?.color ?? "#6b7280",
      time: p.created_at,
    });
  }

  // Add recent checkins
  for (const c of recentCheckins) {
    const pInfo = participantMap[c.participant_id];
    if (pInfo) {
      const track = trackMap[pInfo.track_id];
      recentActivity.push({
        type: "checkin",
        name: pInfo.name,
        trackName: track?.name ?? "Unknown",
        trackColor: track?.color ?? "#6b7280",
        time: c.created_at,
      });
    }
  }

  recentActivity.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );
  const topActivity = recentActivity.slice(0, 10);

  // Unique tier IDs for matrix columns (deduplicated)
  const uniqueTiers = tiers.filter(
    (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {gym.name}</p>
        </div>
        <a
          href="/admin/challenges/new"
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          + New Challenge
        </a>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Enrolled"
          value={String(totalEnrolled)}
          color="bg-blue-50 text-blue-700"
          icon="👥"
        />
        <StatCard
          label="Checked In Today"
          value={String(checkedInToday)}
          color="bg-green-50 text-green-700"
          icon="✅"
        />
        <StatCard
          label="At-Risk"
          value={String(atRiskCount)}
          color={
            atRiskCount > 0
              ? "bg-red-50 text-red-700"
              : "bg-gray-50 text-gray-600"
          }
          icon="⚠️"
        />
        <StatCard label="Revenue" value={totalRevenue} color="bg-emerald-50 text-emerald-700" icon="💰" />
      </div>

      {/* Your Actions Today + Enrollment Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Actions Today */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Your Actions Today
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {newSignupsToday.length > 0 && (
              <ActionCard
                label={`Review ${newSignupsToday.length} new signup${newSignupsToday.length !== 1 ? "s" : ""}`}
                href="/admin/participants"
                accent="blue"
              />
            )}
            {atRiskCount > 0 && (
              <ActionCard
                label={`Nudge ${atRiskCount} at-risk athlete${atRiskCount !== 1 ? "s" : ""}`}
                href="/admin/participants"
                accent="red"
              />
            )}
            <ActionCard
              label="Check today&apos;s check-ins"
              href="/admin/checkins"
              accent="green"
            />
            {newSignupsToday.length === 0 && atRiskCount === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">
                All caught up! No urgent actions today.
              </div>
            )}
          </div>
        </div>

        {/* Enrollment Matrix */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Enrollment Matrix
            </h2>
          </div>
          <div className="p-4">
            {tracks.length === 0 || tiers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">
                Create a challenge with tracks and tiers to see the matrix.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                        Track / Tier
                      </th>
                      {uniqueTiers.map((tier) => (
                        <th
                          key={tier.id}
                          className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase"
                        >
                          {tier.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tracks.map((track) => (
                      <tr key={track.id}>
                        <td className="px-3 py-2">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor: track.color || "#6b7280",
                            }}
                          >
                            {track.name}
                          </span>
                        </td>
                        {uniqueTiers.map((tier) => {
                          const count =
                            matrix[track.id]?.[tier.id] ?? 0;
                          return (
                            <td key={tier.id} className="text-center px-3 py-2">
                              <span
                                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold ${
                                  count > 0
                                    ? "bg-red-50 text-red-700"
                                    : "bg-gray-50 text-gray-400"
                                }`}
                              >
                                {count}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity + Challenge Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topActivity.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                No activity yet.
              </div>
            ) : (
              topActivity.map((a, i) => (
                <div
                  key={i}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        a.type === "signup" ? "bg-blue-500" : "bg-green-500"
                      }`}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {a.name}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        {a.type === "signup" ? "signed up" : "checked in"}
                      </span>
                      <span
                        className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: a.trackColor }}
                      >
                        {a.trackName}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTimeAgo(a.time)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Challenge Quick Links */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Challenge Quick Links
            </h2>
          </div>
          {!challenges || challenges.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-400 text-sm mb-3">
                No challenges yet. Create your first one!
              </p>
              <a
                href="/admin/challenges/new"
                className="inline-block bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Create Challenge
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {challenges.map((c) => {
                const pCount = participants.filter(
                  (p) => p.challenge_id === c.id
                ).length;
                return (
                  <div
                    key={c.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{c.name}</h3>
                      <p className="text-sm text-gray-500">
                        /c/{c.slug} &middot; {pCount} participant
                        {pCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        c.status === "active"
                          ? "bg-green-100 text-green-700"
                          : c.status === "completed"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <div className={`rounded-xl border border-gray-200 shadow-sm p-5 ${color} bg-white`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-75 mt-1">{label}</div>
    </div>
  );
}

function ActionCard({
  label,
  href,
  accent,
}: {
  label: string;
  href: string;
  accent: "blue" | "red" | "green";
}) {
  const colors = {
    blue: "border-blue-200 bg-blue-50 hover:bg-blue-100",
    red: "border-red-200 bg-red-50 hover:bg-red-100",
    green: "border-green-200 bg-green-50 hover:bg-green-100",
  };
  const textColors = {
    blue: "text-blue-800",
    red: "text-red-800",
    green: "text-green-800",
  };

  return (
    <a
      href={href}
      className={`block rounded-lg border p-3 transition-colors ${colors[accent]}`}
    >
      <span className={`text-sm font-medium ${textColors[accent]}`}>
        {label}
      </span>
    </a>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}
