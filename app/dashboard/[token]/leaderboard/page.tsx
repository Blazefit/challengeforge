import { getParticipantByToken } from "@/lib/participant";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeLeaderboard } from "@/lib/scoring";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ParticipantLeaderboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const participant = await getParticipantByToken(token);
  if (!participant) notFound();

  const supabase = createAdminClient();
  const challenge = participant.challenges as { id: string; name: string; start_date: string } | null;
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

  // Get unique tracks for filter
  const trackNames = [...new Set(scored.map((s) => s.track_name))];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-4 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Leaderboard</h1>
            <p className="text-gray-500 text-xs">{challenge.name}</p>
          </div>
          <Link href={`/dashboard/${token}`} className="text-gray-400 text-sm hover:text-white">&larr; Dashboard</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Track info */}
        <div className="flex gap-2 flex-wrap mb-4">
          {trackNames.map((t) => (
            <span key={t} className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">{t}</span>
          ))}
        </div>

        {scored.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No participants yet.</p>
        ) : (
          <div className="space-y-2">
            {scored.map((s) => {
              const isMe = s.id === participant.id;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    isMe ? "bg-red-900/30 border border-red-700" : "bg-gray-900"
                  }`}
                >
                  <span className={`text-lg font-bold w-8 text-center ${isMe ? "text-red-400" : "text-gray-500"}`}>
                    {s.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{s.name.split(" ")[0]}</span>
                      <span className="text-xs" style={{ color: s.track_color }}>{s.track_icon} {s.track_name}</span>
                      {isMe && <span className="text-xs bg-red-600 px-1.5 py-0.5 rounded text-white">You</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{s.weight_change_pct !== 0 ? `${s.weight_change_pct > 0 ? "+" : ""}${s.weight_change_pct.toFixed(1)}%` : "—"}</span>
                      <span>{s.consistency_pct.toFixed(0)}% consistent</span>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-300">{s.score.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
