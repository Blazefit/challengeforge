import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface IntakeData {
  weight?: number;
  goal_weight?: number;
  age?: number;
  sex?: string;
  gender?: string;
  activity_level?: string;
  training_days_per_week?: number;
  dietary_restrictions?: string;
  meals_per_day?: number;
  cooking_skill?: string;
  meal_prep_available?: boolean;
  foods_they_love?: string;
  foods_they_hate?: string;
}

function buildMealPlanPrompt(
  name: string,
  trackName: string,
  intake: IntakeData,
  nutritionPlan: string
): string {
  const weight = intake.weight ?? "unknown";
  const sex = intake.sex ?? intake.gender ?? "unknown";
  const activityLevel = intake.activity_level ?? "unknown";
  const dietaryRestrictions = intake.dietary_restrictions || "none";
  const mealsPerDay = intake.meals_per_day ?? 4;
  const cookingSkill = intake.cooking_skill ?? "moderate";
  const mealPrep = intake.meal_prep_available != null
    ? (intake.meal_prep_available ? "Yes" : "No")
    : "unknown";
  const foodsLove = intake.foods_they_love || "not specified";
  const foodsHate = intake.foods_they_hate || "not specified";

  // Extract calorie/macro targets from existing nutrition plan if available
  let macroContext = "";
  if (nutritionPlan) {
    macroContext = `The participant's existing nutrition plan is below. Extract their calorie and macro targets from it and use those exact numbers for the meal plan:

--- EXISTING NUTRITION PLAN ---
${nutritionPlan.substring(0, 2000)}
--- END ---`;
  }

  let trackNutrition = "";
  switch (trackName.toLowerCase()) {
    case "hard gainer":
      trackNutrition = `Track: Hard Gainer
- Caloric surplus: +500 above maintenance
- High protein (1g/lb), high carb (45-50%), moderate fat (25-30%)
- 4-5 meals/day plus snacks. Prioritize caloric density.
- No food is off limits. Every meal should count.`;
      break;
    case "last 10":
      trackNutrition = `Track: Last 10
- Caloric deficit: 300-500 below maintenance
- High protein (1g/lb), lower carb (25-30%), moderate fat (25-30%)
- 3-4 meals/day, no snacking between meals
- Strategic carb timing around training`;
      break;
    case "transformer":
      trackNutrition = `Track: Transformer
- Maintenance calories or slight deficit (-100 to -200)
- High protein (1g/lb), moderate carb (~40%), moderate fat (25-30%)
- 3-4 meals/day, balanced and sustainable`;
      break;
    default:
      trackNutrition = `Track: ${trackName}`;
  }

  return `You are a nutrition coach and meal planner for CrossFit Blaze, creating a custom weekly meal plan for ${name} in their fitness challenge.

PARTICIPANT:
- Name: ${name}
- Sex: ${sex}
- Weight: ${weight} lbs
- Activity Level: ${activityLevel}
- Meals/Day: ${mealsPerDay}
- Dietary Restrictions: ${dietaryRestrictions}
- Cooking Skill: ${cookingSkill}
- Weekend Meal Prep Available: ${mealPrep}
- Foods They Love: ${foodsLove}
- Foods They Hate: ${foodsHate}

${trackNutrition}

${macroContext}

CREATE a complete 7-day meal plan (Monday through Sunday) with ${mealsPerDay} meals per day.

For EACH meal include:
1. Meal name and description
2. Ingredients with exact quantities (oz, cups, tbsp)
3. Calories, Protein (g), Carbs (g), Fat (g)
4. Prep time estimate

RULES:
- Daily totals must be within ±50 calories and ±5g of each macro target
- No meal repeated more than 2x per week
- If meal prep = Yes, mark prep-friendly meals with [PREP] and provide a Sunday batch cook plan
- If cooking skill = Minimal, keep to 5 ingredients max and under 15 min prep
- If cooking skill = Moderate, recipes up to 30 min and 8 ingredients
- Use their loved foods frequently. Completely avoid their hated foods.
- Include a daily total row after each day

AFTER THE 7-DAY PLAN, include:
1. **Weekly Grocery List** organized by category (protein, produce, dairy, pantry)
2. **Estimated Weekly Cost** (budget-friendly alternatives noted where possible)
3. **Sunday Prep Timeline** — step-by-step batch cooking schedule if meal prep = Yes
4. **Quick Swap Options** — 3 easy meal swaps for days they don't feel like cooking

Use markdown formatting. Tone: direct, practical, real food a real person will actually cook.`;
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

    const tierName: string = participant.tiers?.name ?? "Unknown";

    // Elite only
    if (tierName.toLowerCase() !== "the elite") {
      return NextResponse.json(
        { error: "Meal plans are only available for Elite tier participants" },
        { status: 400 }
      );
    }

    const trackName: string = participant.tracks?.name ?? "Unknown";
    const intake: IntakeData =
      participant.intake_pre && typeof participant.intake_pre === "object"
        ? (participant.intake_pre as IntakeData)
        : {};

    const prompt = buildMealPlanPrompt(
      participant.name,
      trackName,
      intake,
      participant.ai_nutrition_plan ?? ""
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
        max_tokens: 6000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      return NextResponse.json({ error: "OpenRouter API error: " + errBody }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const mealPlan: string = aiData.choices?.[0]?.message?.content ?? "";

    if (!mealPlan) {
      return NextResponse.json({ error: "No content in AI response" }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("participants")
      .update({ ai_meal_plan: mealPlan })
      .eq("id", participantId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save meal plan: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, participant_id: participantId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Meal plan generation error:", message);
    return NextResponse.json({ error: "Meal plan generation failed: " + message }, { status: 500 });
  }
}
