-- ═══════════════════════════════════════════════════════════
-- Exercise categories: editable Muscle Groups & Equipment
-- Replaces hardcoded slug lists with DB-backed bilingual entries
-- so admin can add / rename / remove filter categories.
-- ═══════════════════════════════════════════════════════════

-- 1. Muscle groups
CREATE TABLE IF NOT EXISTS muscle_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,            -- stable id used in exercises.muscle_groups[]
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_muscle_groups_order ON muscle_groups(display_order);

-- 2. Equipment types
CREATE TABLE IF NOT EXISTS equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,            -- stable id used in exercises.equipment
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_types_order ON equipment_types(display_order);

-- 3. Trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION set_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_muscle_groups_updated_at ON muscle_groups;
CREATE TRIGGER trg_muscle_groups_updated_at
  BEFORE UPDATE ON muscle_groups
  FOR EACH ROW EXECUTE FUNCTION set_categories_updated_at();

DROP TRIGGER IF EXISTS trg_equipment_types_updated_at ON equipment_types;
CREATE TRIGGER trg_equipment_types_updated_at
  BEFORE UPDATE ON equipment_types
  FOR EACH ROW EXECUTE FUNCTION set_categories_updated_at();

-- 4. Seed muscle groups (matching the previously hardcoded list, WITHOUT 'glutes')
INSERT INTO muscle_groups (slug, name_en, name_ru, display_order) VALUES
  ('chest',     'Chest',     'Грудь',   10),
  ('back',      'Back',      'Спина',   20),
  ('legs',      'Legs',      'Ноги',    30),
  ('shoulders', 'Shoulders', 'Плечи',   40),
  ('arms',      'Arms',      'Руки',    50),
  ('core',      'Core',      'Пресс',   60),
  ('cardio',    'Cardio',    'Кардио',  70)
ON CONFLICT (slug) DO NOTHING;

-- 5. Seed equipment types (matching the previously hardcoded list)
INSERT INTO equipment_types (slug, name_en, name_ru, display_order) VALUES
  ('bodyweight', 'Bodyweight',      'Свой вес',  10),
  ('dumbbells',  'Dumbbells',       'Гантели',   20),
  ('barbell',    'Barbell',         'Штанга',    30),
  ('kettlebell', 'Kettlebell',      'Гиря',      40),
  ('machine',    'Machine',         'Тренажёр',  50),
  ('cables',     'Cables',          'Кабели',    60),
  ('bands',      'Resistance Bands','Резинки',   70),
  ('ball',       'Ball',            'Мяч',       80),
  ('bench',      'Bench',           'Скамья',    90),
  ('other',      'Other',           'Другое',   100)
ON CONFLICT (slug) DO NOTHING;

-- 6. Clean up: remove 'glutes' from any exercises that still reference it
UPDATE exercises
SET muscle_groups = array_remove(muscle_groups, 'glutes')
WHERE 'glutes' = ANY(muscle_groups);

-- 7. RLS: read for everyone authenticated, writes via service_role only (admin API)
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "muscle_groups_public_read" ON muscle_groups;
CREATE POLICY "muscle_groups_public_read" ON muscle_groups
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "equipment_types_public_read" ON equipment_types;
CREATE POLICY "equipment_types_public_read" ON equipment_types
  FOR SELECT USING (true);
