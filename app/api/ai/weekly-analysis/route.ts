import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";

interface CheckinRecord {
  date: string;
  weight: number | null;
  protein_hit: string | null;
  trained: string | null;
  steps: number | null;
  recovery_score: number | null;
  notes: string | null;
}

function buildWeeklyAnalysisPrompt(
  name: string,
  trackName: string,
  tierName: string,
  weekNumber: number,
  checkins: CheckinRecord[],
  startingWeight: number | null,
  goalWeight: number | null
): string {
  const checkinSummary = checkins.map((c) => {
    const parts: string[] = [c.date];
    if (c.weight != null) parts.push(`${c.weight}lbs`);
    parts.push(`protein:${c.protein_hit ?? "?"}`);
    parts.push(`trained:${c.trained ?? "?"}`);
    if (c.steps != null) parts.push(`${c.steps.toLocaleString()}steps`);
    if (c.recovery_score != null) parts.push(`recovery:${c.recovery_score}/10`);
    if (c.notes) parts.push(`"${c.notes}"`);
    return parts.join(" | ");
  }).join("\n");

  const weights = checkins.filter((c) => c.weight != null).map((c) => c.weight as number);
  const avgWeight = weights.length > 0
    ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
    : "N/A";
  const weightChange = weights.length >= 2
    ? (weights[weights.length - 1] - weights[0]).toFixed(1)
    : "N/A";
  const proteinHitRate = checkins.length > 0
    ? Math.round((checkins.filter((c) => c.protein_hit === "yes").length / checkins.length) * 100)
    : 0;
  const trainingDays = checkins.filter((c) => c.trained === "yes").length;
  const checkinRate = Math.round((checkins.length / 7) * 100);
  const avgRecovery = checkins.filter((c) => c.recovery_score != null).length > 0
    ? (checkins.filter((c) => c.recovery_score != null)
        .reduce((a, c) => a + (c.recovery_score ?? 0), 0) /
        checkins.filter((c) => c.recovery_score != null).length).toFixed(1)
    : "N/A";
  const avgSteps = checkins.filter((c) => c.steps != null).length > 0
    ? Math.round(
        checkins.filter((c) => c.steps != null)
          .reduce((a, c) => a + (c.steps ?? 0), 0) /
          checkins.filter((c) => c.steps != null).length
      )
    : null;

  let trackFocus = "";
  switch (trackName.toLowerCase()) {
    case "hard gainer":
      trackFocus = `Track: Hard Gainer — Weight should be trending UP. Focus on caloric surplus adherence, training consistency, and progressive overload. If weight is flat or dropping, that's the #1 issue to address.`;
      break;
    case "last 10":
      trackFocus = `Track: Last 10 — Weight should be trending DOWN steadily (0.5-1.5 lbs/week). Focus on deficit adherence, step count (10k+ daily target), and training consistency. Flag if weight loss is too fast (muscle loss risk) or stalled.`;
      break;
    case "transformer":
      trackFocus = `Track: Transformer — Focus on consistency and habit formation. Weight may fluctuate; body composition change matters more. Celebrate streaks and consistency wins. Address missed days with encouragement.`;
      break;
    default:
      trackFocus = `Track: ${trackName}`;
  }

  const isElite = tierName.toLowerCase() === "the elite";

  return `You are a CrossFit Blaze coach writing a weekly performance analysis for ${name}. This is their Week ${weekNumber} summary.

${trackFocus}

WEEKLY STATS:
- Check-in Rate: ${checkinRate}% (${checkins.length}/7 days)
- Average Weight: ${avgWeight} lbs (week change: ${weightChange} lbs)
${startingWeight != null ? `- Starting Weight: ${startingWeight} lbs (total change: ${weights.length > 0 ? (weights[weights.length - 1] - startingWeight).toFixed(1) : "N/A"} lbs)` : ""}
${goalWeight != null ? `- Goal Weight: ${goalWeight} lbs` : ""}
- Protein Hit Rate: ${proteinHitRate}%
- Training Days: ${trainingDays}/7
- Avg Recovery: ${avgRecovery}/10
${avgSteps != null ? `- Avg Daily Steps: ${avgSteps.toLocaleString()}` : ""}

DAILY CHECK-INS:
${checkinSummary || "No check-ins recorded this week."}

WRITE a weekly analysis that includes:

1. **Week ${weekNumber} Summary** — One paragraph overview of how the week went. Be specific with their numbers.

2. **Wins** — 2-3 things they did well this week (be specific, reference actual data points)

3. **Areas to Improve** — 1-2 specific areas with actionable advice. Don't be vague — "hit protein more consistently" isn't helpful. "You hit protein 3/7 days — try prepping protein snacks Sunday night so you have grab-and-go options" IS helpful.

4. **Trend Analysis** — How does this week compare to where they need to be? Are they on track for their goal? What needs to change if not?

5. **Week ${weekNumber + 1} Focus** — One clear priority for the upcoming week. Make it specific and measurable.

${isElite ? `6. **Nutrition Adjustment** — Based on this week's data, should any macro targets be adjusted? If yes, provide new numbers with reasoning. If no, explain why current targets are still appropriate.

7. **Training Notes** — Any modifications to suggest for next week based on recovery scores and training patterns?` : ""}

Use markdown formatting. Tone: like a Monday morning coaching call — direct, data-driven, motivating. Use ${name}'s name. Keep the total response focused and actionable.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const participantId: string | undefined = body.participant_id;
    const weekNumber: number = body.week_number ?? 1;

    if (!participantId) {
      return NextResponse.json({ error: "Missing participant_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: participant, error: fetchError } = await supabase
      .from("participants")
      .select("*, tracks(name), tiers(name), challenges(start_date)")
      .eq("id", participantId)
      .single();

    if (fetchError || !participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const tierName = getJoinedName(participant.tiers);
    const tierLower = tierName.toLowerCase();

    if (tierLower !== "the accelerator" && tierLower !== "the elite") {
      return NextResponse.json(
        { error: "Weekly analysis is only available for Accelerator and Elite tier participants" },
        { status: 400 }
      );
    }

    // Calculate the week's date range
    const challengeJoin = participant.challenges;
    const challengeStart = Array.isArray(challengeJoin) ? challengeJoin[0]?.start_date : challengeJoin?.start_date;
    let weekStart: string;
    let weekEnd: string;

    if (challengeStart) {
      const start = new Date(challengeStart);
      start.setDate(start.getDate() + (weekNumber - 1) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      weekStart = start.toISOString().split("T")[0];
      weekEnd = end.toISOString().split("T")[0];
    } else {
      // Fallback: last 7 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      weekStart = start.toISOString().split("T")[0];
      weekEnd = end.toISOString().split("T")[0];
    }

    // Fetch check-ins for the week
    const { data: checkins, error: checkinError } = await supabase
      .from("checkins")
      .select("date, weight, protein_hit, trained, steps, recovery_score, notes")
      .eq("participant_id", participantId)
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .order("date", { ascending: true });

    if (checkinError) {
      return NextResponse.json({ error: "Failed to fetch check-ins: " + checkinError.message }, { status: 500 });
    }

    const intake = participant.intake_pre as { weight?: number; goal_weight?: number } | null;
    const trackName = getJoinedName(participant.tracks);

    const prompt = buildWeeklyAnalysisPrompt(
      participant.name,
      trackName,
      tierName,
      weekNumber,
      (checkins ?? []) as CheckinRecord[],
      intake?.weight ?? null,
      intake?.goal_weight ?? null
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
        max_tokens: 2500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      return NextResponse.json({ error: "OpenRouter API error: " + errBody }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const analysis: string = aiData.choices?.[0]?.message?.content ?? "";

    if (!analysis) {
      return NextResponse.json({ error: "No content in AI response" }, { status: 500 });
    }

    // Store with week number prefix so multiple weeks accumulate
    const weekHeader = `## Week ${weekNumber} Analysis\n\n`;
    const existingAnalysis = participant.ai_weekly_analysis ?? "";
    const updatedAnalysis = existingAnalysis
      ? existingAnalysis + "\n\n---\n\n" + weekHeader + analysis
      : weekHeader + analysis;

    const { error: updateError } = await supabase
      .from("participants")
      .update({ ai_weekly_analysis: updatedAnalysis })
      .eq("id", participantId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save weekly analysis: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, participant_id: participantId, week: weekNumber });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Weekly analysis error:", message);
    return NextResponse.json({ error: "Weekly analysis failed: " + message }, { status: 500 });
  }
}
