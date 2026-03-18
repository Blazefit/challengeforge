import { createAdminClient } from "@/lib/supabase/admin";

interface LogParams {
  challengeId?: string;
  participantId?: string;
  type: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget activity logger. Never blocks the calling operation.
 * Call without await: logActivity({ ... })
 */
export function logActivity({ challengeId, participantId, type, description, metadata }: LogParams) {
  try {
    const supabase = createAdminClient();
    const promise = supabase
      .from("activity_logs")
      .insert({
        challenge_id: challengeId || null,
        participant_id: participantId || null,
        type,
        description,
        metadata: metadata || {},
      });

    Promise.resolve(promise).then(({ error }) => {
      if (error) console.error("[ActivityLog] Failed to log:", error.message);
    }).catch((err) => {
      console.error("[ActivityLog] Exception:", err);
    });
  } catch (err) {
    console.error("[ActivityLog] Setup error:", err);
  }
}
