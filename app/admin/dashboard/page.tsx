import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ActivityFeed from "./ActivityFeed";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: gym } = await supabase
    .from("gyms")
    .select("*")
    .eq("email", user?.email ?? "")
    .single();

  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, name, slug, status, start_date, end_date")
    .order("created_at", { ascending: false });

  // Get today's stats for the active challenge
  const activeChallenge = challenges?.find((c) => c.status === "active") ?? challenges?.[0];
  let todayStats = { enrolled: 0, checkedIn: 0, unpaid: 0, withoutPlans: 0 };

  if (activeChallenge) {
    const { data: participants } = await supabase
      .from("participants")
      .select("id, status, payment_status, ai_nutrition_plan")
      .eq("challenge_id", activeChallenge.id);

    const active = (participants ?? []).filter((p) => p.status === "active");
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    const { data: todayCheckins } = await supabase
      .from("checkins")
      .select("participant_id")
      .eq("date", today)
      .in("participant_id", active.map((p) => p.id));

    const checkedInIds = new Set((todayCheckins ?? []).map((c) => c.participant_id));

    todayStats = {
      enrolled: active.length,
      checkedIn: checkedInIds.size,
      unpaid: active.filter((p) => p.payment_status !== "paid").length,
      withoutPlans: active.filter((p) => !p.ai_nutrition_plan).length,
    };
  }

  // Days until challenge starts or ends
  let countdownLabel = "";
  let countdownDays = 0;
  if (activeChallenge) {
    const now = new Date();
    const start = new Date(activeChallenge.start_date + "T00:00:00");
    const end = new Date(activeChallenge.end_date + "T00:00:00");
    if (now < start) {
      countdownDays = Math.ceil((start.getTime() - now.getTime()) / 86400000);
      countdownLabel = "until kickoff";
    } else if (now <= end) {
      countdownDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      countdownLabel = "remaining";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {gym && (
            <p className="text-gray-500 mt-1">Welcome back, {gym.name}</p>
          )}
        </div>
        <Link
          href="/admin/challenges/new"
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          + New Challenge
        </Link>
      </div>

      {!gym && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-yellow-800 mb-1">Complete Your Setup</h2>
          <p className="text-yellow-700 text-sm mb-3">
            Finish setting up your gym profile to get started.
          </p>
          <Link
            href="/admin/onboarding"
            className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
          >
            Complete Onboarding
          </Link>
        </div>
      )}

      {/* Today's Stats */}
      {activeChallenge && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Checked In Today</p>
            <p className="text-3xl font-bold text-gray-900">
              {todayStats.checkedIn}
              <span className="text-lg font-normal text-gray-400">/{todayStats.enrolled}</span>
            </p>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${todayStats.enrolled > 0 && todayStats.checkedIn === todayStats.enrolled ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${todayStats.enrolled > 0 ? (todayStats.checkedIn / todayStats.enrolled) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Total Enrolled</p>
            <p className="text-3xl font-bold text-gray-900">{todayStats.enrolled}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Unpaid</p>
            <p className={`text-3xl font-bold ${todayStats.unpaid > 0 ? "text-yellow-600" : "text-green-600"}`}>
              {todayStats.unpaid}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            {countdownLabel ? (
              <>
                <p className="text-sm text-gray-500 mb-1">
                  {countdownDays === 0 ? "Today!" : `Days ${countdownLabel}`}
                </p>
                <p className="text-3xl font-bold text-red-600">{countdownDays}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-1">Without Plans</p>
                <p className={`text-3xl font-bold ${todayStats.withoutPlans > 0 ? "text-orange-600" : "text-green-600"}`}>
                  {todayStats.withoutPlans}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {activeChallenge && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Link href="/admin/checkins" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:bg-gray-50 transition-colors text-center">
            <p className="text-2xl mb-1">&#128203;</p>
            <p className="text-sm font-medium text-gray-900">Check-Ins</p>
          </Link>
          <Link href="/admin/participants" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:bg-gray-50 transition-colors text-center">
            <p className="text-2xl mb-1">&#128101;</p>
            <p className="text-sm font-medium text-gray-900">Participants</p>
          </Link>
          <Link href="/admin/leaderboard" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:bg-gray-50 transition-colors text-center">
            <p className="text-2xl mb-1">&#127942;</p>
            <p className="text-sm font-medium text-gray-900">Leaderboard</p>
          </Link>
          <Link href="/admin/communications" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:bg-gray-50 transition-colors text-center">
            <p className="text-2xl mb-1">&#128172;</p>
            <p className="text-sm font-medium text-gray-900">Comms</p>
          </Link>
        </div>
      )}

      {/* Challenges List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Your Challenges</h2>
        </div>

        {!challenges || challenges.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 mb-4">No challenges yet. Create your first one!</p>
            <Link
              href="/admin/challenges/new"
              className="inline-block bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Create Challenge
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {challenges.map((c) => (
              <Link
                key={c.id}
                href={`/admin/challenges/${c.id}`}
                className="block px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{c.name}</h3>
                  <p className="text-sm text-gray-500">
                    /c/{c.slug} &middot; {c.start_date} to {c.end_date}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    c.status === "active"
                      ? "bg-green-100 text-green-700"
                      : c.status === "completed"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <ActivityFeed initialItems={[]} />
    </div>
  );
}
