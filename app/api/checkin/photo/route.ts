import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const participantId = formData.get("participant_id") as string | null;

  if (!file || !participantId) {
    return NextResponse.json({ error: "Missing file or participant_id" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (5MB max)" }, { status: 413 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${participantId}/meals/${today}.${ext}`;

  let buffer: Buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "Failed to process file" }, { status: 400 });
  }

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

  const { data: urlData } = supabase.storage.from("progress-photos").getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
