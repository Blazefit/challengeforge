export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signup");
  }

  // Get gym and active challenge
  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("email", user.email ?? "")
    .single();

  const badges = { missingCheckins: 0, unpaid: 0, atRisk: 0 };

  if (gym) {
    const { data: challenge } = await supabase
      .from("challenges")
      .select("id")
      .eq("gym_id", gym.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (challenge) {
      const { data: participants } = await supabase
        .from("participants")
        .select("id, payment_status")
        .eq("challenge_id", challenge.id)
        .eq("status", "active");

      const active = participants ?? [];
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

      const { data: todayCheckins } = await supabase
        .from("checkins")
        .select("participant_id")
        .eq("date", today)
        .in("participant_id", active.map(p => p.id));

      const checkedInIds = new Set((todayCheckins ?? []).map(c => c.participant_id));
      badges.missingCheckins = active.filter(p => !checkedInIds.has(p.id)).length;
      badges.unpaid = active.filter(p => p.payment_status !== "paid").length;

      // At-risk: fetch all checkins to find who hasn't checked in 2+ days
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toLocaleDateString("en-CA", { timeZone: "America/New_York" });

      const { data: recentCheckins } = await supabase
        .from("checkins")
        .select("participant_id, date")
        .in("participant_id", active.map(p => p.id))
        .gte("date", twoDaysAgoStr);

      const recentIds = new Set((recentCheckins ?? []).map(c => c.participant_id));
      badges.atRisk = active.filter(p => !recentIds.has(p.id)).length;
    }
  }

  // Sign out action
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/signup");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/admin/dashboard" className="text-xl font-bold text-red-600">ChallengeForge</Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/admin/dashboard" className="text-gray-700 hover:text-red-600">Dashboard</Link>
            <Link href="/admin/challenges/new" className="text-gray-700 hover:text-red-600">New Challenge</Link>
            <Link href="/admin/participants" className="text-gray-700 hover:text-red-600 flex items-center gap-1">
              Participants
              {badges.unpaid > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {badges.unpaid}
                </span>
              )}
            </Link>
            <Link href="/admin/leaderboard" className="text-gray-700 hover:text-red-600">Leaderboard</Link>
            <Link href="/admin/checkins" className="text-gray-700 hover:text-red-600 flex items-center gap-1">
              Check-Ins
              {badges.missingCheckins > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {badges.missingCheckins}
                </span>
              )}
            </Link>
            <Link href="/admin/communications" className="text-gray-700 hover:text-red-600">Comms</Link>
            <Link href="/admin/reports" className="text-gray-700 hover:text-red-600 flex items-center gap-1">
              Reports
              {badges.atRisk > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {badges.atRisk}
                </span>
              )}
            </Link>
            <Link href="/admin/marketing" className="text-gray-700 hover:text-red-600">Marketing</Link>
            <Link href="/admin/settings" className="text-gray-700 hover:text-red-600">Settings</Link>
            <form action={signOut}>
              <button type="submit" className="text-gray-400 hover:text-red-600">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
