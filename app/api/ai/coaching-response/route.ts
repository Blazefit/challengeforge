import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface CheckinRecord {
  id: string;
  participant_id: string;
  date: string;
  weight: number | null;
  protein_hit: string | null;
  trained: string | null;
  steps: number | null;
  recovery_score: number | null;
  notes: string | null;
}

interface Participant {
  id: string;
  name: string;
  tracks: { name: string } | null;
  tiers: { name: string } | null;
}

function getMaxTokensForTier(tierName: string): number {
  switch (tierName.toLowerCase()) {
    case "the plan":
      return 800;
    case "the accelerator":
      return 1200;
    case "the elite":
      return 1500;
    default:
      return 800;
  }
}

function formatCheckin(c: CheckinRecord): string {
  const parts: string[] = [`Date: ${c.date}`];
  if (c.weight != null) parts.push(`Weight: ${c.weight} lbs`);
  if (c.protein_hit != null) parts.push(`Protein hit: ${c.protein_hit === "yes" ? "Yes" : c.protein_hit === "close" ? "Close" : "No"}`);
  if (c.trained != null) parts.push(`Trained: ${c.trained === "yes" ? "Yes" : c.trained === "rest_day" ? "Rest Day" : "No"}`);
  if (c.steps != null) parts.push(`Steps: ${c.steps.toLocaleString()}`);
  if (c.recovery_score != null) parts.push(`Recovery score: ${c.recovery_score}/10`);
  if (c.notes) parts.push(`Notes: ${c.notes}`);
  return parts.join(" | ");
}

