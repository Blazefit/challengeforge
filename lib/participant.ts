import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_MAX_AGE_DAYS = 120; // Tokens expire after 120 days

export async function getParticipantByToken(token: string) {
  if (!token || token.length < 10) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("participants")
    .select(
      "*, tracks(id, name, icon, color, calorie_strategy, training_days, scoring_direction), tiers(id, name, price_cents, features, ai_plan_generation, ai_meal_plan, ai_daily_coaching), challenges(id, name, slug, start_date, end_date, status, announcement)"
    )
    .eq("magic_link_token", token)
    .single();

  if (error || !data) return null;

  // Check token age (created_at based)
  if (data.created_at) {
    const created = new Date(data.created_at);
    const ageMs = Date.now() - created.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays > TOKEN_MAX_AGE_DAYS) return null;
  }

  return data;
}
