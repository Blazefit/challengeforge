import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders });
}

// Tier ID → price in cents
const TIER_PRICES: Record<string, number> = {
  "97e3b54e-47c5-41b2-9702-355adcee94d1": 9900,   // The Plan — $99
  "67df8de0-b7cf-4b40-a954-6a60d99b075b": 19900,  // The Accelerator — $199
  "1f7ada0c-d6f6-4f94-b788-f7e705340240": 39900,  // The Elite — $399
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

  const invoiceAmountCents = TIER_PRICES[tier_id] ?? null;

  const supabase = createAdminClient();

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
      invoice_amount_cents: invoiceAmountCents,
    })
    .select("id, magic_link_token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You are already signed up for this challenge." }, { status: 409, headers: corsHeaders });
    }
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }

  // Send welcome email (fire-and-forget — don't block signup response)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://challengeforge.vercel.app";
  const dashboardUrl = `${appUrl}/dashboard/${data.magic_link_token}`;

  // Look up track and tier names for the email
  const { data: trackRow } = await supabase.from("tracks").select("name").eq("id", track_id).single();
  const { data: tierRow } = await supabase.from("tiers").select("name").eq("id", tier_id).single();
  const { data: challengeRow } = await supabase.from("challenges").select("name").eq("id", challenge_id).single();

  sendWelcomeEmail({
    to: email,
    participantName: name,
    trackName: trackRow?.name ?? "Challenger",
    tierName: tierRow?.name ?? "Participant",
    dashboardUrl,
    challengeName: challengeRow?.name ?? "Summer Slim Down 2026",
  }).catch((err) => console.error("Welcome email failed:", err));

  return NextResponse.json({ id: data.id, magic_link_token: data.magic_link_token }, { headers: corsHeaders });
}
