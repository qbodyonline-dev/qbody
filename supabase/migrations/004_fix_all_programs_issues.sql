-- ═══════════════════════════════════════════════════════════════
-- COMBINED FIX: All programs-related DB issues
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to run multiple times
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Rename _ru → _secondary (safe, skips if already done) ───

DO $$ BEGIN ALTER TABLE training_programs RENAME COLUMN name_ru TO name_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE training_programs RENAME COLUMN description_ru TO description_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE workouts RENAME COLUMN name_ru TO name_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE workouts RENAME COLUMN description_ru TO description_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE exercises RENAME COLUMN name_ru TO name_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE exercises RENAME COLUMN description_ru TO description_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE workout_exercises RENAME COLUMN notes_ru TO notes_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE program_days RENAME COLUMN notes_ru TO notes_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- ─── 2. Add missing columns (safe, IF NOT EXISTS) ───

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

-- ─── 3. Convert full_description from TEXT → JSONB (THE KEY FIX) ───
-- BlockEditor saves Block[] arrays. If stored as text, Supabase returns
-- a string which causes "t.map is not a function" crash.

DO $$
DECLARE
  col_type text;
BEGIN
  -- Check current type of full_description
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'training_programs'
    AND column_name = 'full_description';

  IF col_type IS NOT NULL AND col_type != 'jsonb' THEN
    EXECUTE 'ALTER TABLE training_programs ALTER COLUMN full_description TYPE jsonb USING (
      CASE
        WHEN full_description IS NULL THEN NULL
        WHEN full_description::text ~ ''^\['' THEN full_description::jsonb
        ELSE NULL
      END
    )';
    RAISE NOTICE 'Converted full_description to jsonb';
  ELSE
    RAISE NOTICE 'full_description is already jsonb or does not exist';
  END IF;

  -- Check current type of full_description_secondary
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'training_programs'
    AND column_name = 'full_description_secondary';

  IF col_type IS NOT NULL AND col_type != 'jsonb' THEN
    EXECUTE 'ALTER TABLE training_programs ALTER COLUMN full_description_secondary TYPE jsonb USING (
      CASE
        WHEN full_description_secondary IS NULL THEN NULL
        WHEN full_description_secondary::text ~ ''^\['' THEN full_description_secondary::jsonb
        ELSE NULL
      END
    )';
    RAISE NOTICE 'Converted full_description_secondary to jsonb';
  ELSE
    RAISE NOTICE 'full_description_secondary is already jsonb or does not exist';
  END IF;
END $$;

-- ─── 4. Fix RLS: allow all users to read programs (for catalog) ───

DROP POLICY IF EXISTS tp_client_read ON training_programs;
CREATE POLICY tp_client_read ON training_programs
  FOR SELECT USING (true);

-- ─── 5. Verify result ───

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'training_programs'
ORDER BY ordinal_position;
