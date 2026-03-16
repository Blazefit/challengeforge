import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calculate the consecutive check-in streak for a participant.
 * Counts consecutive days ending at today or yesterday that have a checkin record.
 */
export async function calculateStreak(
  supabase: SupabaseClient,
  participantId: string
): Promise<number> {
  const { data: checkins, error } = await supabase
    .from("checkins")
    .select("date")
    .eq("participant_id", participantId)
    .order("date", { ascending: false })
    .limit(100);

  if (error || !checkins || checkins.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const checkinDates = new Set(
    checkins.map((c: { date: string }) => c.date)
  );

  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(yesterday);

  // Streak must start from today or yesterday
  if (!checkinDates.has(todayStr) && !checkinDates.has(yesterdayStr)) {
    return 0;
  }

  // Start counting from the most recent check-in day
  const startDate = checkinDates.has(todayStr) ? today : yesterday;
  let streak = 0;
  const current = new Date(startDate);

  while (true) {
    const dateStr = formatDate(current);
    if (checkinDates.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
