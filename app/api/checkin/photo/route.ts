import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const participantId = formData.get("participant_id") as string | null;

  if (!file || !participantId) {
    return NextResponse.json({ error: "Missing file or participant_id" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${participantId}/meals/${today}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("progress-photos")
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("progress-photos").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
