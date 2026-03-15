import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { token, weight, protein_hit, trained, steps, recovery_score, notes } = body;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Look up participant by magic link token
  const { data: participant, error: pError } = await supabase
    .from("participants")
    .select("id")
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
      })
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, updated: true });
  }

  // Insert new check-in
  const { error: insertError } = await supabase.from("checkins").insert({
    participant_id: participant.id,
    date: today,
    weight: weight ? Number(weight) : null,
    protein_hit: protein_hit || null,
    trained: trained || null,
    steps: steps ? Number(steps) : null,
    recovery_score: recovery_score ? Number(recovery_score) : null,
    notes: notes || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: false });
}
