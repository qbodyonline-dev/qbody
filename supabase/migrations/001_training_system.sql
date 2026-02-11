-- ═══════════════════════════════════════════════════════════════════
-- QBODY TRAINING SYSTEM — Full Database Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════

-- STEP 1: Enhance existing exercises table
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS name_ru text;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS description_ru text;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions_ru text;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS common_mistakes_ru text;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS regressions text;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS regressions_ru text;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS progressions text;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS progressions_ru text;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category text DEFAULT 'strength';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'intermediate';

CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);

-- STEP 2: Workouts (тренировки — шаблоны)
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ru text,
  description text,
  description_ru text,
  type text NOT NULL DEFAULT 'strength' CHECK (type IN ('strength','cardio','mobility','mixed','hiit','recovery')),
  difficulty text NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner','intermediate','advanced')),
  estimated_duration integer DEFAULT 45,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_template boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workouts_created_by ON workouts(created_by);

-- STEP 3: Workout exercises
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  section text NOT NULL DEFAULT 'main' CHECK (section IN ('warmup','main','cooldown')),
  position integer NOT NULL DEFAULT 0,
  sets integer DEFAULT 3,
  reps text DEFAULT '12',
  weight text,
  tempo text,
  rest_seconds integer DEFAULT 60,
  notes text,
  notes_ru text,
  superset_group text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_we_workout ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_we_exercise ON workout_exercises(exercise_id);

-- STEP 4: Programs
CREATE TABLE IF NOT EXISTS training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ru text,
  description text,
  description_ru text,
  duration_weeks integer NOT NULL DEFAULT 8,
  goal text DEFAULT 'general' CHECK (goal IN ('weight_loss','muscle_gain','endurance','recovery','general','beginner','home')),
  difficulty text NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner','intermediate','advanced')),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tp_created_by ON training_programs(created_by);
CREATE INDEX IF NOT EXISTS idx_tp_active ON training_programs(is_active);

-- STEP 5: Program days
CREATE TABLE IF NOT EXISTS program_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  week_number integer NOT NULL DEFAULT 1,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
  is_rest_day boolean DEFAULT false,
  notes text,
  notes_ru text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(program_id, week_number, day_of_week)
);
CREATE INDEX IF NOT EXISTS idx_pd_program ON program_days(program_id);

-- STEP 6: Client programs
CREATE TABLE IF NOT EXISTS client_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  current_week integer DEFAULT 1,
  assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cp_client ON client_programs(client_id);
CREATE INDEX IF NOT EXISTS idx_cp_status ON client_programs(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cp_active_unique ON client_programs(client_id) WHERE status = 'active';

-- STEP 7: Workout logs
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
  client_program_id uuid REFERENCES client_programs(id) ON DELETE SET NULL,
  scheduled_date date,
  started_at timestamptz,
  completed_at timestamptz,
  duration_minutes integer,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','skipped','partial')),
  rpe integer CHECK (rpe BETWEEN 1 AND 10),
  mood text CHECK (mood IN ('great','good','ok','tired','bad')),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wl_client ON workout_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_wl_date ON workout_logs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_wl_client_date ON workout_logs(client_id, scheduled_date);

-- STEP 8: Exercise logs
CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id uuid NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL DEFAULT 1,
  reps_planned integer,
  reps_done integer,
  weight_planned numeric(7,2),
  weight_done numeric(7,2),
  duration_seconds integer,
  rpe integer CHECK (rpe BETWEEN 1 AND 10),
  completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_el_workout_log ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_el_exercise ON exercise_logs(exercise_id);

-- STEP 9: Checkins
CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric(5,2),
  body_fat_pct numeric(4,1),
  waist numeric(5,1),
  hips numeric(5,1),
  chest numeric(5,1),
  thigh numeric(5,1),
  arm numeric(5,1),
  sleep_hours numeric(3,1),
  sleep_quality integer CHECK (sleep_quality BETWEEN 1 AND 10),
  stress_level integer CHECK (stress_level BETWEEN 1 AND 10),
  energy_level integer CHECK (energy_level BETWEEN 1 AND 10),
  appetite integer CHECK (appetite BETWEEN 1 AND 10),
  soreness integer CHECK (soreness BETWEEN 1 AND 10),
  cycle_day integer,
  cycle_notes text,
  comment text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','flagged')),
  flagged boolean DEFAULT false,
  flag_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checkins_client ON checkins(client_id);
CREATE INDEX IF NOT EXISTS idx_checkins_status ON checkins(status);
CREATE INDEX IF NOT EXISTS idx_checkins_client_date ON checkins(client_id, checkin_date DESC);

-- STEP 10: Checkin photos
CREATE TABLE IF NOT EXISTS checkin_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_type text NOT NULL DEFAULT 'front' CHECK (photo_type IN ('front','side','back','other')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cph_checkin ON checkin_photos(checkin_id);

-- STEP 11: Checkin responses
CREATE TABLE IF NOT EXISTS checkin_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  attachment_url text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cr_checkin ON checkin_responses(checkin_id);

-- STEP 12: Client questionnaires
CREATE TABLE IF NOT EXISTS client_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  primary_goal text,
  secondary_goals text[],
  target_weight numeric(5,2),
  injuries text,
  medical_conditions text,
  medications text,
  allergies text,
  training_experience text CHECK (training_experience IN ('none','beginner','intermediate','advanced')),
  training_frequency text,
  preferred_training_time text,
  training_location text CHECK (training_location IN ('gym','home','both','outdoor')),
  available_equipment text[],
  occupation text,
  activity_level text CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  sleep_hours_avg numeric(3,1),
  stress_level_avg integer CHECK (stress_level_avg BETWEEN 1 AND 10),
  dietary_restrictions text[],
  meals_per_day integer,
  water_intake text,
  supplements text,
  notes text,
  filled_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);
CREATE INDEX IF NOT EXISTS idx_cq_client ON client_questionnaires(client_id);

-- STEP 13: Checkin templates
CREATE TABLE IF NOT EXISTS checkin_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default',
  enable_weight boolean DEFAULT true,
  enable_body_fat boolean DEFAULT false,
  enable_measurements boolean DEFAULT true,
  enable_photos boolean DEFAULT true,
  enable_sleep boolean DEFAULT true,
  enable_stress boolean DEFAULT true,
  enable_energy boolean DEFAULT true,
  enable_appetite boolean DEFAULT false,
  enable_soreness boolean DEFAULT false,
  enable_cycle boolean DEFAULT false,
  enable_comment boolean DEFAULT true,
  frequency_days integer DEFAULT 7,
  preferred_day text DEFAULT 'monday',
  is_default boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trainer_id, name)
);

