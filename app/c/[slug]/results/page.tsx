import { createAdminClient } from "@/lib/supabase/admin";
import { computeLeaderboard } from "@/lib/scoring";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 120;

export default async function ChallengeResults({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, name, start_date, end_date")
    .eq("slug", slug)
    .single();

  if (!challenge) notFound();

  const { data: allParticipants } = await supabase
    .from("participants")
    .select("id, name, intake_pre, tracks(name, icon, color, scoring_direction)")
    .eq("challenge_id", challenge.id)
    .eq("status", "active");

  const pIds = (allParticipants || []).map((p: { id: string }) => p.id);
  const { data: allCheckins } = await supabase
    .from("checkins")
    .select("participant_id, date, weight, protein_hit, steps")
    .in("participant_id", pIds.length > 0 ? pIds : ["none"]);

  const scored = computeLeaderboard(
    (allParticipants as never[]) || [],
    allCheckins || [],
    challenge.start_date
  );

  // Group by track
  const trackGroups = new Map<string, typeof scored>();
  for (const s of scored) {
    const group = trackGroups.get(s.track_name) || [];
    group.push(s);
    trackGroups.set(s.track_name, group);
  }

  // Challenge stats
  const totalParticipants = scored.length;
  const totalCheckins = scored.reduce((sum, s) => sum + s.total_checkins, 0);
  const avgConsistency =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, s) => sum + s.consistency_pct, 0) / scored.length
        )
      : 0;

  // Challenge progress
  const now = new Date();
  const start = new Date(challenge.start_date + "T00:00:00");
  const end = new Date(challenge.end_date + "T23:59:59");
  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / 86400000
  );
  const daysIn = Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / 86400000)
  );
  const progressPct =
    now < start ? 0 : now > end ? 100 : Math.round((daysIn / totalDays) * 100);
  const isComplete = now > end;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-4 py-10 text-center">
        <h1 className="text-4xl font-black tracking-tight">{challenge.name}</h1>
        <p className="text-red-500 text-lg font-semibold mt-2 tracking-widest uppercase">
          {isComplete ? "Final Results" : "Live Results"}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          {challenge.start_date} to {challenge.end_date}
        </p>

        {/* Progress bar */}
        <div className="max-w-md mx-auto mt-4">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {isComplete
              ? "Challenge complete"
              : `Day ${daysIn} of ${totalDays} (${progressPct}%)`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 text-center">
            <p className="text-3xl font-black">{totalParticipants}</p>
            <p className="text-xs text-gray-500 mt-1">Participants</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 text-center">
            <p className="text-3xl font-black">{totalCheckins}</p>
            <p className="text-xs text-gray-500 mt-1">Total Check-ins</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 text-center">
            <p className="text-3xl font-black">{avgConsistency}%</p>
            <p className="text-xs text-gray-500 mt-1">Avg Consistency</p>
          </div>
        </div>

        {/* Track-by-Track Results */}
        {Array.from(trackGroups.entries()).map(([trackName, members]) => {
          const firstMember = members[0];
          return (
            <div key={trackName} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{firstMember?.track_icon}</span>
                <h2
                  className="text-xl font-bold"
                  style={{ color: firstMember?.track_color }}
                >
                  {trackName}
                </h2>
                <span className="text-gray-600 text-sm">
                  ({members.length} participants)
                </span>
              </div>

              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-gray-800">
                      <th className="text-left py-3 px-4 font-medium w-10">
                        #
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-right py-3 px-4 font-medium">
                        Weight %
                      </th>
                      <th className="text-right py-3 px-4 font-medium">
                        Consistency
                      </th>
                      <th className="text-right py-3 px-4 font-medium">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((s, i) => (
                      <tr
                        key={s.id}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30"
                      >
                        <td className="py-2.5 px-4">
                          <span
                            className={`font-bold ${
                              i === 0
                                ? "text-yellow-400"
                                : i === 1
                                ? "text-gray-300"
                                : i === 2
                                ? "text-orange-400"
                                : "text-gray-600"
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium">
                          {s.name.split(" ")[0]}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {s.weight_change_pct !== 0 ? (
                            <span
                              className={
                                s.weight_change_pct > 0
                                  ? "text-blue-400"
                                  : "text-green-400"
                              }
                            >
                              {s.weight_change_pct > 0 ? "+" : ""}
                              {s.weight_change_pct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-600">--</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right text-gray-400">
                          {s.consistency_pct.toFixed(0)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold">
                          {s.score.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Links */}
        <div className="flex justify-center gap-4 mt-8">
          <Link
            href={`/c/${slug}/leaderboard`}
            className="px-6 py-3 bg-gray-800 rounded-xl text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Overall Leaderboard
          </Link>
          <Link
            href={`/c/${slug}`}
            className="px-6 py-3 bg-red-600 rounded-xl text-sm text-white hover:bg-red-700 transition-colors"
          >
            Join the Challenge
          </Link>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          First names only. Results update automatically.
        </p>
      </div>
    </div>
  );
}
