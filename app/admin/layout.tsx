export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <span className="text-xl font-bold text-red-600">ChallengeForge</span>
          <div className="flex gap-6 text-sm">
            <a href="/admin/dashboard" className="text-gray-700 hover:text-red-600">Dashboard</a>
            <a href="/admin/participants" className="text-gray-700 hover:text-red-600">Participants</a>
            <a href="/admin/leaderboard" className="text-gray-700 hover:text-red-600">Leaderboard</a>
            <a href="/admin/checkins" className="text-gray-700 hover:text-red-600">Check-Ins</a>
            <a href="/admin/communications" className="text-gray-700 hover:text-red-600">Comms</a>
            <a href="/admin/marketing" className="text-gray-700 hover:text-red-600">Marketing</a>
            <a href="/admin/settings" className="text-gray-700 hover:text-red-600">Settings</a>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
