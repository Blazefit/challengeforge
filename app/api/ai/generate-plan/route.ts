import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { participantId } = await request.json();

  if (!participantId) {
    return NextResponse.json({ error: "Missing participantId" }, { status: 400 });
  }

  // TODO: Fetch participant + track + tier data from Supabase
  // TODO: Select prompt template based on Track x Tier
  // TODO: Inject variables into prompt
  // TODO: Call Claude API
  // TODO: Store generated plan markdown in participant record
  // TODO: Send welcome email via Resend with magic link

  return NextResponse.json({ success: true, participantId });
}
