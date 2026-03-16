"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

interface CheckinFormData {
  token: string;
  participantId: string;
  weight: number | null;
  proteinHit: "yes" | "no" | "close" | null;
  trained: "yes" | "no" | "rest_day" | null;
  steps: number | null;
  recoveryScore: number | null;
  notes: string;
}

export async function submitCheckin(
  data: CheckinFormData
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // Check if already checked in today
  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("participant_id", data.participantId)
    .eq("date", dateStr)
    .maybeSingle();

  if (existing) {
    return { error: "Already checked in today" };
  }

  const { error } = await supabase.from("checkins").insert({
    participant_id: data.participantId,
    date: dateStr,
    weight: data.weight,
    protein_hit: data.proteinHit,
    trained: data.trained,
    steps: data.steps,
    recovery_score: data.recoveryScore,
    notes: data.notes || null,
  });

  if (error) {
    // Unique constraint violation = already checked in
    if (error.code === "23505") {
      return { error: "Already checked in today" };
    }
    return { error: "Failed to save check-in. Please try again." };
  }

  redirect(`/dashboard/${data.token}?success=checkin`);
}
