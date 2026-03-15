import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { checkinId } = await request.json();

  if (!checkinId) {
    return NextResponse.json({ error: "Missing checkinId" }, { status: 400 });
  }

  // TODO: Fetch check-in + participant data
  // TODO: Build daily coaching prompt (Prompt 7)
  // TODO: Call Claude API
  // TODO: Store AI feedback in checkin record

  return NextResponse.json({ success: true, checkinId });
}
