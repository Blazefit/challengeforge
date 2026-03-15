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
            <Link href="/admin/participants" className="text-gray-700 hover:text-red-600">Participants</Link>
            <Link href="/admin/leaderboard" className="text-gray-700 hover:text-red-600">Leaderboard</Link>
            <Link href="/admin/checkins" className="text-gray-700 hover:text-red-600">Check-Ins</Link>
            <Link href="/admin/communications" className="text-gray-700 hover:text-red-600">Comms</Link>
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
