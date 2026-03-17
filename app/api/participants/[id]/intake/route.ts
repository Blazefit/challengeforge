import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";
import { NextResponse } from "next/server";

async function triggerPlanGeneration(participantId: string, tierName: string, origin: string) {
  const lower = tierName.toLowerCase();

  // Always generate nutrition + training plan
  fetch(`${origin}/api/ai/generate-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id: participantId }),
  }).catch((err) => console.error("[Auto-plan] generate-plan failed:", err));

  // Elite: also generate meal plan
  if (lower === "the elite") {
    fetch(`${origin}/api/ai/meal-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: participantId }),
    }).catch((err) => console.error("[Auto-plan] meal-plan failed:", err));
  }

  // Accelerator + Elite: also generate workout modifications
  if (lower === "the accelerator" || lower === "the elite") {
    // Delay workout-mod slightly so generate-plan finishes first (it needs the training plan)
    setTimeout(() => {
      fetch(`${origin}/api/ai/workout-mod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: participantId }),
      }).catch((err) => console.error("[Auto-plan] workout-mod failed:", err));
    }, 15000);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Verify the token matches the participant (security check)
  if (!body.token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify participant exists and token matches
  const { data: participant } = await supabase
    .from("participants")
    .select("id, magic_link_token")
    .eq("id", id)
    .single();

  if (!participant || participant.magic_link_token !== body.token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("participants")
    .update({ intake_pre: body.intake_pre })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-trigger AI plan generation if minimum fields are present
  const intake = body.intake_pre as Record<string, unknown> | null;
  const hasMinFields = intake?.weight && intake?.age && (intake?.sex || intake?.gender) && intake?.height;
  if (hasMinFields) {
    // Look up tier for tier-specific plan generation
    const { data: fullParticipant } = await supabase
      .from("participants")
      .select("tiers(name)")
      .eq("id", id)
      .single();

    const tierName = fullParticipant ? getJoinedName(fullParticipant.tiers) : "Unknown";
    const origin = new URL(request.url).origin;
    triggerPlanGeneration(id, tierName, origin);
  }

  return NextResponse.json({ success: true, data });
}
