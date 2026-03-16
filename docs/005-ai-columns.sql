-- Add columns for new AI prompt outputs (Prompts 3-6)
-- ai_meal_plan already exists from initial schema (Prompt 2)

ALTER TABLE participants ADD COLUMN IF NOT EXISTS ai_workout_mod text;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS ai_weekly_analysis text;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS ai_midprogram_adjustment text;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS ai_murph_prep text;
