import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get gym for this user
  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("email", user.email ?? "")
    .single();

  if (!gym) {
    return NextResponse.json({ error: "No gym found" }, { status: 404 });
  }

  // Get the first challenge for this gym
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, start_date")
    .eq("gym_id", gym.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challenge) {
    return NextResponse.json({ error: "No challenge found" }, { status: 404 });
  }

  const challengeId = challenge.id;

  // Fetch all participants with track/tier joins
  const { data: participants } = await supabase
    .from("participants")
    .select("*, tracks(name), tiers(name)")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: false });

  if (!participants || participants.length === 0) {
    return NextResponse.json(
      { error: "No participants found" },
      { status: 404 }
    );
  }

  const participantIds = participants.map((p) => p.id);

  // Fetch all checkins for those participants
  const { data: checkins } = await supabase
    .from("checkins")
    .select("participant_id, date, weight")
    .in("participant_id", participantIds);

  const allCheckins = checkins ?? [];

  // Compute enriched data

  const headers = [
    "Name",
    "Email",
    "Phone",
    "Track",
    "Tier",
    "Status",
    "Payment Status",
    "Starting Weight",
    "Current Weight",
    "Weight Change",
    "Total Check-ins",
    "Last Check-in Date",
  ];

  const rows = participants.map((p) => {
    const pCheckins = allCheckins
      .filter((c) => c.participant_id === p.id)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    const lastCheckin = pCheckins.length
      ? pCheckins[pCheckins.length - 1]
      : null;
    const lastCheckinDate = lastCheckin ? lastCheckin.date : null;
    const latestWeight = lastCheckin?.weight ?? null;

    // First weight: from intake_pre.weight or first checkin with weight
    const intakeWeight =
      p.intake_pre && typeof p.intake_pre === "object"
        ? (p.intake_pre as Record<string, unknown>).weight
        : null;
    const firstCheckinWeight = pCheckins.find((c) => c.weight != null)?.weight;
    const firstWeight =
      intakeWeight != null ? Number(intakeWeight) : firstCheckinWeight ?? null;

    const weightChange =
      latestWeight != null && firstWeight != null
        ? Math.round((latestWeight - firstWeight) * 10) / 10
        : null;

    const totalCheckins = pCheckins.length;

    const phone = p.phone ?? "";

    return [
      p.name,
      p.email,
      phone,
      p.tracks?.name ?? "",
      p.tiers?.name ?? "",
      p.status ?? "",
      (p.payment_status as string) ?? "unpaid",
      firstWeight,
      latestWeight,
      weightChange,
      totalCheckins,
      lastCheckinDate,
    ].map(escapeCSV);
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="participants-${today}.csv"`,
    },
  });
}
