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
    .select("id, name")
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

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/signup");
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/participants", label: "Participants", badge: badges.unpaid > 0 ? badges.unpaid : null },
    { href: "/admin/checkins", label: "Check-Ins", badge: badges.missingCheckins > 0 ? badges.missingCheckins : null },
    { href: "/admin/leaderboard", label: "Leaderboard" },
    { href: "/admin/communications", label: "Comms" },
    { href: "/admin/marketing", label: "Marketing" },
    { href: "/admin/reports", label: "Reports", badge: badges.atRisk > 0 ? badges.atRisk : null },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Navigation */}
      <nav className="ma-glass sticky top-0 z-50" style={{ borderBottom: "1px solid rgba(70, 69, 84, 0.15)" }}>
        <div className="flex items-center justify-between max-w-[1400px] mx-auto px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <span className="font-display text-lg font-bold" style={{ background: "var(--brand-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                ChallengeForge
              </span>
              {gym?.name && (
                <span className="text-xs font-medium" style={{ color: "var(--on-surface-muted)" }}>
                  {gym.name}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-3 py-2 text-sm font-medium transition-colors hover:text-white"
                  style={{ color: "var(--on-surface-variant)", borderRadius: "var(--radius-sm)" }}
                >
                  {item.label}
                  {item.badge && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: "var(--tertiary-container)", borderRadius: "var(--radius-full)", fontSize: "0.6rem" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="text-xs font-medium transition-colors hover:text-white"
              style={{ color: "var(--on-surface-muted)" }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
