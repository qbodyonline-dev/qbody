-- ═══════════════════════════════════════════════════════════
-- Form Templates table — stores check-in and onboarding forms
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL DEFAULT 'New Form',
  name_ru TEXT NOT NULL DEFAULT 'Новая форма',
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('checkin', 'onboarding', 'custom')),
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS "Admin full access form_templates" ON form_templates;
CREATE POLICY "Admin full access form_templates" ON form_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'trainer'))
  );

-- All authenticated users can read active templates
DROP POLICY IF EXISTS "Read active templates" ON form_templates;
CREATE POLICY "Read active templates" ON form_templates
  FOR SELECT TO authenticated
  USING (active = true);

-- Add onboarding_completed flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_weight NUMERIC;

-- Set existing users as onboarding completed (they don't need to fill it)
UPDATE profiles SET onboarding_completed = true WHERE onboarding_completed IS NULL OR onboarding_completed = false;
-- Future registrations will have DEFAULT false and must fill onboarding

-- Add custom_data JSONB to checkins for dynamic fields not in standard columns
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

-- Ensure client_questionnaires table exists
CREATE TABLE IF NOT EXISTS client_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  primary_goal TEXT,
  secondary_goals TEXT[] DEFAULT '{}',
  target_weight NUMERIC,
  injuries TEXT,
  medical_conditions TEXT,
  medications TEXT,
  allergies TEXT,
  training_experience TEXT,
  training_frequency TEXT,
  preferred_training_time TEXT,
  training_location TEXT,
  available_equipment TEXT[] DEFAULT '{}',
  occupation TEXT,
  activity_level TEXT,
  sleep_hours_avg NUMERIC,
  stress_level_avg NUMERIC,
  dietary_restrictions TEXT[] DEFAULT '{}',
  meals_per_day INTEGER,
  water_intake TEXT,
  supplements TEXT,
  notes TEXT,
  filled_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE client_questionnaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own questionnaire" ON client_questionnaires;
CREATE POLICY "Users can read own questionnaire" ON client_questionnaires
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'trainer')));

DROP POLICY IF EXISTS "Users can upsert own questionnaire" ON client_questionnaires;
CREATE POLICY "Users can upsert own questionnaire" ON client_questionnaires
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'trainer')));

DROP POLICY IF EXISTS "Users can update own questionnaire" ON client_questionnaires;
CREATE POLICY "Users can update own questionnaire" ON client_questionnaires
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'trainer')));

-- Add extra columns to client_questionnaires for onboarding data
ALTER TABLE client_questionnaires ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE client_questionnaires ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE client_questionnaires ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE client_questionnaires ADD COLUMN IF NOT EXISTS current_weight NUMERIC;
ALTER TABLE client_questionnaires ADD COLUMN IF NOT EXISTS full_name TEXT;
