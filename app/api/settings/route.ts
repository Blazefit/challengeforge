import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, brand_color, timezone } = body;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Gym name is required" }, { status: 400 });
  }

  // Validate timezone
  const validTimezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "Pacific/Honolulu",
  ];
  if (timezone && !validTimezones.includes(timezone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  // Validate brand color format
  if (brand_color && !/^#[0-9a-fA-F]{6}$/.test(brand_color)) {
    return NextResponse.json({ error: "Invalid brand color format" }, { status: 400 });
  }

  const { error } = await supabase
    .from("gyms")
    .update({
      name: name.trim(),
      brand_color: brand_color || "#dc2626",
      timezone: timezone || "America/New_York",
    })
    .eq("email", user.email ?? "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
