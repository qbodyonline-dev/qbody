-- ═══════════════════════════════════════════════════════════════
-- Add missing columns to training_programs table
-- Required by mobile app API endpoints:
--   /api/client/programs
--   /api/programs/[id]
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Ensure _ru columns are renamed to _secondary (safe to re-run)
DO $$ BEGIN
  ALTER TABLE training_programs RENAME COLUMN name_ru TO name_secondary;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE training_programs RENAME COLUMN description_ru TO description_secondary;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- 2. Add missing columns
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS full_description text;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS full_description_secondary text;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS price integer;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS original_price integer;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS features text[];
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS features_secondary text[];
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS includes text[];
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS includes_secondary text[];

-- 3. Same for workouts (rename _ru → _secondary)
DO $$ BEGIN
  ALTER TABLE workouts RENAME COLUMN name_ru TO name_secondary;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE workouts RENAME COLUMN description_ru TO description_secondary;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- 4. Same for exercises
DO $$ BEGIN
  ALTER TABLE exercises RENAME COLUMN name_ru TO name_secondary;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE exercises RENAME COLUMN description_ru TO description_secondary;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- 5. Same for workout_exercises
DO $$ BEGIN
  ALTER TABLE workout_exercises RENAME COLUMN notes_ru TO notes_secondary;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- 6. Same for program_days
DO $$ BEGIN
  ALTER TABLE program_days RENAME COLUMN notes_ru TO notes_secondary;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- 7. Update training_programs RLS: allow clients to view ALL programs (for catalog)
DROP POLICY IF EXISTS tp_client_read ON training_programs;
CREATE POLICY tp_client_read ON training_programs
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════
-- VERIFY: Check that all expected columns now exist
-- ═══════════════════════════════════════════════════════════════
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'training_programs'
ORDER BY ordinal_position;
