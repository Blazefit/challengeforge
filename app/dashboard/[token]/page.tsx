import { createAdminClient } from "@/lib/supabase/admin";
import { calculateStreak } from "@/lib/streak";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ParticipantData {
  id: string;
  name: string;
  intake_pre: { weight?: number; goal_weight?: number };
  intake_post: Record<string, unknown> | null;
  ai_nutrition_plan: string | null;
  ai_training_plan: string | null;
  ai_meal_plan: string | null;
  profile_completed: boolean;
  challenge_id: string;
  track_id: string;
  tier_id: string;
  magic_link_token: string;
}

interface ChallengeData {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface TrackData {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface TierData {
  id: string;
  name: string;
  ai_daily_coaching: boolean;
}

interface CheckinData {
  id: string;
  date: string;
  weight: number | null;
  created_at: string;
}

function getWeekDay(startDate: string): {
  week: number;
  day: number;
  totalElapsed: number;
} {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = now.getTime() - start.getTime();
  const totalElapsed = Math.max(
    1,
    Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
  );
  const week = Math.ceil(totalElapsed / 7);
  const day = ((totalElapsed - 1) % 7) + 1;
  return { week, day, totalElapsed };
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function getTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderMarkdown(md: string): string {
  return md
    .replace(
      /^### (.+)$/gm,
      '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>'
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>'
    )
    .replace(
      /^# (.+)$/gm,
      '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>'
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, "<br/><br/>");
}

export default async function ParticipantDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const successMessage =
    query.success === "checkin" ? "Check-in recorded!" : null;

  const supabase = createAdminClient();

  // Look up participant by magic link token
  const { data: participant, error: pError } = await supabase
    .from("participants")
    .select("*")
    .eq("magic_link_token", token)
    .single<ParticipantData>();

  if (pError || !participant) {
    notFound();
  }

  // Fetch challenge, track, tier, checkins in parallel
  const [challengeRes, trackRes, tierRes, checkinsRes] = await Promise.all([
    supabase
      .from("challenges")
      .select("*")
      .eq("id", participant.challenge_id)
      .single<ChallengeData>(),
    supabase
      .from("tracks")
      .select("*")
      .eq("id", participant.track_id)
      .single<TrackData>(),
    supabase
      .from("tiers")
      .select("*")
      .eq("id", participant.tier_id)
      .single<TierData>(),
    supabase
      .from("checkins")
      .select("*")
      .eq("participant_id", participant.id)
      .order("date", { ascending: false })
      .limit(100),
  ]);

  const challenge = challengeRes.data;
  const track = trackRes.data;
  const tier = tierRes.data;
  const checkins = (checkinsRes.data || []) as CheckinData[];

  if (!challenge || !track || !tier) {
    notFound();
  }

  const { week, day, totalElapsed } = getWeekDay(challenge.start_date);
  const daysRemaining = getDaysRemaining(challenge.end_date);
  const todayStr = getTodayStr();
  const todayCheckin = checkins.find((c) => c.date === todayStr);
  const streak = await calculateStreak(supabase, participant.id);

  // Weight calculations
  const startingWeight = participant.intake_pre?.weight || null;
  const latestCheckinWithWeight = checkins.find((c) => c.weight !== null);
  const currentWeight = latestCheckinWithWeight?.weight || startingWeight;
  const weightChange =
    startingWeight && currentWeight ? currentWeight - startingWeight : null;

  // Consistency
  const checkinCount = checkins.length;
  const consistency =
    totalElapsed > 0 ? Math.round((checkinCount / totalElapsed) * 100) : 0;

  // Active tab from URL or default
  const activeTab = query.tab || "nutrition";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        {/* Success banner */}
        {successMessage && (
          <div className="bg-green-500 text-white text-center py-3 px-4 font-medium">
            {successMessage}
          </div>
        )}

        {/* Header */}
        <div className="bg-white border-b px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{challenge.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: track.color }}
            >
              {track.icon} {track.name}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white">
              {tier.name}
            </span>
            <span className="text-sm text-gray-500 ml-auto">
              Week {week} Day {day}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {daysRemaining} days remaining
          </p>
        </div>

        {/* Profile completion banner */}
        {!participant.profile_completed && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mx-4 mt-4 rounded">
            <p className="text-sm text-amber-800">
              Complete your profile for a more personalized plan.
            </p>
          </div>
        )}

