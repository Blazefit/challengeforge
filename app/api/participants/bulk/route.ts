import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, participant_ids } = body;
  // action: "activate" | "deactivate" | "mark_paid" | "mark_invoiced"

  if (!Array.isArray(participant_ids) || participant_ids.length === 0) {
    return NextResponse.json({ error: "No participants selected" }, { status: 400 });
  }

  let updates: Record<string, string> = {};
  switch (action) {
    case "activate": updates = { status: "active" }; break;
    case "deactivate": updates = { status: "inactive" }; break;
    case "mark_paid": updates = { payment_status: "paid" }; break;
    case "mark_invoiced": updates = { payment_status: "invoiced" }; break;
    default: return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await supabase
    .from("participants")
    .update(updates)
    .in("id", participant_ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: participant_ids.length });
}
