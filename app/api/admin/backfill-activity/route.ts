import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Get all participants with their data
  const { data: participants } = await admin
    .from("participants")
    .select("id, name, email, challenge_id, created_at, ai_nutrition_plan, ai_training_plan, ai_meal_plan, ai_workout_mod, ai_weekly_analysis, ai_midprogram_adjustment, ai_murph_prep, ai_motivation, ai_supplements, ai_post_program, ai_meal_substitution");

  if (!participants || participants.length === 0) {
    return NextResponse.json({ message: "No participants found" });
  }

  const logs: { challenge_id: string | null; participant_id: string; type: string; description: string; created_at: string }[] = [];

  for (const p of participants) {
    // Signup
    logs.push({
      challenge_id: p.challenge_id,
      participant_id: p.id,
      type: "signup",
      description: `${p.name} signed up (${p.email})`,
      created_at: p.created_at,
    });

    // AI plans
    if (p.ai_nutrition_plan) logs.push({ challenge_id: p.challenge_id, participant_id: p.id, type: "ai_plan_generated", description: "Nutrition & training plan generated", created_at: p.created_at });
    if (p.ai_meal_plan) logs.push({ challenge_id: p.challenge_id, participant_id: p.id, type: "ai_meal_plan", description: "Custom meal plan generated", created_at: p.created_at });
    if (p.ai_workout_mod) logs.push({ challenge_id: p.challenge_id, participant_id: p.id, type: "ai_workout_mod", description: "Workout modifications generated", created_at: p.created_at });
    if (p.ai_weekly_analysis) logs.push({ challenge_id: p.challenge_id, participant_id: p.id, type: "ai_weekly_analysis", description: "Weekly analysis generated", created_at: p.created_at });
    if (p.ai_midprogram_adjustment) logs.push({ challenge_id: p.challenge_id, participant_id: p.id, type: "ai_midprogram", description: "Mid-program adjustment generated", created_at: p.created_at });
    if (p.ai_murph_prep) logs.push({ challenge_id: p.challenge_id, participant_id: p.id, type: "ai_murph_prep", description: "Murph prep strategy generated", created_at: p.created_at });
    if (p.ai_motivation) logs.push({ challenge_id: p.challenge_id, participant_id: p.id, type: "ai_motivation", description: "Motivation message generated", created_at: p.created_at });
    if (p.ai_supplements) logs.push({ challenge_id: p.challenge_id, participant_id: p.id, type: "ai_supplements", description: "Supplement recommendations generated", created_at: p.created_at });
    if (p.ai_post_program) logs.push({ challenge_id: p.challenge_id, participant_id: p.id, type: "ai_post_program", description: "Post-program transition plan generated", created_at: p.created_at });
    if (p.ai_meal_substitution) logs.push({ challenge_id: p.challenge_id, participant_id: p.id, type: "ai_meal_substitution", description: "Meal substitution generated", created_at: p.created_at });
  }

  // Backfill check-ins
  const { data: checkins } = await admin
    .from("checkins")
    .select("participant_id, date, created_at")
    .order("date", { ascending: true });

  if (checkins) {
    // Get participant challenge mapping
    const pChallengeMap = new Map(participants.map((p) => [p.id, p.challenge_id]));
    for (const c of checkins) {
      logs.push({
        challenge_id: pChallengeMap.get(c.participant_id) ?? null,
        participant_id: c.participant_id,
        type: "checkin",
        description: "Daily check-in submitted",
        created_at: c.created_at || new Date(c.date + "T12:00:00").toISOString(),
      });
    }
  }

  // Insert all logs
  if (logs.length > 0) {
    const { error } = await admin.from("activity_logs").insert(logs);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, logged: logs.length });
}