function buildCoachingPrompt(
  participant: Participant,
  checkin: CheckinRecord,
  history: CheckinRecord[],
  trackName: string,
  tierName: string
): string {
  // Track-specific coaching focus
  let trackFocus = "";
  switch (trackName.toLowerCase()) {
    case "hard gainer":
      trackFocus = `Track: Hard Gainer
Coaching focus: Eating enough to support growth, hitting caloric surplus consistently, gaining weight steadily, not skipping meals. If weight is flat or dropping, that's a red flag — they need to eat more. Protein adherence and training consistency are key drivers.`;
      break;
    case "last 10":
      trackFocus = `Track: Last 10
Coaching focus: Deficit adherence, hitting step targets (10,000+ daily is non-negotiable), staying disciplined with nutrition without over-restricting. If steps are low, call it out directly. Weight should be trending down gradually. Watch for signs of crash dieting or skipping training.`;
      break;
    case "transformer":
      trackFocus = `Track: Transformer
Coaching focus: Consistency and habit building above all else. Showing up matters more than perfection. Celebrate streaks, address missed days with encouragement not criticism. Building sustainable routines they can maintain long-term. Every check-in submitted is a win.`;
      break;
    default:
      trackFocus = `Track: ${trackName}
Coaching focus: Balanced approach to nutrition and training consistency.`;
  }

  // Tier-specific response depth
  let tierInstructions = "";
  switch (tierName.toLowerCase()) {
    case "the plan":
      tierInstructions = `Tier: The Plan (self-serve)
Response style: Brief encouragement. Keep it to 2-3 sentences. Acknowledge what they did well, flag one thing to focus on tomorrow. No deep analysis needed.`;
      break;
    case "the accelerator":
      tierInstructions = `Tier: The Accelerator (coached)
Response style: Detailed coaching feedback. Analyze their data vs their recent trends. Call out specific wins and specific areas to improve. Give 1-2 actionable tips they can implement immediately. Be specific — reference their actual numbers.`;
      break;
    case "the elite":
      tierInstructions = `Tier: The Elite (premium coaching)
Response style: Comprehensive personalized coaching. Deep analysis of today's check-in in context of their recent trend. Identify patterns (good and bad). Give specific, actionable recommendations for tomorrow. Address nutrition, training, recovery, and mindset as relevant. Reference their actual data points. This should feel like a message from their dedicated personal coach.`;
      break;
    default:
      tierInstructions = `Tier: ${tierName}
Response style: Standard coaching feedback.`;
  }

  // Format today's check-in
  const todayData = formatCheckin(checkin);

  // Format recent history
  let historyBlock = "No previous check-ins available yet.";
  if (history.length > 0) {
    historyBlock = history.map((h) => formatCheckin(h)).join("\n");
  }

  // Analyze trends from history
  let trendAnalysis = "";
  if (history.length >= 2) {
    const weights = history.filter((h) => h.weight != null).map((h) => h.weight as number);
    if (weights.length >= 2 && checkin.weight != null) {
      const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
      const diff = checkin.weight - avgWeight;
      trendAnalysis += `Weight trend: Current ${checkin.weight} lbs vs 7-day avg ${avgWeight.toFixed(1)} lbs (${diff >= 0 ? "+" : ""}${diff.toFixed(1)} lbs)\n`;
    }

    const proteinHits = history.filter((h) => h.protein_hit === "yes").length;
    trendAnalysis += `Protein consistency: Hit ${proteinHits}/${history.length} days in recent history\n`;

    const trainingDays = history.filter((h) => h.trained === "yes").length;
    trendAnalysis += `Training consistency: Trained ${trainingDays}/${history.length} days in recent history\n`;

    const stepsData = history.filter((h) => h.steps != null).map((h) => h.steps as number);
    if (stepsData.length > 0) {
      const avgSteps = Math.round(stepsData.reduce((a, b) => a + b, 0) / stepsData.length);
      trendAnalysis += `Average steps (recent): ${avgSteps.toLocaleString()}\n`;
    }
  }

  return `You are a CrossFit Blaze coach providing daily check-in feedback. Your coaching voice is encouraging but direct, no-BS, and results-focused. You genuinely care about this person's success but you won't sugarcoat the truth. Talk to them like a real coach — not a chatbot.

Participant: ${participant.name}

${trackFocus}

${tierInstructions}

Today's Check-In:
${todayData}

Recent Check-In History (last 7 days):
${historyBlock}

${trendAnalysis ? `Trend Analysis:\n${trendAnalysis}` : ""}

Based on today's check-in and their recent trends, provide coaching feedback for ${participant.name}. Address them by name. Be specific about their actual numbers. Focus on what matters most for their track. Match the depth and detail level to their tier.

Do NOT use markdown headers. Write in a natural, conversational coaching tone — like a text message from their coach. Use line breaks between thoughts for readability.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const checkinId: string | undefined = body.checkinId;

    if (!checkinId) {
      return NextResponse.json(
        { error: "Missing checkinId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the check-in record
    const { data: checkin, error: checkinError } = await supabase
      .from("checkins")
      .select("id, participant_id, date, weight, protein_hit, trained, steps, recovery_score, notes")
      .eq("id", checkinId)
      .single();

    if (checkinError || !checkin) {
      return NextResponse.json(
        { error: "Check-in not found" },
        { status: 404 }
      );
    }

    // Fetch participant with track and tier joins
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, name, tracks(name), tiers(name)")
      .eq("id", checkin.participant_id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Fetch recent check-in history (last 7 check-ins before this one)
    const { data: history, error: historyError } = await supabase
      .from("checkins")
      .select("id, participant_id, date, weight, protein_hit, trained, steps, recovery_score, notes")
      .eq("participant_id", checkin.participant_id)
      .lt("date", checkin.date)
      .order("date", { ascending: false })
      .limit(7);

    if (historyError) {
      return NextResponse.json(
        { error: "Failed to fetch check-in history: " + historyError.message },
        { status: 500 }
      );
    }

    const recentHistory: CheckinRecord[] = (history ?? []).reverse();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracks = participant.tracks as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tiers = participant.tiers as any;
    const trackName: string = (Array.isArray(tracks) ? tracks[0]?.name : tracks?.name) ?? "Unknown";
    const tierName: string = (Array.isArray(tiers) ? tiers[0]?.name : tiers?.name) ?? "Unknown";

    const prompt = buildCoachingPrompt(
      participant as unknown as Participant,
      checkin as CheckinRecord,
      recentHistory,
      trackName,
      tierName
    );

    // Call OpenRouter API
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const maxTokens = getMaxTokensForTier(tierName);

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        max_tokens: maxTokens,
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
    const feedback: string = aiData.choices?.[0]?.message?.content ?? "";

    if (!feedback) {
      return NextResponse.json(
        { error: "No content in AI response" },
        { status: 500 }
      );
    }

    // Store the AI feedback in the checkin record
    const { error: updateError } = await supabase
      .from("checkins")
      .update({ ai_feedback: feedback })
      .eq("id", checkinId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save AI feedback: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, checkinId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Coaching response error:", message);
    return NextResponse.json(
      { error: "Coaching response failed: " + message },
      { status: 500 }
    );
  }
}
