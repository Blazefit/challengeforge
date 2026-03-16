import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface IntakeData {
  weight?: number;
  goal_weight?: number;
  age?: number;
  sex?: string;
  gender?: string;
  height?: string;
  body_fat_percent?: number | null;
  body_fat_pct?: number | null;
  activity_level?: string;
  training_days_per_week?: number;
  training_experience?: string;
  dietary_restrictions?: string;
  current_diet?: string;
  supplements?: string;
  meals_per_day?: number;
  cooking_skill?: string;
  meal_prep_available?: boolean;
  foods_they_love?: string;
  foods_they_hate?: string;
  fitness_level?: string;
  is_member?: string;
  goals?: string;
  primary_goal?: string;
  motivation?: string;
  injuries?: string;
  sleep_hours?: number;
  stress_level?: number;
}

function buildPrompt(
  name: string,
  trackName: string,
  tierName: string,
  intake: IntakeData
): string {
  const weight = intake.weight ?? "unknown";
  const goalWeight = intake.goal_weight ?? "unknown";
  const age = intake.age ?? "unknown";
  const sex = intake.sex ?? intake.gender ?? "unknown";
  const height = intake.height ?? "unknown";
  const bodyFat = (intake.body_fat_percent ?? intake.body_fat_pct) != null
    ? `${intake.body_fat_percent ?? intake.body_fat_pct}%`
    : "not provided";
  const activityLevel = intake.activity_level ?? "unknown";
  const trainingDays = intake.training_days_per_week ?? "unknown";
  const trainingExperience = intake.training_experience ?? "unknown";
  const dietaryRestrictions = intake.dietary_restrictions || "none";
  const currentDiet = intake.current_diet ?? "unknown";
  const supplements = intake.supplements ?? "none";
  const mealsPerDay = intake.meals_per_day ?? "unknown";
  const fitnessLevel = intake.fitness_level ?? intake.training_experience ?? "unknown";
  const isMember = intake.is_member ?? "unknown";
  const goals = intake.primary_goal ?? intake.goals ?? "general fitness improvement";
  const motivation = intake.motivation ?? "";
  const injuries = intake.injuries ?? "none";
  const sleepHours = intake.sleep_hours ?? "unknown";
  const stressLevel = intake.stress_level ?? "unknown";

  const isElite = tierName.toLowerCase() === "the elite";

  // Elite-only food preference details
  let foodPrefsBlock = "";
  if (isElite) {
    const cookingSkill = intake.cooking_skill ?? "unknown";
    const mealPrep = intake.meal_prep_available != null
      ? (intake.meal_prep_available ? "Yes" : "No")
      : "unknown";
    const foodsLove = intake.foods_they_love || "not specified";
    const foodsHate = intake.foods_they_hate || "not specified";
    foodPrefsBlock = `
Meal Planning Preferences (Elite tier — use these for the custom meal plan):
- Cooking Skill: ${cookingSkill}
- Meal Prep Available: ${mealPrep}
- Foods They Love: ${foodsLove}
- Foods They Hate: ${foodsHate}`;
  }

  let trackGuidelines = "";

  switch (trackName.toLowerCase()) {
    case "hard gainer":
      trackGuidelines = `Track: Hard Gainer
- Caloric surplus: +500 calories above maintenance (minimum)
- Protein: 1g per pound of bodyweight
- Carbs: 45-50% of total calories
- Fat: 25-30% of total calories
- 4-5 meals per day plus snacks
- Focus on compound lifts and progressive overload
- 3 strength sessions per week minimum
- Prioritize caloric density — do not let them under-eat`;
      break;
    case "last 10":
      trackGuidelines = `Track: Last 10
- Caloric deficit: 300-500 calories below maintenance
- Protein: 1g per pound of bodyweight
- Carbs: 25-30% of total calories
- Fat: 25-30% of total calories
- 3-4 meals per day, no snacking between meals
- Carb cycling: higher carbs on training days, lower on rest days
- 10,000 steps daily non-negotiable
- Strategic refeeds only (once per week at maintenance if needed)
- Mix of strength training and metabolic conditioning`;
      break;
    case "transformer":
      trackGuidelines = `Track: Transformer
- Maintenance calories or slight deficit (-100 to -200 calories)
- Protein: 1g per pound of bodyweight
- Carbs: ~40% of total calories
- Fat: 25-30% of total calories
- 3-4 meals per day
- Scaled workouts appropriate to fitness level
- Habit-building focus — consistency over intensity
- Sustainable approach: build routines they can maintain long-term`;
      break;
    default:
      trackGuidelines = `Track: ${trackName}
- Balanced approach to nutrition and training`;
  }

  // Tier-level detail instructions
  let tierInstructions = "";
  switch (tierName.toLowerCase()) {
    case "the plan":
      tierInstructions = `Tier: The Plan (self-serve)
- Provide clear general guidelines they can follow independently
- Macro targets and calorie ranges (not full meal plans)
- General meal timing recommendations
- Training framework they can adapt on their own`;
      break;
    case "the accelerator":
      tierInstructions = `Tier: The Accelerator (coaching-level detail)
- Provide detailed, specific coaching-quality output
- Precise calorie and macro targets for training and rest days
- Detailed meal timing strategy
- Specific training programming with progressions
- Do NOT include a full 7-day meal plan — focus on macro targets and general meal timing`;
      break;
    case "the elite":
      tierInstructions = `Tier: The Elite (maximum detail, full custom plan)
- Provide maximum detail in every section
- Precise calorie and macro targets for training and rest days
- Full custom 7-day meal plan with specific foods, portions, and recipes
- Incorporate their food preferences (foods they love/hate) and cooking skill level
- Account for meal prep availability
- Detailed training programming with week-by-week progressions
- Leave nothing to guesswork`;
      break;
    default:
      tierInstructions = `Tier: ${tierName}`;
  }

  const nutritionSectionEliteAddition = isElite
    ? `- Full custom 7-day meal plan with specific foods, portions, and simple prep instructions
  - Incorporate their food preferences — use foods they love, avoid foods they hate
  - Match recipes to their cooking skill level and meal prep availability`
    : `- Macro targets and general meal timing guidance (no full meal plan needed)`;

  return `You are a CrossFit Blaze coach creating a personalized 6-week challenge plan. Your coaching voice is encouraging but direct, no-BS, and results-focused. Talk to ${name} like a coach who genuinely cares about their success but won't sugarcoat the work required.

Participant Details:
- Name: ${name}
- Age: ${age}
- Sex: ${sex}
- Height: ${height}
- Current Weight: ${weight} lbs
- Goal Weight: ${goalWeight} lbs
- Body Fat: ${bodyFat}
- Fitness Level: ${fitnessLevel}
- Training Experience: ${trainingExperience}
- Activity Level: ${activityLevel}
- Training Days Per Week: ${trainingDays}
- CrossFit Blaze Member: ${isMember}
- Current Diet Style: ${currentDiet}
- Meals Per Day: ${mealsPerDay}
- Dietary Restrictions: ${dietaryRestrictions}
- Current Supplements: ${supplements}
- Injuries/Limitations: ${injuries}
- Average Sleep: ${sleepHours} hours/night
- Stress Level: ${stressLevel}/10
- Personal Goals: ${goals}${motivation ? `\n- What Motivates Them: ${motivation}` : ""}
${foodPrefsBlock}

${trackGuidelines}

${tierInstructions}

Generate a comprehensive, personalized plan with TWO sections. Use markdown formatting.

SECTION 1 - Start with exactly "## Nutrition Plan"
Include:
- BMR calculation using the Mifflin-St Jeor equation (show the math)
- TDEE calculation with appropriate activity multiplier
- Track-adjusted calorie target for BOTH training days AND rest days
- Macronutrient breakdown in grams for training days and rest days (protein, carbs, fats)
- Meal timing relative to training (pre-workout, post-workout, etc.)
${nutritionSectionEliteAddition}
- Hydration guidelines (water intake target based on bodyweight)
- Supplement recommendations if appropriate (creatine, protein powder, etc.)

SECTION 2 - Start with exactly "## Training Plan"
Include:
- Weekly schedule (which days, what type of training — strength, conditioning, active recovery)
- Specific exercises with sets, reps, and suggested loading
- Warm-up and cool-down protocols
- Progressive overload strategy week by week across the 6-week challenge
- Murph prep integration: the challenge culminates in a Murph workout on May 23rd (1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run). Build toward this progressively.
- Modifications based on fitness level (${fitnessLevel})
- Recovery recommendations (sleep, mobility, rest day activities)

Make the plan specific to ${name}, referencing their goals and current stats throughout. Be encouraging but direct — this is a challenge, not a vacation. Use practical, actionable advice they can start immediately.`;
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

    // Call OpenRouter API
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        max_tokens: 4000,
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      return NextResponse.json(
        { error: "OpenRouter API error: " + errBody },
        { status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    const fullResponse: string = aiData.choices?.[0]?.message?.content ?? "";

    if (!fullResponse) {
      return NextResponse.json(
        { error: "No content in AI response" },
        { status: 500 }
      );
    }

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
