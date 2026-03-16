import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["unpaid", "invoiced", "paid"] as const;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be one of: unpaid, invoiced, paid" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("participants")
    .update({ payment_status: status })
    .eq("id", id)
    .select("id, payment_status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
