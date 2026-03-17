import { getParticipantByToken } from "@/lib/participant";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import CheckinForm from "./CheckinForm";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const participant = await getParticipantByToken(token);
  if (!participant) notFound();

  const supabase = createAdminClient();
  const track = participant.tracks as { name: string; icon: string; color: string } | null;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  // Get today's existing checkin if any
  const { data: existing } = await supabase
    .from("checkins")
    .select("*")
    .eq("participant_id", participant.id)
    .eq("date", today)
    .single();

  // Get last weight for reference
  const { data: lastCheckin } = await supabase
    .from("checkins")
    .select("weight")
    .eq("participant_id", participant.id)
    .not("weight", "is", null)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const tier = participant.tiers as { name: string } | null;
  const challenge = participant.challenges as { start_date: string; end_date: string } | null;
  const intake = participant.intake_pre as { weight?: number; age?: number; sex?: string; height?: string } | null;
  const lastWeight = lastCheckin?.weight || intake?.weight || null;
  const isLastTenTrack = track?.name === "Last 10";
  const isElite = tier?.name?.toLowerCase() === "the elite";

  // Check challenge date boundaries
  const challengeNotStarted = challenge?.start_date && today < challenge.start_date;
  const challengeEnded = challenge?.end_date && today > challenge.end_date;

  // Check intake completion (minimum required fields)
  const intakeIncomplete = !intake?.weight || !intake?.age || !intake?.sex || !intake?.height;

  if (challengeNotStarted) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-5xl mb-4">&#128197;</p>
          <h1 className="text-xl font-bold mb-2">Challenge Hasn&apos;t Started Yet</h1>
          <p className="text-gray-400 mb-2">Check-ins open on <span className="text-white font-semibold">{challenge.start_date}</span></p>
          <p className="text-gray-500 text-sm mb-6">Use this time to complete your intake form and get familiar with your dashboard.</p>
          <a href={`/dashboard/${token}`} className="inline-block px-6 py-3 bg-red-600 rounded-xl font-medium hover:bg-red-700 transition-colors">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  if (challengeEnded) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-5xl mb-4">&#127942;</p>
          <h1 className="text-xl font-bold mb-2">Challenge Complete!</h1>
          <p className="text-gray-400 mb-2">The challenge ended on <span className="text-white font-semibold">{challenge.end_date}</span></p>
          <p className="text-gray-500 text-sm mb-6">Check-ins are now closed. Visit your dashboard to see your final results.</p>
          <a href={`/dashboard/${token}`} className="inline-block px-6 py-3 bg-red-600 rounded-xl font-medium hover:bg-red-700 transition-colors">View My Results</a>
        </div>
      </div>
    );
  }

  if (intakeIncomplete) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-5xl mb-4">&#128203;</p>
          <h1 className="text-xl font-bold mb-2">Complete Your Intake First</h1>
          <p className="text-gray-400 mb-2">We need your basic info before you can check in.</p>
          <p className="text-gray-500 text-sm mb-6">Fill in your weight, age, sex, and height — takes less than a minute.</p>
          <a href={`/dashboard/${token}/intake`} className="inline-block px-6 py-3 bg-yellow-600 rounded-xl font-medium hover:bg-yellow-700 transition-colors">Complete Intake Form</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-4 border-b border-gray-800">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Daily Check-in</p>
            <p className="text-xs text-gray-500">{today}</p>
          </div>
          <a href={`/dashboard/${token}`} className="text-gray-400 text-sm hover:text-white">&larr; Dashboard</a>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6">
        <CheckinForm
          token={token}
          lastWeight={lastWeight}
          showSteps={isLastTenTrack}
          isElite={isElite}
          participantId={participant.id}
          existing={existing ? {
            weight: existing.weight,
            protein_hit: existing.protein_hit,
            trained: existing.trained,
            steps: existing.steps,
            recovery_score: existing.recovery_score,
            notes: existing.notes,
            meal_photo_url: existing.meal_photo_url,
          } : null}
        />
      </div>
    </div>
  );
}
