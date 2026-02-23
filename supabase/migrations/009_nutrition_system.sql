-- 009: Nutrition MVP — targets and daily logs
-- Trainer sets KBJU targets per client, client logs daily compliance.

-- 1. Nutrition targets (set by trainer per client)
CREATE TABLE IF NOT EXISTS nutrition_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  calories integer NOT NULL DEFAULT 2000,
  protein integer NOT NULL DEFAULT 120,
  carbs integer NOT NULL DEFAULT 200,
  fat integer NOT NULL DEFAULT 65,
  notes text,
  set_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- UNIQUE CONSTRAINT (required for Supabase upsert onConflict)
  CONSTRAINT uq_nt_client UNIQUE (client_id)
);

-- 2. Daily nutrition logs (client marks compliance)
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  -- Compliance: did client hit targets? (true/false per macro)
  calories_hit boolean DEFAULT false,
  protein_hit boolean DEFAULT false,
  carbs_hit boolean DEFAULT false,
  fat_hit boolean DEFAULT false,
  -- Optional actual values (if client wants to log numbers)
  calories_actual integer,
  protein_actual integer,
  carbs_actual integer,
  fat_actual integer,
  -- Water tracking (glasses/liters)
  water_liters numeric(3,1),
  -- Overall rating 1-5
  rating integer CHECK (rating BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- UNIQUE CONSTRAINT (required for Supabase upsert onConflict)
  CONSTRAINT uq_nl_client_date UNIQUE (client_id, log_date)
);

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_nl_client ON nutrition_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_nl_date ON nutrition_logs(log_date DESC);

-- 3. RLS policies
ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Targets: trainers can read/write all, clients can read own
CREATE POLICY "Trainers manage nutrition targets" ON nutrition_targets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Clients read own targets" ON nutrition_targets
  FOR SELECT USING (client_id = auth.uid());

-- Logs: trainers read all, clients manage own
CREATE POLICY "Trainers read nutrition logs" ON nutrition_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Clients manage own nutrition logs" ON nutrition_logs
  FOR ALL USING (client_id = auth.uid());
