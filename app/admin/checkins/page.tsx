import { createClient } from "@/lib/supabase/server";
import CheckinsView from "./checkins-view";

export default async function CoachCheckinsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("email", user?.email ?? "")
    .single();

  if (!gym) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check-Ins</h1>
        <p className="text-gray-500">
          Complete your gym setup first to view check-ins.
        </p>
      </div>
    );
  }

  const { data: challenges } = await supabase
    .from("challenges")
    .select("id")
    .eq("gym_id", gym.id);

  const challengeIds = (challenges ?? []).map((c) => c.id);

  if (challengeIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Check-Ins</h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-16 text-center">
          <p className="text-gray-400">
            No challenges yet. Create a challenge first.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  // Get all participants for these challenges
  const { data: participants } = await supabase
    .from("participants")
    .select("id, name, email, track_id, tier_id, status")
    .in("challenge_id", challengeIds)
    .eq("status", "active");

  const activeParticipants = participants ?? [];
  const participantIds = activeParticipants.map((p) => p.id);

  // Get today's checkins
  const { data: todayCheckins } = await supabase
    .from("checkins")
    .select("*")
    .eq("date", today)
    .in("participant_id", participantIds.length > 0 ? participantIds : ["none"])
    .order("created_at", { ascending: false });

  // Get tracks and tiers for display
  const [tracksRes, tiersRes] = await Promise.all([
    supabase
      .from("tracks")
      .select("id, name, color")
      .in("challenge_id", challengeIds),
    supabase
      .from("tiers")
      .select("id, name")
      .in("challenge_id", challengeIds),
  ]);

  // Get latest checkin date per participant (for at-risk calculation)
  const latestCheckinMap: Record<string, string> = {};
  if (participantIds.length > 0) {
    const { data: allCheckins } = await supabase
      .from("checkins")
      .select("participant_id, date")
      .in("participant_id", participantIds)
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

  const atRiskIds = new Set(
    activeParticipants
      .filter((p) => {
        const lastDate = latestCheckinMap[p.id];
        if (!lastDate) return true;
        return lastDate < twoDaysAgoStr;
      })
      .map((p) => p.id)
  );

  // Figure out who checked in today and who didn't
  const checkedInIds = new Set(
    (todayCheckins ?? []).map((c) => c.participant_id)
  );
  const missingParticipants = activeParticipants.filter(
    (p) => !checkedInIds.has(p.id)
  );

  return (
    <CheckinsView
      participants={activeParticipants}
      todayCheckins={todayCheckins ?? []}
      missingParticipants={missingParticipants}
      tracks={tracksRes.data ?? []}
      tiers={tiersRes.data ?? []}
      atRiskIds={Array.from(atRiskIds)}
      today={today}
    />
  );
}