-- STEP 14: RLS Policies
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_templates ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','trainer'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_own_client(check_client_id uuid) RETURNS boolean AS $$
  SELECT auth.uid() = check_client_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Exercises
DROP POLICY IF EXISTS exercises_admin_all ON exercises;
CREATE POLICY exercises_admin_all ON exercises FOR ALL USING (is_admin());
DROP POLICY IF EXISTS exercises_client_read ON exercises;
CREATE POLICY exercises_client_read ON exercises FOR SELECT USING (true);

-- Workouts
DROP POLICY IF EXISTS workouts_admin_all ON workouts;
CREATE POLICY workouts_admin_all ON workouts FOR ALL USING (is_admin());
DROP POLICY IF EXISTS workouts_client_read ON workouts;
CREATE POLICY workouts_client_read ON workouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM client_programs cp JOIN program_days pd ON pd.program_id = cp.program_id WHERE cp.client_id = auth.uid() AND pd.workout_id = workouts.id AND cp.status = 'active')
);

-- Workout exercises
DROP POLICY IF EXISTS we_admin_all ON workout_exercises;
CREATE POLICY we_admin_all ON workout_exercises FOR ALL USING (is_admin());
DROP POLICY IF EXISTS we_client_read ON workout_exercises;
CREATE POLICY we_client_read ON workout_exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM workouts w JOIN program_days pd ON pd.workout_id = w.id JOIN client_programs cp ON cp.program_id = pd.program_id WHERE workout_exercises.workout_id = w.id AND cp.client_id = auth.uid() AND cp.status = 'active')
);

-- Training programs
DROP POLICY IF EXISTS tp_admin_all ON training_programs;
CREATE POLICY tp_admin_all ON training_programs FOR ALL USING (is_admin());
DROP POLICY IF EXISTS tp_client_read ON training_programs;
CREATE POLICY tp_client_read ON training_programs FOR SELECT USING (
  EXISTS (SELECT 1 FROM client_programs cp WHERE cp.program_id = training_programs.id AND cp.client_id = auth.uid())
);

-- Program days
DROP POLICY IF EXISTS pd_admin_all ON program_days;
CREATE POLICY pd_admin_all ON program_days FOR ALL USING (is_admin());
DROP POLICY IF EXISTS pd_client_read ON program_days;
CREATE POLICY pd_client_read ON program_days FOR SELECT USING (
  EXISTS (SELECT 1 FROM client_programs cp WHERE cp.program_id = program_days.program_id AND cp.client_id = auth.uid())
);

-- Client programs
DROP POLICY IF EXISTS cpr_admin_all ON client_programs;
CREATE POLICY cpr_admin_all ON client_programs FOR ALL USING (is_admin());
DROP POLICY IF EXISTS cpr_client_read ON client_programs;
CREATE POLICY cpr_client_read ON client_programs FOR SELECT USING (is_own_client(client_id));

