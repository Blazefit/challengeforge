import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // TODO: Verify Stripe webhook signature
  // TODO: Handle payment_intent.succeeded
  // TODO: Trigger AI plan generation
  // TODO: Send welcome email with magic link

  console.log("Stripe webhook received", { bodyLength: body.length });

  return NextResponse.json({ received: true });
}
