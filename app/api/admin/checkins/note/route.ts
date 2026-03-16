import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user is a gym owner
  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("email", user.email ?? "")
    .single();

  if (!gym) {
    return NextResponse.json({ error: "Not a gym owner" }, { status: 403 });
  }

  const body = await request.json();
  const { checkin_id, coach_note } = body;

  if (!checkin_id) {
    return NextResponse.json(
      { error: "checkin_id is required" },
      { status: 400 }
    );
  }

  // RLS will ensure the gym owner can only update checkins for their participants.
  // We need an update policy or use the service role. For now, we verify ownership manually.
  // First check that this checkin belongs to one of the gym's participants
  const { data: checkin } = await supabase
    .from("checkins")
    .select("id, participant_id")
    .eq("id", checkin_id)
    .single();

  if (!checkin) {
    return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
  }

  // Verify participant belongs to this gym's challenges
  const { data: participant } = await supabase
    .from("participants")
    .select("id, challenge_id")
    .eq("id", checkin.participant_id)
    .single();

  if (!participant) {
    return NextResponse.json(
      { error: "Participant not found" },
      { status: 404 }
    );
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id")
    .eq("id", participant.challenge_id)
    .eq("gym_id", gym.id)
    .single();

  if (!challenge) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Update the coach note
  const { error } = await supabase
    .from("checkins")
    .update({ coach_note: coach_note ?? null })
    .eq("id", checkin_id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to save note" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
