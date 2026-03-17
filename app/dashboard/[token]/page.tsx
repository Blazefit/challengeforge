import { getParticipantByToken } from "@/lib/participant";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeLeaderboard, getStreak } from "@/lib/scoring";
import { notFound } from "next/navigation";
import Link from "next/link";
import PlanTabs from "./PlanTabs";
import AiFeedback from "./AiFeedback";
import InstallPrompt from "./InstallPrompt";
import Milestones from "./Milestones";
import ChallengeBanner from "./ChallengeBanner";

export default async function ParticipantDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const participant = await getParticipantByToken(token);
  if (!participant) notFound();

  const supabase = createAdminClient();
  const track = participant.tracks as { name: string; icon: string; color: string; scoring_direction: string } | null;
  const tier = participant.tiers as { name: string } | null;
  const challenge = participant.challenges as { id: string; name: string; start_date: string; end_date: string } | null;

  // Fetch this participant's checkins
  const { data: myCheckins } = await supabase
    .from("checkins")
    .select("*")
    .eq("participant_id", participant.id)
    .order("date", { ascending: false });

  const checkins = myCheckins || [];
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const checkedInToday = checkins.some((c: { date: string }) => c.date === today);

  // Streak
  const streak = getStreak(checkins.map((c: { date: string }) => c.date));

  // Weight info
  const intake = participant.intake_pre as { weight?: number; goal_weight?: number } | null;
  const startingWeight = intake?.weight || null;
  const latestWeightCheckin = checkins.find((c: { weight: number | null }) => c.weight != null);
  const currentWeight = latestWeightCheckin?.weight || startingWeight;
  const weightChange = startingWeight && currentWeight ? currentWeight - startingWeight : null;

  // Week/day calculation
  let weekNum = 1;
  let dayNum = 1;
  if (challenge) {
    const start = new Date(challenge.start_date);
    const now = new Date();
    const daysSinceStart = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
    weekNum = Math.floor(daysSinceStart / 7) + 1;
    dayNum = (daysSinceStart % 7) + 1;
  }

  // Leaderboard rank (quick calculation)
  let rank = "—";
  if (challenge) {
    const { data: allParticipants } = await supabase
      .from("participants")
      .select("id, name, intake_pre, tracks(name, icon, color, scoring_direction)")
      .eq("challenge_id", challenge.id)
      .eq("status", "active");

    if (allParticipants && allParticipants.length > 0) {
      const pIds = allParticipants.map((p: { id: string }) => p.id);
      const { data: allCheckins } = await supabase
        .from("checkins")
        .select("participant_id, date, weight, protein_hit, steps")
        .in("participant_id", pIds);

      const scored = computeLeaderboard(allParticipants as never[], allCheckins || [], challenge.start_date);
      const me = scored.find((s) => s.id === participant.id);
      if (me) rank = `#${me.rank} of ${scored.length}`;
    }
  }

  const consistency = challenge
    ? Math.min(100, Math.round((checkins.length / Math.max(1, Math.floor((Date.now() - new Date(challenge.start_date).getTime()) / 86400000))) * 100))
    : 0;

  const proteinCheckins = checkins.filter((c: { protein_hit: string | null }) => c.protein_hit != null);
  const proteinYes = proteinCheckins.filter((c: { protein_hit: string | null }) => c.protein_hit === "yes").length;
  const proteinAdherence = proteinCheckins.length > 0 ? Math.round((proteinYes / proteinCheckins.length) * 100) : 0;

  const weightChangePct = startingWeight && currentWeight
    ? Math.round(((currentWeight - startingWeight) / startingWeight) * 1000) / 10
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-5 border-b border-gray-800">
        <div className="max-w-lg mx-auto">
          <p className="text-gray-400 text-sm">{challenge?.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{track?.icon}</span>
            <span className="font-bold" style={{ color: track?.color }}>{track?.name}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400 text-sm">{tier?.name}</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">Week {weekNum}, Day {dayNum}</p>
        </div>
      </div>

      <ChallengeBanner
        challengeName={challenge?.name ?? "Challenge"}
        startDate={challenge?.start_date ?? ""}
        endDate={challenge?.end_date ?? ""}
        trackName={track?.name ?? ""}
        trackIcon={track?.icon ?? ""}
        trackColor={track?.color ?? ""}
      />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Post-Challenge Completion Screen */}
        {(() => {
          const now = new Date();
          const endDate = challenge?.end_date ? new Date(challenge.end_date + "T23:59:59") : null;
          const startDate = challenge?.start_date ? new Date(challenge.start_date + "T00:00:00") : null;
          const challengeEnded = endDate && now > endDate;
          const challengeNotStarted = startDate && now < startDate;

          if (challengeEnded) {
            return (
              <div className="bg-gradient-to-b from-green-900/30 to-gray-900 rounded-2xl border-2 border-green-700 p-6 text-center">
                <p className="text-5xl mb-3">&#127942;</p>
                <h2 className="text-2xl font-bold text-green-400 mb-2">Challenge Complete!</h2>
                <p className="text-gray-400 mb-1">You made it through {challenge?.name}.</p>
                <div className="grid grid-cols-3 gap-3 my-5">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xl font-bold text-white">{checkins.length}</p>
                    <p className="text-[10px] text-gray-500">Check-ins</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xl font-bold text-white">{consistency}%</p>
                    <p className="text-[10px] text-gray-500">Consistency</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xl font-bold text-white">{weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)}` : "—"}</p>
                    <p className="text-[10px] text-gray-500">Lbs Change</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link href={`/dashboard/${token}/progress`} className="flex-1 py-3 bg-green-700 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">View My Results</Link>
                  <Link href={`/dashboard/${token}/leaderboard`} className="flex-1 py-3 bg-gray-700 rounded-xl text-sm font-medium hover:bg-gray-600 transition-colors">Final Leaderboard</Link>
                </div>
                {participant.ai_post_program && (
                  <Link href={`/dashboard/${token}/progress`} className="block mt-3 text-sm text-green-400 hover:text-green-300">View Your Post-Program Transition Plan</Link>
                )}
              </div>
            );
          }

          if (challengeNotStarted) {
            const daysUntil = Math.ceil((startDate!.getTime() - now.getTime()) / 86400000);
            return (
              <div className="bg-gray-900 rounded-2xl border-2 border-yellow-700/50 p-6 text-center">
                <p className="text-4xl mb-3">&#9203;</p>
                <h2 className="text-xl font-bold text-yellow-400 mb-1">{daysUntil} Day{daysUntil !== 1 ? "s" : ""} Until Kickoff</h2>
                <p className="text-gray-400 text-sm mb-4">{challenge?.name} starts {challenge?.start_date}. Use this time to prepare!</p>
                <Link
                  href={`/dashboard/${token}/intake`}
                  className="block w-full py-4 bg-yellow-600 rounded-xl text-center font-bold hover:bg-yellow-700 transition-colors"
                >
                  Complete Your Intake Form
                </Link>
              </div>
            );
          }

          return null;
        })()}

        {/* Intake CTA (show if no intake data and challenge is active) */}
        {!intake?.weight && (() => {
          const now = new Date();
          const endDate = challenge?.end_date ? new Date(challenge.end_date + "T23:59:59") : null;
          const challengeEnded = endDate && now > endDate;
          if (challengeEnded) return null;
          return (
            <Link
              href={`/dashboard/${token}/intake`}
              className="block w-full p-4 rounded-xl text-center font-medium bg-yellow-900/30 border-2 border-yellow-700 text-yellow-400 hover:bg-yellow-900/50 transition-colors"
            >
              Complete Your Intake Form
              <span className="block text-xs text-yellow-500 mt-1">Required before your first check-in</span>
            </Link>
          );
        })()}

        {/* Check-in CTA (only during active challenge) */}
        {(() => {
          const now = new Date();
          const startDate = challenge?.start_date ? new Date(challenge.start_date + "T00:00:00") : null;
          const endDate = challenge?.end_date ? new Date(challenge.end_date + "T23:59:59") : null;
          const isActive = (!startDate || now >= startDate) && (!endDate || now <= endDate);
          if (!isActive) return null;
          return (
            <Link
              href={`/dashboard/${token}/checkin`}
              className={`block w-full p-5 rounded-xl text-center font-bold text-lg transition-all ${
                checkedInToday
                  ? "bg-green-900/30 border-2 border-green-700 text-green-400"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {checkedInToday ? (
                <>&#10003; Checked In Today</>
              ) : (
                <>Check In Now</>
              )}
            </Link>
          );
        })()}

        {/* Streak */}
        {streak > 0 && (
          <div className="text-center text-sm text-orange-400">
            &#128293; {streak} day streak
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{currentWeight || "—"}</p>
            <p className="text-xs text-gray-500">Current (lbs)</p>
            {weightChange !== null && (
              <p className={`text-xs mt-1 ${weightChange > 0 ? "text-red-400" : weightChange < 0 ? "text-green-400" : "text-gray-500"}`}>
                {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)}
              </p>
            )}
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{consistency}%</p>
            <p className="text-xs text-gray-500">Consistency</p>
          </div>
          <Link href={`/dashboard/${token}/leaderboard`} className="bg-gray-900 rounded-xl p-4 text-center hover:bg-gray-800 transition-colors">
            <p className="text-2xl font-bold">{rank}</p>
            <p className="text-xs text-gray-500">Rank</p>
          </Link>
        </div>

        {/* Milestones */}
        <Milestones
          checkinCount={checkins.length}
          streak={streak}
          weightChangePct={weightChangePct}
          consistency={consistency}
          proteinAdherence={proteinAdherence}
        />

        {/* Goal Progress */}
        {startingWeight && intake?.goal_weight && (
          (() => {
            const goalWeight = intake.goal_weight!;
            const gainIsGood = track?.scoring_direction === "gain";
            const displayCurrent = currentWeight || startingWeight;
            const totalDistance = Math.abs(goalWeight - startingWeight);
            const traveled = gainIsGood
              ? displayCurrent - startingWeight
              : startingWeight - displayCurrent;
            const progressPct = totalDistance > 0
              ? Math.max(0, Math.min(100, Math.round((traveled / totalDistance) * 100)))
              : 0;
            const remaining = gainIsGood
              ? Math.max(0, goalWeight - displayCurrent)
              : Math.max(0, displayCurrent - goalWeight);
            const reachedGoal = remaining === 0;
            const barColor = reachedGoal
              ? "bg-green-500"
              : gainIsGood
                ? "bg-blue-500"
                : "bg-orange-500";
            const accentColor = reachedGoal
              ? "text-green-400"
              : gainIsGood
                ? "text-blue-400"
                : "text-orange-400";

            return (
              <div className="bg-gray-900 rounded-xl p-5">
                <h2 className="font-bold mb-3 flex items-center gap-2">
                  <span>&#127919;</span> Goal Progress
                </h2>

                {/* Weight labels */}
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{startingWeight} lbs</span>
                  <span className="font-semibold text-white">{displayCurrent} lbs</span>
                  <span>{goalWeight} lbs</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div
                    className={`${barColor} h-4 rounded-full transition-all duration-500`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Labels under bar */}
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>Start</span>
                  <span>Goal</span>
                </div>

                {/* Stats row */}
                <div className="flex justify-between mt-4">
                  <div className="text-center">
                    <p className={`text-xl font-bold ${accentColor}`}>{progressPct}%</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Complete</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xl font-bold ${accentColor}`}>{remaining.toFixed(1)}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Lbs to go</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xl font-bold ${accentColor}`}>
                      {gainIsGood ? "+" : "-"}{Math.abs(goalWeight - startingWeight)} lbs
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Goal</p>
                  </div>
                </div>

                {/* Motivational message */}
                <p className="text-center text-xs text-gray-500 mt-3">
                  {reachedGoal
                    ? "You made it! Goal reached!"
                    : progressPct >= 75
                      ? "Almost there -- keep pushing!"
                      : progressPct >= 50
                        ? "Over halfway! Stay locked in."
                        : progressPct >= 25
                          ? "Great momentum -- keep going!"
                          : "Every day gets you closer. Stay consistent!"}
                </p>
              </div>
            );
          })()
        )}

        {/* Invoice / Payment Status */}
        {participant.invoice_amount_cents != null && (
          <div
            className={`rounded-xl p-4 border ${
              participant.payment_status === "paid"
                ? "bg-green-900/20 border-green-700"
                : "bg-yellow-900/20 border-yellow-700"
            }`}
          >
            {participant.payment_status === "paid" ? (
              <p className="text-green-400 font-medium text-sm">
                Payment: ${(participant.invoice_amount_cents / 100).toFixed(2)} — Paid &#10003;
              </p>
            ) : (
              <p className="text-yellow-400 font-medium text-sm">
                Invoice: ${(participant.invoice_amount_cents / 100).toFixed(2)} — Payment pending. You&apos;ll be invoiced through your Wodify account.
              </p>
            )}
          </div>
        )}

        {/* My Plan */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="font-bold mb-3">My Plan</h2>
          {participant.ai_nutrition_plan || participant.ai_training_plan ? (
            <PlanTabs
              nutritionPlan={participant.ai_nutrition_plan ?? "No nutrition plan available yet."}
              trainingPlan={participant.ai_training_plan ?? "No training plan available yet."}
            />
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto mb-3 h-10 w-10 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
              <p className="text-gray-400 font-medium">Your personalized plan is being prepared</p>
              <p className="text-gray-500 text-sm mt-1">Your coach will generate your custom nutrition and training plan based on your profile. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Track Tips */}
        {track && (
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="font-bold mb-2 flex items-center gap-2">
              <span>{track.icon}</span>
              <span>{track.name} Tips</span>
            </h2>
            <p className="text-sm text-gray-400">
              {track.name === "Hard Gainer"
                ? "Focus on calorie surplus, heavy compound lifts, and recovery"
                : track.name === "Last 10"
                ? "Hit your step goal daily, stay in a calorie deficit, prioritize protein"
                : track.name === "Transformer"
                ? "Balance is key \u2014 moderate deficit, consistent training, track your macros"
                : `Stay consistent with your ${track.name} track goals`}
            </p>
          </div>
        )}

        {/* Recent Check-ins */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="font-bold mb-3">Recent Check-ins</h2>
          {checkins.length === 0 ? (
            <p className="text-gray-500 text-sm">No check-ins yet. Start today!</p>
          ) : (
            <div className="space-y-2">
              {checkins.slice(0, 5).map((c: { date: string; weight: number | null; protein_hit: string | null; trained: string | null; recovery_score: number | null; ai_feedback: string | null }) => (
                <div key={c.date}>
                  <div className="flex items-center justify-between text-sm border-b border-gray-800 pb-2">
                    <span className="text-gray-400">{c.date}</span>
                    <div className="flex gap-3 text-xs">
                      {c.weight && <span>{c.weight} lbs</span>}
                      {c.protein_hit && (
                        <span className={c.protein_hit === "yes" ? "text-green-400" : c.protein_hit === "close" ? "text-yellow-400" : "text-red-400"}>
                          P: {c.protein_hit}
                        </span>
                      )}
                      {c.trained && (
                        <span className={c.trained === "yes" ? "text-green-400" : c.trained === "rest_day" ? "text-yellow-400" : "text-red-400"}>
                          T: {c.trained}
                        </span>
                      )}
                      {c.recovery_score && <span className="text-gray-400">R: {c.recovery_score}</span>}
                    </div>
                  </div>
                  {c.ai_feedback && <AiFeedback feedback={c.ai_feedback} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex gap-3">
          <Link href={`/dashboard/${token}/progress`} className="flex-1 text-center py-3 bg-gray-800 rounded-xl text-sm text-gray-300 hover:bg-gray-700">My Progress</Link>
          <Link href={`/dashboard/${token}/leaderboard`} className="flex-1 text-center py-3 bg-gray-800 rounded-xl text-sm text-gray-300 hover:bg-gray-700">Leaderboard</Link>
          <Link href={`/dashboard/${token}/checkin`} className="flex-1 text-center py-3 bg-gray-800 rounded-xl text-sm text-gray-300 hover:bg-gray-700">Check In</Link>
        </div>
      </div>
      <InstallPrompt />
    </div>
  );
}
