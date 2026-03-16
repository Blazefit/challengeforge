import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";

interface IntakeData {
  weight?: number;
  fitness_level?: string;
  training_experience?: string;
  injuries?: string;
  training_days_per_week?: number;
}

const BASIC_MURPH_TEMPLATE = `## Murph Prep Guide

### What is Murph?
- 1 Mile Run
- 100 Pull-Ups
- 200 Push-Ups
- 300 Air Squats
- 1 Mile Run
- Wear a 20lb vest (optional for scaled)

### Scaling Options
**RX**: Full Murph with vest
**Scaled**: No vest, partition the reps
**Beginner**: Half Murph (0.5 mile, 50/100/150, 0.5 mile)

### Partition Strategy
Don't do 100 pull-ups straight. Break it up:
- **20 rounds of "Cindy"**: 5 pull-ups, 10 push-ups, 15 squats
- **OR 10 rounds**: 10 pull-ups, 20 push-ups, 30 squats
- Start with the partition you can sustain. Consistency > speed.

### Week-by-Week Prep (Weeks 5-6)
**Week 5**: Test your partition strategy. Do 10 rounds of Cindy and time it. Note where you break down.
**Week 6**: One more practice at 60% effort mid-week. REST the 2-3 days before Murph. Don't overtrain into it.

### Race Day Tips
1. Start the first mile EASY — you have a lot of work ahead
2. Stick to your partition — don't go unbroken early and burn out
3. Pace the squats — they're the easiest to rush and the hardest to recover from
4. Second mile is mental — just keep moving
5. Hydrate well the day before. Light breakfast race morning.

Good luck. This is what you've been training for.`;

function buildMurphPrepPrompt(
  name: string,
  trackName: string,
  tierName: string,
  intake: IntakeData,
  trainingPlan: string,
  weeklyAnalysis: string
): string {
  const weight = intake.weight ?? "unknown";
  const fitnessLevel = intake.fitness_level ?? intake.training_experience ?? "unknown";
  const injuries = intake.injuries || "none reported";
  const trainingDays = intake.training_days_per_week ?? "unknown";

  const isElite = tierName.toLowerCase() === "the elite";

  let existingContext = "";
  if (trainingPlan) {
    existingContext += `\nCURRENT TRAINING PLAN (summary):\n${trainingPlan.substring(0, 1500)}\n`;
  }
  if (weeklyAnalysis) {
    existingContext += `\nRECENT WEEKLY ANALYSIS:\n${weeklyAnalysis.substring(0, 1000)}\n`;
  }

  return `You are a CrossFit Blaze coach creating a personalized Murph preparation strategy for ${name}. The Murph workout is on May 23rd — this is what the entire challenge builds toward.

MURPH WORKOUT:
- 1 Mile Run
- 100 Pull-Ups
- 200 Push-Ups
- 300 Air Squats
- 1 Mile Run
- 20lb vest (RX) or no vest (Scaled)

PARTICIPANT:
- Name: ${name}
- Weight: ${weight} lbs
- Track: ${trackName}
- Tier: ${tierName}
- Fitness Level: ${fitnessLevel}
- Training Days/Week: ${trainingDays}
- Injuries/Limitations: ${injuries}

${existingContext}

CREATE a personalized Murph prep strategy:

1. **Murph Assessment** — Based on their fitness level, recommend:
   - RX, Scaled, or Half Murph
   - Vest or no vest
   - Realistic time estimate
   - Which movements will be their limiter

2. **Partition Strategy** — Personalized to their ability:
   - Recommend specific partition (e.g., 20x Cindy, 10 rounds, or custom)
   - Rep scheme breakdown with pacing targets
   - Which partition to use based on their pull-up/push-up capacity

3. **2-Week Prep Program (Weeks 5-6)**:
   - **Week 5**: Testing week — specific workouts to gauge capacity
     - Day-by-day programming (${trainingDays} training days)
     - Include one "Half Murph" test with timing
   - **Week 6**: Taper week — maintain fitness, rest for Murph
     - Reduced volume, maintain intensity
     - Final practice session mid-week at 50% effort
     - Rest protocol for the 2-3 days before Murph

4. **Movement Prep** — For each Murph movement:
   - Pull-ups: scaling options (banded, jumping, ring rows), grip management, hand care
   - Push-ups: hand position, when to go to knees, shoulder fatigue management
   - Squats: pacing strategy, avoiding quad burnout early
   - Running: pace targets for mile 1 vs mile 2

5. **Race Day Plan**:
   - Morning routine and nutrition
   - Warm-up protocol (10 min)
   - Pacing strategy minute-by-minute
   - Mental cues for when it gets hard
   - What to do if a movement fails

${isElite ? `6. **Nutrition for Murph Week**:
   - Carb loading strategy (2 days before)
   - Race morning meal (timing + macros)
   - Intra-workout fueling if >45 min
   - Post-Murph recovery nutrition

7. **Recovery Protocol** — Post-Murph:
   - Day of: immediate recovery steps
   - Days 1-3: active recovery plan
   - When to resume normal training` : ""}

${injuries !== "none reported" ? `\n**INJURY CONSIDERATIONS**: ${name} has "${injuries}" — provide specific modifications for any Murph movements that could aggravate this. Safety first, but still push them to their best effort.\n` : ""}

Use markdown formatting. Tone: pre-game coaching — fired up but strategic. This is the culmination of their challenge. Use ${name}'s name.`;
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
    const trackName = getJoinedName(participant.tracks);

    // Plan tier gets the basic template, Accelerator + Elite get AI-generated
    if (tierLower === "the plan") {
      const { error: updateError } = await supabase
        .from("participants")
        .update({ ai_murph_prep: BASIC_MURPH_TEMPLATE })
        .eq("id", participantId);

      if (updateError) {
        return NextResponse.json({ error: "Failed to save Murph prep: " + updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, participant_id: participantId, type: "template" });
    }

    // Accelerator + Elite: AI-generated
    const intake: IntakeData =
      participant.intake_pre && typeof participant.intake_pre === "object"
        ? (participant.intake_pre as IntakeData)
        : {};

    const prompt = buildMurphPrepPrompt(
      participant.name,
      trackName,
      tierName,
      intake,
      participant.ai_training_plan ?? "",
      participant.ai_weekly_analysis ?? ""
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
    const murphPrep: string = aiData.choices?.[0]?.message?.content ?? "";

    if (!murphPrep) {
      return NextResponse.json({ error: "No content in AI response" }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("participants")
      .update({ ai_murph_prep: murphPrep })
      .eq("id", participantId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save Murph prep: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, participant_id: participantId, type: "ai_generated" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Murph prep error:", message);
    return NextResponse.json({ error: "Murph prep failed: " + message }, { status: 500 });
  }
}
