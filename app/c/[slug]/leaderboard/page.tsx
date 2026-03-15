import { createAdminClient } from "@/lib/supabase/admin";
import { computeLeaderboard } from "@/lib/scoring";
import { notFound } from "next/navigation";

export default async function PublicLeaderboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, name, start_date")
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

  const scored = computeLeaderboard(allParticipants as never[] || [], allCheckins || [], challenge.start_date);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="text-center py-10 bg-gradient-to-b from-gray-900 to-gray-950">
        <h1 className="text-4xl font-black tracking-tight">{challenge.name}</h1>
        <p className="text-red-500 text-lg font-semibold mt-2 tracking-widest uppercase">Leaderboard</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {scored.length === 0 ? (
          <p className="text-gray-500 text-center py-12 text-lg">Challenge hasn&apos;t started yet. Check back soon!</p>
        ) : (
          <div className="space-y-3">
            {scored.map((s) => (
              <div key={s.id} className={`flex items-center gap-4 p-4 rounded-xl ${s.rank <= 3 ? "bg-gray-800 border border-gray-700" : "bg-gray-900"}`}>
                <span className={`text-2xl font-black w-10 text-center ${s.rank === 1 ? "text-yellow-400" : s.rank === 2 ? "text-gray-300" : s.rank === 3 ? "text-orange-400" : "text-gray-600"}`}>
                  {s.rank}
                </span>
                <div className="flex-1">
                  <span className="text-xl font-bold">{s.name.split(" ")[0]}</span>
                  <span className="ml-3 text-sm" style={{ color: s.track_color }}>{s.track_icon} {s.track_name}</span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{s.score.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">{s.consistency_pct.toFixed(0)}% consistent</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-8">Auto-refreshes on page load. Scoring based on weight change, consistency, and track-specific metrics.</p>
      </div>
    </div>
  );
}
