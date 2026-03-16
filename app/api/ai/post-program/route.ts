import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";

function buildPrompt(
  name: string,
  trackName: string,
  intake: Record<string, unknown>,
  currentWeight: number | null,
  totalCheckins: number,
  proteinRate: number,
  trainingDays: number
): string {
  const startingWeight = intake.weight as number | undefined;
  const goalWeight = intake.goal_weight as number | undefined;
  const originalGoal = (intake.primary_goal ?? intake.goals ?? "general fitness improvement") as string;
  const weightChange = startingWeight && currentWeight
    ? `${(currentWeight - startingWeight).toFixed(1)} lbs`
    : "data not available";

  return `You are the head coach at CrossFit Blaze Naples creating a personalized post-program transition plan for ${name} who just completed the Summer Slim Down 2026 challenge. They crushed 8 weeks of disciplined training and nutrition and completed the Murph workout. Help them transition from "challenge mode" to sustainable, long-term habits without losing what they built.

This is a celebration AND a game plan. Do both.

PARTICIPANT RESULTS:
- Name: ${name}
- Track: ${trackName}
- Starting Weight: ${startingWeight ?? "unknown"} lbs
- Current Weight: ${currentWeight ?? "unknown"} lbs
- Weight Change: ${weightChange}
- Goal Weight: ${goalWeight ?? "not set"} lbs
- Original Goal: "${originalGoal}"
- Total Check-ins: ${totalCheckins}
- Protein Hit Rate: ${proteinRate}%
- Training Days: ${trainingDays}

PROVIDE:

1. **Celebration of Results** — Genuine, specific acknowledgment of what they accomplished. Reference their numbers. Make them feel proud.

2. **Transition Nutrition Plan** — How to adjust from challenge-mode nutrition to sustainable maintenance:
${trackName.toLowerCase().includes("hard") ? "   - How to transition from aggressive surplus to lean gaining or maintenance without losing mass. New calorie target." : ""}
${trackName.toLowerCase().includes("last") || trackName.toLowerCase().includes("10") ? "   - How to REVERSE DIET out of a deficit safely. Week-by-week calorie increase plan to reach maintenance without regaining fat. This is critical." : ""}
${trackName.toLowerCase().includes("transform") ? "   - How to continue the recomp approach at a sustainable pace. Adjusted calorie/macro targets for the next phase." : ""}
   - Include specific new macro targets
   - Address the psychological transition: "The challenge is over but the lifestyle is not"

3. **Ongoing Training Recommendations** — What should their training look like for the next 8-12 weeks?
   - How to integrate regular CrossFit classes with their goals
   - Recovery week recommendation (Week 9 should be a deload)

4. **Habit Maintenance Guide** — A minimal daily checklist they can sustain for 6+ months. Take what worked and simplify it.

5. **Next Challenge or Phase** — Based on their results, suggest what comes next. Another challenge, a specific training focus, or a personal milestone.

6. **Final Message** — Personal closing that acknowledges their journey and the person they've become through the process. Make it memorable.

Keep the total response under 800 words. Use markdown formatting.`;
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
    const intake = (participant.intake_pre as Record<string, unknown>) ?? {};

    // Get latest weight and check-in stats
    const { data: checkins } = await supabase
      .from("checkins")
      .select("weight, protein_hit, trained")
      .eq("participant_id", participant_id);

    const allCheckins = checkins ?? [];
    const weights = allCheckins.filter((c) => c.weight != null).map((c) => c.weight as number);
    const currentWeight = weights.length > 0 ? weights[weights.length - 1] : null;
    const proteinRate = allCheckins.length > 0
      ? Math.round((allCheckins.filter((c) => c.protein_hit === "yes").length / allCheckins.length) * 100)
      : 0;
    const trainingDays = allCheckins.filter((c) => c.trained === "yes").length;

    const prompt = buildPrompt(
      participant.name, trackName, intake,
      currentWeight, allCheckins.length, proteinRate, trainingDays
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
        max_tokens: 3000,
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
      .update({ ai_post_program: result })
      .eq("id", participant_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, participant_id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Post-program plan error:", message);
    return NextResponse.json({ error: "Post-program plan failed: " + message }, { status: 500 });
  }
}
