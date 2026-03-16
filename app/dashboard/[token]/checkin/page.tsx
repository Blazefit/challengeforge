import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import CheckinForm from "./checkin-form";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Look up participant by magic link token
  const { data: participant, error: pError } = await supabase
    .from("participants")
    .select("*")
    .eq("magic_link_token", token)
    .single();

  if (pError || !participant) {
    notFound();
  }

  // Fetch track, tier, and last checkin in parallel
  const [trackRes, tierRes, lastCheckinRes] = await Promise.all([
    supabase
      .from("tracks")
      .select("name")
      .eq("id", participant.track_id)
      .single(),
    supabase
      .from("tiers")
      .select("name, ai_daily_coaching")
      .eq("id", participant.tier_id)
      .single(),
    supabase
      .from("checkins")
      .select("weight")
      .eq("participant_id", participant.id)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const track = trackRes.data;
  const tier = tierRes.data;

  if (!track || !tier) {
    notFound();
  }

  const lastWeight =
    lastCheckinRes.data?.weight || participant.intake_pre?.weight || null;

  // Determine if Elite tier (has ai_daily_coaching)
  const isElite = tier.ai_daily_coaching === true;

  // Extract protein target from intake_post if available
  const intakePost = participant.intake_post as Record<string, unknown> | null;
  const proteinTarget =
    intakePost && typeof intakePost.protein_target === "string"
      ? intakePost.protein_target
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <Link
            href={`/dashboard/${token}`}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &larr;
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Daily Check-In</h1>
        </div>

        {/* Form */}
        <div className="px-4 py-6">
          <CheckinForm
            token={token}
            participantId={participant.id}
            lastWeight={lastWeight}
            proteinTarget={proteinTarget}
            isElite={isElite}
            trackName={track.name}
          />
        </div>
      </div>
    </div>
  );
}
