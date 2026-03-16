import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CommsHub from "./CommsHub";

interface Track {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Tier {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  status: string;
  track_id: string | null;
  tier_id: string | null;
  tracks: { name: string } | null;
  tiers: { name: string } | null;
}

export default async function Communications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signup");
  }

  const { data: gym } = await supabase
    .from("gyms")
    .select("id, name")
    .eq("email", user.email ?? "")
    .single();

  if (!gym) {
    redirect("/admin/onboarding");
  }

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
          Communications
        </h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-400 mb-4">
            No challenge found. Create a challenge first to manage
            communications.
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

  const [tracksResult, tiersResult, participantsResult] = await Promise.all([
    supabase
      .from("tracks")
      .select("id, name, icon, color")
      .eq("challenge_id", challenge.id)
      .order("name"),
    supabase
      .from("tiers")
      .select("id, name")
      .eq("challenge_id", challenge.id)
      .order("name"),
    supabase
      .from("participants")
      .select("id, name, email, status, track_id, tier_id, tracks(name), tiers(name)")
      .eq("challenge_id", challenge.id)
      .eq("status", "active")
      .order("name"),
  ]);

  const tracks: Track[] = tracksResult.data ?? [];
  const tiers: Tier[] = tiersResult.data ?? [];
  const participants: Participant[] = (participantsResult.data ?? []).map(
    (p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      status: p.status,
      track_id: p.track_id,
      tier_id: p.tier_id,
      tracks: (Array.isArray(p.tracks) ? p.tracks[0] : p.tracks) as { name: string } | null,
      tiers: (Array.isArray(p.tiers) ? p.tiers[0] : p.tiers) as { name: string } | null,
    })
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
        <p className="text-gray-500 mt-1">
          {challenge.name} &middot; {participants.length} active participant
          {participants.length !== 1 ? "s" : ""}
        </p>
      </div>

      <CommsHub
        challengeName={challenge.name}
        tracks={tracks}
        tiers={tiers}
        participants={participants}
      />
    </div>
  );
}