        {/* Today's Action */}
        <div className="px-4 pt-6 pb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {"Today's Action"}
          </h2>
          {todayCheckin ? (
            <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-5 text-center">
              <div className="text-4xl mb-2">&#10003;</div>
              <p className="text-green-700 font-semibold text-lg">
                Checked In
              </p>
              <p className="text-green-600 text-sm mt-1">
                {new Date(todayCheckin.created_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ) : (
            <Link
              href={`/dashboard/${token}/checkin`}
              className="block bg-red-500 hover:bg-red-600 text-white rounded-2xl p-5 text-center transition-colors"
            >
              <p className="text-2xl font-bold">Check In Now</p>
              <p className="text-red-200 text-sm mt-1">
                {"Complete today's check-in"}
              </p>
            </Link>
          )}
          {/* Streak */}
          {streak > 0 && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1 text-orange-500 font-semibold">
                <span className="text-xl">&#128293;</span>
                {streak} day streak
              </span>
            </div>
          )}
        </div>

        {/* My Scores */}
        <div className="px-4 pb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            My Scores
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border">
              <p className="text-2xl font-bold text-gray-900">#--</p>
              <p className="text-xs text-gray-500 mt-1">Rank</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border">
              <p className="text-2xl font-bold text-gray-900">
                {weightChange !== null
                  ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)}`
                  : "--"}
              </p>
              <p className="text-xs text-gray-500 mt-1">lbs change</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border">
              <p className="text-2xl font-bold text-gray-900">
                {consistency}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Consistency</p>
            </div>
          </div>
        </div>

        {/* My Plan */}
        <div className="px-4 pb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            My Plan
          </h2>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b overflow-x-auto">
              {[
                { key: "nutrition", label: "Nutrition Plan" },
                { key: "training", label: "Training Plan" },
                { key: "grocery", label: "Grocery List" },
              ].map((tab) => (
                <Link
                  key={tab.key}
                  href={`/dashboard/${token}?tab=${tab.key}`}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            {/* Tab content */}
            <div className="p-4">
              {activeTab === "nutrition" &&
                (participant.ai_nutrition_plan ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(participant.ai_nutrition_plan),
                    }}
                  />
                ) : (
                  <PlanPlaceholder />
                ))}
              {activeTab === "training" &&
                (participant.ai_training_plan ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(participant.ai_training_plan),
                    }}
                  />
                ) : (
                  <PlanPlaceholder />
                ))}
              {activeTab === "grocery" &&
                (participant.ai_meal_plan ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(participant.ai_meal_plan),
                    }}
                  />
                ) : (
                  <PlanPlaceholder />
                ))}
            </div>
          </div>
        </div>

        {/* My Progress */}
        <div className="px-4 pb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            My Progress
          </h2>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Starting</p>
                <p className="text-lg font-bold">
                  {startingWeight ? `${startingWeight} lbs` : "--"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current</p>
                <p className="text-lg font-bold">
                  {currentWeight ? `${currentWeight} lbs` : "--"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Change</p>
                <p
                  className={`text-lg font-bold ${
                    weightChange !== null && weightChange < 0
                      ? "text-green-600"
                      : weightChange !== null && weightChange > 0
                        ? "text-red-600"
                        : ""
                  }`}
                >
                  {weightChange !== null
                    ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} lbs`
                    : "--"}
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/${token}/progress`}
              className="block text-center text-sm text-red-500 font-medium mt-4 hover:text-red-600"
            >
              View full progress &rarr;
            </Link>
          </div>
        </div>

        {/* Messages */}
        <div className="px-4 pb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Messages
          </h2>
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center text-gray-400 text-sm">
            No messages yet. Coach notes will appear here.
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanPlaceholder() {
  return (
    <div className="text-center py-6">
      <div className="text-3xl mb-2">&#9881;</div>
      <p className="text-gray-500 text-sm">Your plan is being generated...</p>
      <p className="text-gray-400 text-xs mt-1">Check back soon!</p>
    </div>
  );
}
