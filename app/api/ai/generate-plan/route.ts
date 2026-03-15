import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const anthropic = new Anthropic(); // uses ANTHROPIC_API_KEY env var

interface IntakeData {
  weight?: number;
  goal_weight?: number;
  fitness_level?: string;
  goals?: string;
}

function buildPrompt(
  name: string,
  trackName: string,
  tierName: string,
  intake: IntakeData
): string {
  const weight = intake.weight ?? "unknown";
  const goalWeight = intake.goal_weight ?? "unknown";
  const fitnessLevel = intake.fitness_level ?? "unknown";
  const goals = intake.goals ?? "general fitness improvement";

  let trackGuidelines = "";

  switch (trackName.toLowerCase()) {
    case "hard gainer":
      trackGuidelines = `Track: Hard Gainer
- Calorie surplus: +500 calories above maintenance
- High protein: 1g per pound of bodyweight
- High carbohydrate focus to support muscle growth
- 3 strength training sessions per week
- Focus on compound movements and progressive overload`;
      break;
    case "last 10":
      trackGuidelines = `Track: Last 10
- Calorie deficit: -300 to -500 calories below maintenance
- High protein to preserve lean mass
- Lower carbohydrate intake
- 5 training days per week
- 10,000 steps daily minimum
- Mix of strength training and metabolic conditioning`;
      break;
    case "transformer":
      trackGuidelines = `Track: Transformer
- Maintenance calories or slight deficit (-100 to -200 calories)
- Balanced macronutrient distribution
- 4 workouts per week
- Focus on body recomposition (building muscle while reducing body fat)
- Progressive strength training with conditioning work`;
      break;
    default:
      trackGuidelines = `Track: ${trackName}
- Balanced approach to nutrition and training`;
  }

  return `You are an expert fitness and nutrition coach creating a personalized plan for a challenge participant.

Participant Details:
- Name: ${name}
- Current Weight: ${weight} lbs
- Goal Weight: ${goalWeight} lbs
- Fitness Level: ${fitnessLevel}
- Personal Goals: ${goals}
- Tier: ${tierName}

${trackGuidelines}

Generate a comprehensive, personalized plan with TWO sections. Use markdown formatting.

SECTION 1 - Start with exactly "## Nutrition Plan"
Include:
- Daily calorie target with explanation
- Macronutrient breakdown (protein, carbs, fats in grams)
- Meal timing recommendations
- Sample daily meal plan with specific foods and portions
- Hydration guidelines
- Supplement recommendations if appropriate

SECTION 2 - Start with exactly "## Training Plan"
Include:
- Weekly training schedule (which days, what type of training)
- Specific exercises with sets and reps
- Warm-up and cool-down protocols
- Progressive overload strategy
- Recovery recommendations
- Modifications based on fitness level (${fitnessLevel})

Make the plan specific to ${name}, referencing their goals and current stats. Be encouraging but realistic. Use practical, actionable advice.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const participantId: string | undefined = body.participant_id;

    if (!participantId) {
      return NextResponse.json(
        { error: "Missing participant_id" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch participant with track and tier joins
    const { data: participant, error: fetchError } = await supabase
      .from("participants")
      .select("*, tracks(name), tiers(name)")
      .eq("id", participantId)
      .single();

    if (fetchError || !participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    const trackName: string = participant.tracks?.name ?? "Unknown";
    const tierName: string = participant.tiers?.name ?? "Unknown";

    const intake: IntakeData =
      participant.intake_pre && typeof participant.intake_pre === "object"
        ? (participant.intake_pre as IntakeData)
        : {};

    const prompt = buildPrompt(participant.name, trackName, tierName, intake);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text content from the response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text content in AI response" },
        { status: 500 }
      );
    }

    const fullResponse = textBlock.text;

    // Split response into nutrition and training plans
    const trainingPlanMarker = "## Training Plan";
    const splitIndex = fullResponse.indexOf(trainingPlanMarker);

    let nutritionPlan: string;
    let trainingPlan: string;

    if (splitIndex !== -1) {
      nutritionPlan = fullResponse.substring(0, splitIndex).trim();
      trainingPlan = fullResponse.substring(splitIndex).trim();
    } else {
      // Fallback: store entire response as nutrition plan
      nutritionPlan = fullResponse.trim();
      trainingPlan = "";
    }

    // Store results in the database
    const { error: updateError } = await supabase
      .from("participants")
      .update({
        ai_nutrition_plan: nutritionPlan,
        ai_training_plan: trainingPlan,
      })
      .eq("id", participantId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save plans: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, participant_id: participantId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Plan generation error:", message);
    return NextResponse.json(
      { error: "Plan generation failed: " + message },
      { status: 500 }
    );
  }
}
