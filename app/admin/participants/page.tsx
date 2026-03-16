import { createClient } from "@/lib/supabase/server";
import ParticipantsTable from "./participants-table";

export default async function ParticipantsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get gym for this owner
  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("email", user?.email ?? "")
    .single();

  if (!gym) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Participants</h1>
        <p className="text-gray-500">
          Complete your gym setup first to manage participants.
        </p>
      </div>
    );
  }

  // Get all challenges for this gym
  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, name, slug, status")
    .eq("gym_id", gym.id)
    .order("created_at", { ascending: false });

  if (!challenges || challenges.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Participants</h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-16 text-center">
          <p className="text-gray-400 mb-2">No challenges yet.</p>
          <p className="text-gray-400 text-sm">
            Create a challenge first, then participants will appear here.
          </p>
        </div>
      </div>
    );
  }

  const challengeIds = challenges.map((c) => c.id);

  // Get all tracks and tiers for these challenges
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, name, color, challenge_id")
    .in("challenge_id", challengeIds)
    .order("sort_order");

  const { data: tiers } = await supabase
    .from("tiers")
    .select("id, name, price_cents, challenge_id")
    .in("challenge_id", challengeIds)
    .order("sort_order");

  // Get all participants for these challenges
  const { data: participants } = await supabase
    .from("participants")
    .select("*")
    .in("challenge_id", challengeIds)
    .order("created_at", { ascending: false });

  return (
    <ParticipantsTable
      challenges={challenges ?? []}
      tracks={tracks ?? []}
      tiers={tiers ?? []}
      participants={participants ?? []}
    />
  );
}