-- Workout logs
DROP POLICY IF EXISTS wl_admin_all ON workout_logs;
CREATE POLICY wl_admin_all ON workout_logs FOR ALL USING (is_admin());
DROP POLICY IF EXISTS wl_client_read ON workout_logs;
CREATE POLICY wl_client_read ON workout_logs FOR SELECT USING (is_own_client(client_id));
DROP POLICY IF EXISTS wl_client_insert ON workout_logs;
CREATE POLICY wl_client_insert ON workout_logs FOR INSERT WITH CHECK (is_own_client(client_id));
DROP POLICY IF EXISTS wl_client_update ON workout_logs;
CREATE POLICY wl_client_update ON workout_logs FOR UPDATE USING (is_own_client(client_id));

-- Exercise logs
DROP POLICY IF EXISTS el_admin_all ON exercise_logs;
CREATE POLICY el_admin_all ON exercise_logs FOR ALL USING (is_admin());
DROP POLICY IF EXISTS el_client_read ON exercise_logs;
CREATE POLICY el_client_read ON exercise_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM workout_logs wl WHERE wl.id = exercise_logs.workout_log_id AND wl.client_id = auth.uid())
);
DROP POLICY IF EXISTS el_client_insert ON exercise_logs;
CREATE POLICY el_client_insert ON exercise_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workout_logs wl WHERE wl.id = exercise_logs.workout_log_id AND wl.client_id = auth.uid())
);
DROP POLICY IF EXISTS el_client_update ON exercise_logs;
CREATE POLICY el_client_update ON exercise_logs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM workout_logs wl WHERE wl.id = exercise_logs.workout_log_id AND wl.client_id = auth.uid())
);

-- Checkins
DROP POLICY IF EXISTS ci_admin_all ON checkins;
CREATE POLICY ci_admin_all ON checkins FOR ALL USING (is_admin());
DROP POLICY IF EXISTS ci_client_read ON checkins;
CREATE POLICY ci_client_read ON checkins FOR SELECT USING (is_own_client(client_id));
DROP POLICY IF EXISTS ci_client_insert ON checkins;
CREATE POLICY ci_client_insert ON checkins FOR INSERT WITH CHECK (is_own_client(client_id));
DROP POLICY IF EXISTS ci_client_update ON checkins;
CREATE POLICY ci_client_update ON checkins FOR UPDATE USING (is_own_client(client_id));

-- Checkin photos
DROP POLICY IF EXISTS cph_admin_all ON checkin_photos;
CREATE POLICY cph_admin_all ON checkin_photos FOR ALL USING (is_admin());
DROP POLICY IF EXISTS cph_client_read ON checkin_photos;
CREATE POLICY cph_client_read ON checkin_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM checkins c WHERE c.id = checkin_photos.checkin_id AND c.client_id = auth.uid())
);
DROP POLICY IF EXISTS cph_client_insert ON checkin_photos;
CREATE POLICY cph_client_insert ON checkin_photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM checkins c WHERE c.id = checkin_photos.checkin_id AND c.client_id = auth.uid())
);

-- Checkin responses
DROP POLICY IF EXISTS crsp_admin_all ON checkin_responses;
CREATE POLICY crsp_admin_all ON checkin_responses FOR ALL USING (is_admin());
DROP POLICY IF EXISTS crsp_client_read ON checkin_responses;
CREATE POLICY crsp_client_read ON checkin_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM checkins c WHERE c.id = checkin_responses.checkin_id AND c.client_id = auth.uid())
);

-- Client questionnaires
DROP POLICY IF EXISTS cquest_admin_all ON client_questionnaires;
CREATE POLICY cquest_admin_all ON client_questionnaires FOR ALL USING (is_admin());
DROP POLICY IF EXISTS cquest_client_read ON client_questionnaires;
CREATE POLICY cquest_client_read ON client_questionnaires FOR SELECT USING (is_own_client(client_id));
DROP POLICY IF EXISTS cquest_client_insert ON client_questionnaires;
CREATE POLICY cquest_client_insert ON client_questionnaires FOR INSERT WITH CHECK (is_own_client(client_id));
DROP POLICY IF EXISTS cquest_client_update ON client_questionnaires;
CREATE POLICY cquest_client_update ON client_questionnaires FOR UPDATE USING (is_own_client(client_id));

-- Checkin templates
DROP POLICY IF EXISTS ct_admin_all ON checkin_templates;
CREATE POLICY ct_admin_all ON checkin_templates FOR ALL USING (is_admin());

-- STEP 15: Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['exercises','workouts','training_programs','client_programs','workout_logs','checkins','client_questionnaires','checkin_templates'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', tbl);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl);
  END LOOP;
END;
$$;

-- VERIFY
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('exercises','workouts','workout_exercises','training_programs','program_days','client_programs','workout_logs','exercise_logs','checkins','checkin_photos','checkin_responses','client_questionnaires','checkin_templates') ORDER BY table_name;
