import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";
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

  const supabase = createAdminClient();

  // Look up participant by magic link token
  const { data: participant, error: pError } = await supabase
    .from("participants")
    .select("id, tiers(name)")
    .eq("magic_link_token", token)
    .single();

  if (pError || !participant) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

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
