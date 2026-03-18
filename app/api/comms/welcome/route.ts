import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJoinedName } from "@/lib/ai-utils";
import { sendWelcomeEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { participant_id } = body;

  if (!participant_id) {
    return NextResponse.json({ error: "Missing participant_id" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: participant, error } = await admin
    .from("participants")
    .select("name, email, magic_link_token, tracks(name), tiers(name), challenges(name)")
    .eq("id", participant_id)
    .single();

  if (error || !participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  const trackName = getJoinedName(participant.tracks);
  const tierName = getJoinedName(participant.tiers);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const challengeJoin = (participant as any).challenges;
  const challengeName = Array.isArray(challengeJoin)
    ? challengeJoin[0]?.name
    : challengeJoin?.name;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://challengeforge.vercel.app";
  const dashboardUrl = `${appUrl}/dashboard/${participant.magic_link_token}`;

  const result = await sendWelcomeEmail({
    to: participant.email,
    participantName: participant.name,
    trackName,
    tierName,
    dashboardUrl,
    challengeName: challengeName ?? "Summer Slim Down 2026",
  });

  if (!result.success) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  logActivity({ participantId: participant_id, type: "email_welcome", description: `Welcome email sent to ${participant.name}`, metadata: { email: participant.email } });

  return NextResponse.json({ success: true });
}
