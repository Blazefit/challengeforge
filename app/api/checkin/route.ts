import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

function shouldAutoCoach(tierName: string): boolean {
  const lower = tierName.toLowerCase();
  return lower === "the accelerator" || lower === "the elite";
}

async function triggerCoaching(checkinId: string, origin: string) {
  try {
    await fetch(`${origin}/api/ai/coaching-response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkinId }),
    });
  } catch (err) {
    console.error("Auto-coaching trigger failed:", err);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { token, weight, protein_hit, trained, steps, recovery_score, notes, meal_photo_url } = body;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Rate limit: 30 requests per minute per token
  if (!rateLimit(`checkin:${token}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const supabase = createAdminClient();

  // Look up participant by magic link token
  const { data: participant, error: pError } = await supabase
    .from("participants")
    .select("id, tiers(name), challenges(start_date, end_date)")
    .eq("magic_link_token", token)
    .single();

  if (pError || !participant) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  // Enforce challenge date boundaries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const challengeJoin = (participant as any).challenges;
  const startDate = Array.isArray(challengeJoin) ? challengeJoin[0]?.start_date : challengeJoin?.start_date;
  const endDate = Array.isArray(challengeJoin) ? challengeJoin[0]?.end_date : challengeJoin?.end_date;

  // Validate weight range
  if (weight) {
    const w = Number(weight);
    if (isNaN(w) || w < 50 || w > 600) {
      return NextResponse.json({ error: "Weight must be between 50 and 600 lbs" }, { status: 400 });
    }
  }

  if (startDate && today < startDate) {
    return NextResponse.json({ error: `Challenge hasn't started yet. Check-ins open ${startDate}.` }, { status: 400 });
  }
  if (endDate && today > endDate) {
    return NextResponse.json({ error: "Challenge has ended. Check-ins are closed." }, { status: 400 });
  }

  // Check if already checked in today
  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("participant_id", participant.id)
    .eq("date", today)
    .single();

  if (existing) {
    // Update existing check-in
    const { error: updateError } = await supabase
      .from("checkins")
      .update({
        weight: weight ? Number(weight) : null,
        protein_hit: protein_hit || null,
        trained: trained || null,
        steps: steps ? Number(steps) : null,
        recovery_score: recovery_score ? Number(recovery_score) : null,
        notes: notes || null,
        meal_photo_url: meal_photo_url || null,
      })
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Auto-trigger AI coaching for Accelerator + Elite tiers
    const tierName = getJoinedName(participant.tiers);
    if (shouldAutoCoach(tierName)) {
      const origin = new URL(request.url).origin;
      triggerCoaching(existing.id, origin);
    }

    return NextResponse.json({ success: true, updated: true });
  }

  // Insert new check-in
  const { data: newCheckin, error: insertError } = await supabase.from("checkins").insert({
    participant_id: participant.id,
    date: today,
    weight: weight ? Number(weight) : null,
    protein_hit: protein_hit || null,
    trained: trained || null,
    steps: steps ? Number(steps) : null,
    recovery_score: recovery_score ? Number(recovery_score) : null,
    notes: notes || null,
    meal_photo_url: meal_photo_url || null,
  }).select("id").single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Auto-trigger AI coaching for Accelerator + Elite tiers
  const tierName = getJoinedName(participant.tiers);
  if (newCheckin && shouldAutoCoach(tierName)) {
    const origin = new URL(request.url).origin;
    triggerCoaching(newCheckin.id, origin);
  }

  return NextResponse.json({ success: true, updated: false });
}
