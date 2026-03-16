import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail, sendAdminSignupNotification } from "@/lib/email";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

// Tier ID → price info
const TIER_PRICES: Record<string, { cents: number; label: string }> = {
  "97e3b54e-47c5-41b2-9702-355adcee94d1": { cents: 9900, label: "$99" },
  "67df8de0-b7cf-4b40-a954-6a60d99b075b": { cents: 19900, label: "$199" },
  "1f7ada0c-d6f6-4f94-b788-f7e705340240": { cents: 39900, label: "$399" },
};

export async function POST(request: Request) {
  const body = await request.json();
  const { challenge_id, track_id, tier_id, name, email, phone, weight, goal_weight, intake_pre } = body;

  if (!challenge_id || !track_id || !tier_id || !name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
  }

  // Build intake_pre: merge explicit weight/goal_weight with any extra fields
  const intakeData = {
    ...(intake_pre && typeof intake_pre === "object" ? intake_pre : {}),
    weight: weight ? Number(weight) : (intake_pre?.weight ?? null),
    goal_weight: goal_weight ? Number(goal_weight) : (intake_pre?.goal_weight ?? null),
  };

  const tierInfo = TIER_PRICES[tier_id] ?? { cents: null, label: "TBD" };

  const supabase = createAdminClient();

  // Insert participant
  const { data, error } = await supabase
    .from("participants")
    .insert({
      challenge_id,
      track_id,
      tier_id,
      name,
      email,
      phone: phone || null,
      intake_pre: intakeData,
      status: "active",
      payment_status: "unpaid",
      invoice_amount_cents: tierInfo.cents,
    })
    .select("id, magic_link_token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You are already signed up for this challenge." }, { status: 409, headers: corsHeaders });
    }
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }

  // Look up track, tier, and challenge names for emails
  const [trackResult, tierResult, challengeResult] = await Promise.all([
    supabase.from("tracks").select("name").eq("id", track_id).single(),
    supabase.from("tiers").select("name").eq("id", tier_id).single(),
    supabase.from("challenges").select("name").eq("id", challenge_id).single(),
  ]);

  const trackName = trackResult.data?.name || "Challenger";
  const tierName = tierResult.data?.name || "Participant";
  const challengeName = challengeResult.data?.name || "Summer Slim Down 2026";

  // Build URLs
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://challengeforge.vercel.app";
  const dashboardUrl = `${appUrl}/dashboard/${data.magic_link_token}`;
  const adminUrl = `${appUrl}/admin/participants/${data.id}`;

  // Send emails in parallel (fire-and-forget — don't block signup response)
  Promise.all([
    // 1. Participant confirmation email
    sendWelcomeEmail({
      to: email,
      participantName: name,
      trackName,
      tierName,
      dashboardUrl,
      challengeName,
    }).then(r => {
      if (!r.success) console.error("[Signup] Failed to send welcome email to", email, r.error);
      else console.log("[Signup] Welcome email sent to", email, "id:", r.id);
    }),

    // 2. Admin notification email
    sendAdminSignupNotification({
      participantName: name,
      email,
      phone: phone || undefined,
      trackName,
      tierName,
      tierPrice: tierInfo.label,
      weight: weight ? Number(weight) : undefined,
      goalWeight: goal_weight ? Number(goal_weight) : undefined,
      adminUrl,
      paymentStatus: "unpaid",
    }).then(r => {
      if (!r.success) console.error("[Signup] Failed to send admin notification", r.error);
      else console.log("[Signup] Admin notification sent, id:", r.id);
    }),
  ]).catch(err => console.error("[Signup] Email error:", err));

  return NextResponse.json({ id: data.id, magic_link_token: data.magic_link_token }, { headers: corsHeaders });
}
