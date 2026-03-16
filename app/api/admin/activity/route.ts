import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface ActivityItem {
  type: "checkin" | "signup" | "plan";
  name: string;
  track: string | null;
  trackColor: string | null;
  time: string;
  detail: string;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get gym's active challenge
  const { data: gym } = await supabase
    .from("gyms").select("id").eq("email", user.email ?? "").single();
  if (!gym) return NextResponse.json([]);

  const { data: challenge } = await supabase
    .from("challenges").select("id").eq("gym_id", gym.id)
    .order("created_at", { ascending: false }).limit(1).single();
  if (!challenge) return NextResponse.json([]);

  // Get recent checkins (last 24 hours)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString();

  const { data: recentCheckins } = await supabase
    .from("checkins")
    .select("created_at, weight, participants(name, tracks(name, color))")
    .gte("created_at", yesterdayStr)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get recent signups (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();

  const { data: recentSignups } = await supabase
    .from("participants")
    .select("name, created_at, tracks(name, color)")
    .eq("challenge_id", challenge.id)
    .gte("created_at", weekAgoStr)
    .order("created_at", { ascending: false })
    .limit(5);

  // Build activity items, sort by time, return top 10
  const items: ActivityItem[] = [];

  for (const c of recentCheckins ?? []) {
    const p = c.participants as unknown as { name: string; tracks: { name: string; color: string } | null } | null;
    items.push({
      type: "checkin",
      name: p?.name ?? "Unknown",
      track: p?.tracks?.name ?? null,
      trackColor: p?.tracks?.color ?? null,
      time: c.created_at,
      detail: c.weight ? `${c.weight} lbs` : "No weight",
    });
  }

  for (const s of recentSignups ?? []) {
    const track = s.tracks as unknown as { name: string; color: string } | null;
    items.push({
      type: "signup",
      name: s.name,
      track: track?.name ?? null,
      trackColor: track?.color ?? null,
      time: s.created_at,
      detail: "New signup",
    });
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return NextResponse.json(items.slice(0, 10));
}
