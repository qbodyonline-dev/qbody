-- =====================================================
-- COURSES EDITOR SCHEMA (SAFE - adds missing columns)
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. ADD MISSING COLUMNS TO COURSES (if table exists)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS title_ru TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description_ru TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS original_price INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_weeks INTEGER DEFAULT 8;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. COURSE MODULES TABLE
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ru TEXT,
  description TEXT,
  description_ru TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COURSE LESSONS TABLE
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ru TEXT,
  type TEXT DEFAULT 'video',
  duration_minutes INTEGER DEFAULT 10,
  video_url TEXT,
  content JSONB DEFAULT '[]',
  content_ru JSONB DEFAULT '[]',
  is_free BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);

-- 5. ENABLE RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

-- 6. DROP EXISTING POLICIES (safe)
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Service role full access to courses" ON courses;
DROP POLICY IF EXISTS "Service role full access to modules" ON course_modules;
DROP POLICY IF EXISTS "Service role full access to lessons" ON course_lessons;
DROP POLICY IF EXISTS "Anyone can view modules of published courses" ON course_modules;
DROP POLICY IF EXISTS "Anyone can view lessons of published modules" ON course_lessons;

-- 7. CREATE POLICIES
CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT
  USING (is_published = true);

CREATE POLICY "Service role full access to courses"
  ON courses FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access to modules"
  ON course_modules FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access to lessons"
  ON course_lessons FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Anyone can view modules of published courses"
  ON course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_modules.course_id 
      AND courses.is_published = true
    )
  );

CREATE POLICY "Anyone can view lessons of published modules"
  ON course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = course_lessons.module_id
      AND c.is_published = true
      AND m.is_published = true
    )
  );

-- 8. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS courses_updated_at ON courses;
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 9. UPDATE EXISTING COURSES WITH NEW COLUMNS
UPDATE courses SET 
  title_ru = 'Восстановление после увеличения груди',
  description_ru = 'Полная программа восстановления после операции по увеличению груди',
  is_published = true,
  duration_weeks = 6
WHERE slug = 'breast-augmentation-recovery';

UPDATE courses SET 
  title_ru = 'Восстановление после кесарева сечения',
  description_ru = 'Мягкая программа восстановления после кесарева сечения',
  is_published = true,
  duration_weeks = 8
WHERE slug = 'cesarean-recovery';

-- DONE!
