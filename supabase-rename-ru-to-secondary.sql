-- ═══════════════════════════════════════════════════════════
-- Step 4: Rename _ru columns → _secondary across all tables
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ─── EXERCISES ───
ALTER TABLE exercises RENAME COLUMN name_ru TO name_secondary;
ALTER TABLE exercises RENAME COLUMN description_ru TO description_secondary;
ALTER TABLE exercises RENAME COLUMN instructions_ru TO instructions_secondary;
ALTER TABLE exercises RENAME COLUMN common_mistakes_ru TO common_mistakes_secondary;
ALTER TABLE exercises RENAME COLUMN regressions_ru TO regressions_secondary;
ALTER TABLE exercises RENAME COLUMN progressions_ru TO progressions_secondary;

-- ─── WORKOUTS ───
ALTER TABLE workouts RENAME COLUMN name_ru TO name_secondary;
ALTER TABLE workouts RENAME COLUMN description_ru TO description_secondary;

-- ─── WORKOUT_EXERCISES ───
ALTER TABLE workout_exercises RENAME COLUMN notes_ru TO notes_secondary;

-- ─── TRAINING_PROGRAMS ───
ALTER TABLE training_programs RENAME COLUMN name_ru TO name_secondary;
ALTER TABLE training_programs RENAME COLUMN description_ru TO description_secondary;
ALTER TABLE training_programs RENAME COLUMN full_description_ru TO full_description_secondary;
-- These may or may not exist — run with IF EXISTS approach:
DO $$ BEGIN
  ALTER TABLE training_programs RENAME COLUMN features_ru TO features_secondary;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE training_programs RENAME COLUMN includes_ru TO includes_secondary;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- ─── PROGRAM_DAYS ───
ALTER TABLE program_days RENAME COLUMN notes_ru TO notes_secondary;

-- ─── COURSES ───
ALTER TABLE courses RENAME COLUMN title_ru TO title_secondary;
ALTER TABLE courses RENAME COLUMN description_ru TO description_secondary;
-- Course page builder fields (may or may not exist)
DO $ BEGIN ALTER TABLE courses RENAME COLUMN features_ru TO features_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;
DO $ BEGIN ALTER TABLE courses RENAME COLUMN tags_ru TO tags_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;
DO $ BEGIN ALTER TABLE courses RENAME COLUMN includes_ru TO includes_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;
DO $ BEGIN ALTER TABLE courses RENAME COLUMN instructor_title_ru TO instructor_title_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;
DO $ BEGIN ALTER TABLE courses RENAME COLUMN instructor_bio_ru TO instructor_bio_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;
DO $ BEGIN ALTER TABLE courses RENAME COLUMN cta_title_ru TO cta_title_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;
DO $ BEGIN ALTER TABLE courses RENAME COLUMN cta_subtitle_ru TO cta_subtitle_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;
DO $ BEGIN ALTER TABLE courses RENAME COLUMN cta_button_text_ru TO cta_button_text_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;
DO $ BEGIN ALTER TABLE courses RENAME COLUMN guarantee_text_ru TO guarantee_text_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;

-- ─── COURSE_MODULES ───
ALTER TABLE course_modules RENAME COLUMN title_ru TO title_secondary;
DO $ BEGIN ALTER TABLE course_modules RENAME COLUMN description_ru TO description_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;

-- ─── COURSE_LESSONS ───
ALTER TABLE course_lessons RENAME COLUMN title_ru TO title_secondary;
DO $ BEGIN ALTER TABLE course_lessons RENAME COLUMN content_ru TO content_secondary; EXCEPTION WHEN undefined_column THEN NULL; END $;

-- ─── SITE_PAGES ───
ALTER TABLE site_pages RENAME COLUMN title_ru TO title_secondary;

-- ─── PAGE_BLOCKS ───
ALTER TABLE page_blocks RENAME COLUMN label_ru TO label_secondary;
ALTER TABLE page_blocks RENAME COLUMN content_ru TO content_secondary;

-- ═══════════════════════════════════════════════════════════
-- DONE! All _ru columns renamed to _secondary.
-- Note: content_en remains as-is (primary language content).
-- Frontend JSONB fields (contentRu, labelRu in page editor
-- state) are handled in the code, not at DB level.
-- ═══════════════════════════════════════════════════════════
