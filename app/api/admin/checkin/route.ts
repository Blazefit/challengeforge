import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { participant_id, weight, protein_hit, trained, recovery_score, notes } = body;

  if (!participant_id) {
    return NextResponse.json({ error: "Missing participant_id" }, { status: 400 });
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  // Check for existing check-in today
  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("participant_id", participant_id)
    .eq("date", today)
    .single();

  const checkinData = {
    weight: weight ? Number(weight) : null,
    protein_hit: protein_hit || null,
    trained: trained || null,
    recovery_score: recovery_score ? Number(recovery_score) : null,
    notes: notes ? `[Admin] ${notes}` : null,
  };

  if (existing) {
    const { error } = await supabase
      .from("checkins")
      .update(checkinData)
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, updated: true });
  }

  const { error } = await supabase.from("checkins").insert({
    participant_id,
    date: today,
    ...checkinData,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, updated: false });
}
