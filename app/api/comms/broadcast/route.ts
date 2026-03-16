import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBroadcastEmail } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { subject, message, recipientEmails } = body;

  if (!subject || !message || !recipientEmails?.length) {
    return NextResponse.json({ error: "Missing subject, message, or recipients" }, { status: 400 });
  }

  const result = await sendBroadcastEmail({
    to: recipientEmails,
    subject,
    body: message,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: recipientEmails.length });
}
