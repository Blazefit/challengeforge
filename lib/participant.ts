import { createAdminClient } from "@/lib/supabase/admin";

export async function getParticipantByToken(token: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("participants")
    .select(
      "*, tracks(id, name, icon, color, calorie_strategy, training_days, scoring_direction), tiers(id, name, price_cents, features, ai_plan_generation, ai_meal_plan, ai_daily_coaching), challenges(id, name, slug, start_date, end_date, status)"
    )
    .eq("magic_link_token", token)
    .single();

  if (error || !data) return null;
  return data;
}
