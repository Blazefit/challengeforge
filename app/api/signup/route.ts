import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { challenge_id, track_id, tier_id, name, email, phone, weight, goal_weight } = body;

  if (!challenge_id || !track_id || !tier_id || !name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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
      intake_pre: { weight: weight ? Number(weight) : null, goal_weight: goal_weight ? Number(goal_weight) : null },
      status: "active",
    })
    .select("id, magic_link_token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You are already signed up for this challenge." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, magic_link_token: data.magic_link_token });
}
