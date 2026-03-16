import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";

interface IntakeData {
  weight?: number;
  age?: number;
  sex?: string;
  gender?: string;
  fitness_level?: string;
  training_experience?: string;
  training_days_per_week?: number;
  injuries?: string;
  activity_level?: string;
}

function buildWorkoutModPrompt(
  name: string,
  trackName: string,
  tierName: string,
  intake: IntakeData,
  trainingPlan: string
): string {
  const age = intake.age ?? "unknown";
  const sex = intake.sex ?? intake.gender ?? "unknown";
  const weight = intake.weight ?? "unknown";
  const fitnessLevel = intake.fitness_level ?? intake.training_experience ?? "unknown";
  const trainingDays = intake.training_days_per_week ?? "unknown";
  const injuries = intake.injuries || "none reported";
  const activityLevel = intake.activity_level ?? "unknown";

  let existingPlanContext = "";
  if (trainingPlan) {
    existingPlanContext = `Their current AI-generated training plan is below. Use this as the BASE and modify it:

--- EXISTING TRAINING PLAN ---
${trainingPlan.substring(0, 3000)}
--- END ---`;
  }

  const isElite = tierName.toLowerCase() === "the elite";

  return `You are a CrossFit Blaze coach creating workout modifications for ${name}. Your job is to take their training plan and adapt it to their specific limitations, fitness level, and equipment access while keeping the programming effective.

PARTICIPANT:
- Name: ${name}
- Age: ${age}
- Sex: ${sex}
- Weight: ${weight} lbs
- Fitness Level: ${fitnessLevel}
- Activity Level: ${activityLevel}
- Training Days/Week: ${trainingDays}
- Track: ${trackName}
- Injuries/Limitations: ${injuries}

${existingPlanContext}

CREATE workout modifications that include:

1. **Movement Substitutions** — For every exercise in their plan that may be too advanced or aggravate injuries, provide a scaled alternative:
   - Original movement → Modified movement
   - Why this swap works
   - When to progress back to the original

2. **Scaling Guide** — For each workout session:
   - RX version (as written)
   - Scaled version (reduced load/reps/complexity)
   - Beginner version (if fitness level is low)

3. **Injury-Specific Modifications** — Based on "${injuries}":
   - Movements to avoid entirely
   - Safe alternatives that train the same muscle groups
   - Prehab/rehab exercises to add (2-3 per session, 5 min)

4. **Progressive Overload Path** — Week-by-week progression:
   - Weeks 1-2: Foundation (learn movements, establish baselines)
   - Weeks 3-4: Build (increase volume or load by 5-10%)
   - Weeks 5-6: Push (challenge phase, prep for Murph)

5. **Warm-Up Modifications** — Personalized warm-up routine (5-8 min) addressing their specific limitations

${isElite ? `6. **Equipment Alternatives** — For each session, provide a "home workout" version using minimal equipment (dumbbells, pull-up bar, jump rope only)

7. **Recovery Protocol** — Post-workout recovery recommendations specific to their injuries/limitations` : ""}

Use markdown formatting. Tone: coaching, practical, safety-first but still pushing them to improve. Reference ${name} by name.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const participantId: string | undefined = body.participant_id;

    if (!participantId) {
      return NextResponse.json({ error: "Missing participant_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: participant, error: fetchError } = await supabase
      .from("participants")
      .select("*, tracks(name), tiers(name)")
      .eq("id", participantId)
      .single();

    if (fetchError || !participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const tierName = getJoinedName(participant.tiers);
    const tierLower = tierName.toLowerCase();

    if (tierLower !== "the accelerator" && tierLower !== "the elite") {
      return NextResponse.json(
        { error: "Workout modifications are only available for Accelerator and Elite tier participants" },
        { status: 400 }
      );
    }

    const trackName = getJoinedName(participant.tracks);
    const intake: IntakeData =
      participant.intake_pre && typeof participant.intake_pre === "object"
        ? (participant.intake_pre as IntakeData)
        : {};

    const prompt = buildWorkoutModPrompt(
      participant.name,
      trackName,
      tierName,
      intake,
      participant.ai_training_plan ?? ""
    );

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
    }

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      return NextResponse.json({ error: "OpenRouter API error: " + errBody }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const workoutMod: string = aiData.choices?.[0]?.message?.content ?? "";

    if (!workoutMod) {
      return NextResponse.json({ error: "No content in AI response" }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("participants")
      .update({ ai_workout_mod: workoutMod })
      .eq("id", participantId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save workout modifications: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, participant_id: participantId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Workout modification error:", message);
    return NextResponse.json({ error: "Workout modification failed: " + message }, { status: 500 });
  }
}
