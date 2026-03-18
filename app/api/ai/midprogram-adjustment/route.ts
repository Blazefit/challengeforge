import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";
import { logActivity } from "@/lib/activity-log";

interface CheckinRecord {
  date: string;
  weight: number | null;
  protein_hit: string | null;
  trained: string | null;
  steps: number | null;
  recovery_score: number | null;
}

function buildMidprogramPrompt(
  name: string,
  trackName: string,
  tierName: string,
  intake: Record<string, unknown>,
  checkins: CheckinRecord[],
  nutritionPlan: string,
  trainingPlan: string
): string {
  const startingWeight = (intake.weight as number) ?? null;
  const goalWeight = (intake.goal_weight as number) ?? null;

  // Calculate 4-week trends
  const weights = checkins.filter((c) => c.weight != null).map((c) => ({
    date: c.date,
    weight: c.weight as number,
  }));

  const firstWeekWeights = weights.slice(0, 7);
  const lastWeekWeights = weights.slice(-7);
  const avgFirstWeek = firstWeekWeights.length > 0
    ? firstWeekWeights.reduce((a, w) => a + w.weight, 0) / firstWeekWeights.length
    : null;
  const avgLastWeek = lastWeekWeights.length > 0
    ? lastWeekWeights.reduce((a, w) => a + w.weight, 0) / lastWeekWeights.length
    : null;

  const totalCheckins = checkins.length;
  const totalDays = 28;
  const checkinRate = Math.round((totalCheckins / totalDays) * 100);
  const proteinHitRate = totalCheckins > 0
    ? Math.round((checkins.filter((c) => c.protein_hit === "yes").length / totalCheckins) * 100)
    : 0;
  const trainingDays = checkins.filter((c) => c.trained === "yes").length;
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

  // Weekly weight averages
  const weeklyAvgs: string[] = [];
  for (let w = 0; w < 4; w++) {
    const weekCheckins = weights.filter((_, i) => i >= w * 7 && i < (w + 1) * 7);
    if (weekCheckins.length > 0) {
      const avg = weekCheckins.reduce((a, c) => a + c.weight, 0) / weekCheckins.length;
      weeklyAvgs.push(`Week ${w + 1}: ${avg.toFixed(1)} lbs`);
    }
  }

  let trackFocus = "";
  switch (trackName.toLowerCase()) {
    case "hard gainer":
      trackFocus = `Track: Hard Gainer
Expected by Week 4: +2 to +4 lbs gained. If less, calories need to increase. If weight gain is too fast (>1.5 lbs/week), likely too much fat — tighten surplus slightly.`;
      break;
    case "last 10":
      trackFocus = `Track: Last 10
Expected by Week 4: -2 to -6 lbs lost (0.5-1.5/week). If less, deficit needs to increase or adherence is the issue. If more than 6 lbs, deficit may be too aggressive (muscle loss risk).`;
      break;
    case "transformer":
      trackFocus = `Track: Transformer
Expected by Week 4: Weight may be similar or slightly down. Focus on body composition, consistency, and habit formation. Adjust only if they're clearly not responding.`;
      break;
    default:
      trackFocus = `Track: ${trackName}`;
  }

  const isElite = tierName.toLowerCase() === "the elite";

  return `You are a CrossFit Blaze coach performing a MID-PROGRAM REVIEW for ${name} at Week 4 of their 6-week challenge. This is the critical adjustment point — 4 weeks of data, 2 weeks left to push.

${trackFocus}

4-WEEK PERFORMANCE DATA:
- Check-in Rate: ${checkinRate}% (${totalCheckins}/${totalDays} days)
${startingWeight != null ? `- Starting Weight: ${startingWeight} lbs` : ""}
${goalWeight != null ? `- Goal Weight: ${goalWeight} lbs` : ""}
${avgFirstWeek != null ? `- Week 1 Avg Weight: ${avgFirstWeek.toFixed(1)} lbs` : ""}
${avgLastWeek != null ? `- Week 4 Avg Weight: ${avgLastWeek.toFixed(1)} lbs` : ""}
${weights.length >= 2 ? `- Total Weight Change: ${(weights[weights.length - 1].weight - weights[0].weight).toFixed(1)} lbs` : ""}
- Weekly Averages: ${weeklyAvgs.join(", ") || "Insufficient data"}
- Protein Adherence: ${proteinHitRate}%
- Training Days (total): ${trainingDays}/${totalDays}
- Avg Recovery: ${avgRecovery}/10
${avgSteps != null ? `- Avg Daily Steps: ${avgSteps.toLocaleString()}` : ""}

CURRENT NUTRITION PLAN (summarized):
${nutritionPlan ? nutritionPlan.substring(0, 1500) : "No plan generated yet."}

CURRENT TRAINING PLAN (summarized):
${trainingPlan ? trainingPlan.substring(0, 1500) : "No plan generated yet."}

PRODUCE A MID-PROGRAM ADJUSTMENT REPORT:

1. **Progress Assessment** — Where are they vs where they should be? Be honest and specific with the numbers.

2. **What's Working** — Identify 2-3 things driving their results (or keeping them consistent).

3. **What Needs to Change** — Be direct. If macros need adjusting, give new numbers. If training frequency needs to change, say so. If adherence is the problem (not the plan), say that.

4. **Adjusted Macro Targets** — Based on 4 weeks of data:
   - New daily calorie target (training days + rest days)
   - New protein/carb/fat targets in grams
   - Rationale for each change (or "no change needed" with explanation)

5. **Adjusted Training Recommendations** — Any changes to:
   - Training frequency
   - Session structure
   - Progressive overload targets for Weeks 5-6
   - Recovery adjustments

6. **Weeks 5-6 Game Plan** — Specific, actionable plan for the final push:
   - Week 5 priority
   - Week 6 priority (includes Murph prep)
   - Daily non-negotiables

${isElite ? `7. **Updated Meal Plan Notes** — Should the meal plan be regenerated with new macros? If yes, note what should change. If no, note any small tweaks.

8. **Mindset Check** — Based on their check-in notes and consistency patterns, address the mental game for the final push.` : ""}

Use markdown formatting. Tone: mid-season coaching review — honest, data-driven, forward-looking. This is the "halftime talk." Use ${name}'s name throughout.`;
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
        { error: "Mid-program adjustments are only available for Accelerator and Elite tier participants" },
        { status: 400 }
      );
    }

    // Fetch all check-ins (first 4 weeks)
    const challengeJoin = participant.challenges;
    const challengeStart = Array.isArray(challengeJoin) ? challengeJoin[0]?.start_date : challengeJoin?.start_date;
    let dateFilter: { start: string; end: string } | null = null;

    if (challengeStart) {
      const start = new Date(challengeStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 27); // 4 weeks
      dateFilter = {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }

    let query = supabase
      .from("checkins")
      .select("date, weight, protein_hit, trained, steps, recovery_score")
      .eq("participant_id", participantId)
      .order("date", { ascending: true });

    if (dateFilter) {
      query = query.gte("date", dateFilter.start).lte("date", dateFilter.end);
    } else {
      query = query.limit(28);
    }

    const { data: checkins, error: checkinError } = await query;

    if (checkinError) {
      return NextResponse.json({ error: "Failed to fetch check-ins: " + checkinError.message }, { status: 500 });
    }

    const trackName = getJoinedName(participant.tracks);
    const intake = (participant.intake_pre as Record<string, unknown>) ?? {};

    const prompt = buildMidprogramPrompt(
      participant.name,
      trackName,
      tierName,
      intake,
      (checkins ?? []) as CheckinRecord[],
      participant.ai_nutrition_plan ?? "",
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
    const adjustment: string = aiData.choices?.[0]?.message?.content ?? "";

    if (!adjustment) {
      return NextResponse.json({ error: "No content in AI response" }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("participants")
      .update({ ai_midprogram_adjustment: adjustment })
      .eq("id", participantId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save adjustment: " + updateError.message }, { status: 500 });
    }

    logActivity({ participantId: participantId, type: "ai_midprogram", description: `Mid-program adjustment generated` });

    return NextResponse.json({ success: true, participant_id: participantId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Mid-program adjustment error:", message);
    return NextResponse.json({ error: "Mid-program adjustment failed: " + message }, { status: 500 });
  }
}
