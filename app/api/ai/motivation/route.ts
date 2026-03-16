import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";

function buildPrompt(
  name: string,
  trackName: string,
  tierName: string,
  weekNumber: number,
  checkinData: { total: number; proteinRate: number; trainingDays: number; weightChange: string; streak: number },
  struggles: string,
  originalGoal: string,
  style: string
): string {
  const progressSummary = `${checkinData.total} check-ins, protein hit rate ${checkinData.proteinRate}%, ${checkinData.trainingDays} training days, weight change: ${checkinData.weightChange}, current streak: ${checkinData.streak} days`;

  return `You are a coach at CrossFit Blaze Naples writing a personalized motivational message for a Summer Slim Down 2026 participant. This is not a generic pep talk — this is a targeted, personal message that shows you see them, you know their journey, and you believe in their ability to finish this program strong.

PARTICIPANT CONTEXT:
- Name: ${name}
- Track: ${trackName}
- Tier: ${tierName}
- Current Week: ${weekNumber} of 8
- Progress So Far: ${progressSummary}
- Recent Struggles: ${struggles || "Not specified"}
- Original Goal: "${originalGoal || "General fitness improvement"}"
- Preferred Style: ${style}

COMMUNICATION STYLE GUIDE:
- Tough Love: Be blunt. Call out excuses. Remind them they signed up for this. Use direct language.
- Gentle Encouragement: Be warm but not soft. Acknowledge the difficulty. Emphasize how far they have come.
- Data-Driven Feedback: Lead with numbers. Show them the trend. Use percentages and comparisons.
- Peer Comparison: Reference where they stand relative to the group without naming others.

MESSAGE STRUCTURE:
1. Open with something specific to THEM
2. Acknowledge their struggle honestly
3. Reframe: show how the struggle is evidence of growth
4. Remind them of their progress with specific data points
5. Reconnect them to their original goal
6. Close with a specific action item for this week

Keep it under 250 words. Short, punchy, impactful. Use markdown formatting.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      participant_id,
      struggles = "",
      style = "Gentle Encouragement",
    } = body;

    if (!participant_id) {
      return NextResponse.json({ error: "Missing participant_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: participant, error: fetchError } = await supabase
      .from("participants")
      .select("*, tracks(name), tiers(name), challenges(start_date)")
      .eq("id", participant_id)
      .single();

    if (fetchError || !participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const trackName = getJoinedName(participant.tracks);
    const tierName = getJoinedName(participant.tiers);
    const challengeJoin = participant.challenges;
    const challengeStart = Array.isArray(challengeJoin) ? challengeJoin[0]?.start_date : challengeJoin?.start_date;

    // Calculate week number
    let weekNumber = 1;
    if (challengeStart) {
      const start = new Date(challengeStart);
      const now = new Date();
      weekNumber = Math.max(1, Math.min(8, Math.ceil((now.getTime() - start.getTime()) / (7 * 86400000))));
    }

    // Fetch check-in stats
    const { data: checkins } = await supabase
      .from("checkins")
      .select("weight, protein_hit, trained, date")
      .eq("participant_id", participant_id)
      .order("date", { ascending: true });

    const allCheckins = checkins ?? [];
    const proteinHits = allCheckins.filter((c) => c.protein_hit === "yes").length;
    const proteinRate = allCheckins.length > 0 ? Math.round((proteinHits / allCheckins.length) * 100) : 0;
    const trainingDays = allCheckins.filter((c) => c.trained === "yes").length;

    const weights = allCheckins.filter((c) => c.weight != null).map((c) => c.weight as number);
    const weightChange = weights.length >= 2
      ? `${(weights[weights.length - 1] - weights[0]).toFixed(1)} lbs`
      : "not enough data";

    // Calculate streak
    let streak = 0;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    const dates = allCheckins.map((c) => c.date).sort().reverse();
    const todayDate = new Date(today + "T00:00:00");
    for (const d of dates) {
      const expected = new Date(todayDate);
      expected.setDate(expected.getDate() - streak);
      if (d === expected.toISOString().split("T")[0]) {
        streak++;
      } else {
        break;
      }
    }

    const intake = participant.intake_pre as Record<string, unknown> | null;
    const originalGoal = (intake?.primary_goal ?? intake?.goals ?? "") as string;

    const prompt = buildPrompt(
      participant.name, trackName, tierName, weekNumber,
      { total: allCheckins.length, proteinRate, trainingDays, weightChange, streak },
      struggles, originalGoal, style
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
        max_tokens: 800,
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

    // Append (motivation messages accumulate)
    const existing = participant.ai_motivation ?? "";
    const timestamp = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const updated = existing
      ? existing + `\n\n---\n\n## Week ${weekNumber} Message (${timestamp})\n\n` + result
      : `## Week ${weekNumber} Message (${timestamp})\n\n` + result;

    const { error: updateError } = await supabase
      .from("participants")
      .update({ ai_motivation: updated })
      .eq("id", participant_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, participant_id, week: weekNumber });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Motivation message error:", message);
    return NextResponse.json({ error: "Motivation message failed: " + message }, { status: 500 });
  }
}
