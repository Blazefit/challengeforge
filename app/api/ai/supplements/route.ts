import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";

interface IntakeData {
  age?: number;
  sex?: string;
  gender?: string;
  dietary_restrictions?: string;
  supplements?: string;
  injuries?: string;
}

function buildPrompt(
  name: string,
  trackName: string,
  intake: IntakeData
): string {
  const age = intake.age ?? "unknown";
  const sex = intake.sex ?? intake.gender ?? "unknown";
  const currentSupplements = intake.supplements || "nothing currently";
  const dietaryRestrictions = intake.dietary_restrictions || "none";
  const injuries = intake.injuries || "none";

  let trackNotes = "";
  switch (trackName.toLowerCase()) {
    case "hard gainer":
      trackNotes = `Track: Hard Gainer — Priority is supporting muscle growth and recovery. Creatine and protein powder are near-essential. Mass gainers can help if they struggle to eat enough. Carb supplements for intra/post-workout.`;
      break;
    case "last 10":
      trackNotes = `Track: Last 10 — Priority is preserving muscle in a deficit and maintaining energy. Protein powder is near-essential for hitting targets. Caffeine can help with energy and performance. Avoid "fat burner" supplements. Electrolytes become important as water and carb intake may be lower.`;
      break;
    case "transformer":
      trackNotes = `Track: Transformer — Balanced approach. Protein and creatine are the foundation. Focus on recovery support since they are training frequently.`;
      break;
    default:
      trackNotes = `Track: ${trackName}`;
  }

  return `You are a nutrition coach at CrossFit Blaze Naples providing supplement guidance for ${name} in the Summer Slim Down 2026 challenge. Your recommendations should be evidence-based, practical, and prioritized. You are NOT a doctor — always include a disclaimer about consulting a healthcare provider.

Your approach: supplements are the icing on the cake. Sleep, nutrition, training, and hydration come first.

PARTICIPANT INFO:
- Name: ${name}
- ${trackNotes}
- Age: ${age}
- Sex: ${sex}
- Current Supplements: ${currentSupplements}
- Dietary Restrictions: ${dietaryRestrictions}
- Injuries/Concerns: ${injuries}

PROVIDE:

1. **Tier 1: Essentials (Start Here)**
   - The 2-3 supplements they should absolutely take
   - Specific product type (not brand names), dosing, and timing
   - Why each one matters for their specific track
   - Estimated monthly cost

2. **Tier 2: Beneficial (Add If Budget Allows)**
   - 2-3 additional supplements with meaningful benefit
   - Specific dosing and timing
   - Estimated monthly cost

3. **Tier 3: Optional (Nice to Have)**
   - 1-2 supplements with minor or situational benefit
   - When they would matter most
   - Estimated monthly cost

4. **What to Skip** — Supplements that are commonly marketed but not worth it for their situation. Call out overhyped categories.

5. **Daily Timing Cheat Sheet** — Simple schedule: morning, pre-workout, post-workout, before bed.

6. **Healthcare Disclaimer** — Standard disclaimer about consulting their doctor, especially regarding any medications or conditions.

Keep recommendations conservative and evidence-based. If the research is weak on something, say so. Use markdown formatting.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const participant_id: string | undefined = body.participant_id;

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
    const intake: IntakeData =
      participant.intake_pre && typeof participant.intake_pre === "object"
        ? (participant.intake_pre as IntakeData)
        : {};

    const prompt = buildPrompt(participant.name, trackName, intake);

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
    }

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openRouterKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        max_tokens: 2500,
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

    const { error: updateError } = await supabase
      .from("participants")
      .update({ ai_supplements: result })
      .eq("id", participant_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, participant_id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Supplement recommendation error:", message);
    return NextResponse.json({ error: "Supplement recommendation failed: " + message }, { status: 500 });
  }
}
