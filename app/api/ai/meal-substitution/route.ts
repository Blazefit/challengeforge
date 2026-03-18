import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";
import { logActivity } from "@/lib/activity-log";

function buildPrompt(
  name: string,
  trackName: string,
  originalMeal: string,
  reason: string,
  remainingMacros: string,
  preferences: string,
  availableOptions: string
): string {
  let trackNote = "";
  switch (trackName.toLowerCase()) {
    case "hard gainer":
      trackNote = "For Hard Gainer track: do not restrict anything. Calorie density is welcome. Prioritize hitting surplus.";
      break;
    case "last 10":
      trackNote = "For Last 10 track: prioritize satiety and protein. Avoid calorie-dense sauces and dressings. Every calorie counts in a deficit.";
      break;
    case "transformer":
      trackNote = "For Transformer track: balanced approach. Whole foods preferred. Keep it practical and sustainable.";
      break;
  }

  return `You are a nutrition coach at CrossFit Blaze Naples. ${name} needs a quick meal swap during the Summer Slim Down 2026 challenge. Give them 2-3 alternatives that hit similar macros. Be practical — they need an answer they can act on right now.

SWAP REQUEST:
- Participant: ${name}
- Track: ${trackName}
- Original Meal: ${originalMeal}
- Reason for Swap: ${reason}
- Remaining Daily Macros Needed: ${remainingMacros}
- Preferences: ${preferences}
- Available Options: ${availableOptions}

${trackNote}

RULES:
- Each alternative must be within +/- 50 calories and +/- 10g of each macro compared to the original meal
- If dining out or fast food: recommend specific menu items with modifications
- If cooking at home: keep it to under 15 minutes of prep/cook time
- If from meal prep: suggest something they could assemble from common prepped ingredients

PROVIDE FOR EACH ALTERNATIVE:
1. Meal name and description
2. Ingredients/order instructions
3. Approximate macros: Calories | Protein | Carbs | Fat
4. Prep/wait time

Keep it brief and actionable. Use markdown formatting.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      participant_id,
      original_meal = "Not specified",
      reason = "Need a swap",
      remaining_macros = "Not specified",
      preferences = "No specific preferences",
      available_options = "Cooking at home",
    } = body;

    if (!participant_id) {
      return NextResponse.json({ error: "Missing participant_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: participant, error: fetchError } = await supabase
      .from("participants")
      .select("*, tracks(name), tiers(name)")
      .eq("id", participant_id)
      .single();

    if (fetchError || !participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const trackName = getJoinedName(participant.tracks);
    const prompt = buildPrompt(
      participant.name, trackName,
      original_meal, reason, remaining_macros, preferences, available_options
    );

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
    }

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openRouterKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      return NextResponse.json({ error: "OpenRouter API error: " + errBody }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const result: string = aiData.choices?.[0]?.message?.content ?? "";

    if (!result) {
      return NextResponse.json({ error: "No content in AI response" }, { status: 500 });
    }

    // Append to existing substitutions (they accumulate)
    const existing = participant.ai_meal_substitution ?? "";
    const timestamp = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const updated = existing
      ? existing + `\n\n---\n\n## Swap (${timestamp})\n\n` + result
      : `## Swap (${timestamp})\n\n` + result;

    const { error: updateError } = await supabase
      .from("participants")
      .update({ ai_meal_substitution: updated })
      .eq("id", participant_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save: " + updateError.message }, { status: 500 });
    }

    logActivity({ participantId: participant_id, type: "ai_meal_substitution", description: `Meal substitution generated` });

    return NextResponse.json({ success: true, participant_id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Meal substitution error:", message);
    return NextResponse.json({ error: "Meal substitution failed: " + message }, { status: 500 });
  }
}
