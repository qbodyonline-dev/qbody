-- =====================================================
-- COURSE PAGE BUILDER SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. ADD PAGE BUILDER FIELDS TO COURSES
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_video_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 4.9;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS features_ru JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tags_ru JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_title TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_title_ru TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_bio TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_bio_ru TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_image_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cta_title TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cta_title_ru TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cta_subtitle TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cta_subtitle_ru TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cta_button_text TEXT DEFAULT 'Start Now';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cta_button_text_ru TEXT DEFAULT 'Начать сейчас';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS guarantee_text TEXT DEFAULT '30-day money-back guarantee';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS guarantee_text_ru TEXT DEFAULT '30-дневная гарантия возврата';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS includes JSONB DEFAULT '["Lifetime access", "Certificate of completion"]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS includes_ru JSONB DEFAULT '["Пожизненный доступ", "Сертификат об окончании"]';

-- 2. UPDATE MODULE TABLE - add description for curriculum
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS lessons_count_override INTEGER;

-- 3. UPDATE EXISTING COURSES WITH DEFAULT DATA
UPDATE courses SET
  rating = 4.9,
  reviews_count = 120,
  tags = '["Core recovery", "Pelvic floor", "Diastasis work", "Posture support", "Exercises with baby"]',
  tags_ru = '["Восстановление пресса", "Тазовое дно", "Работа с диастазом", "Поддержка осанки", "Занятия с малышом"]',
  features = '["Core recovery", "Pelvic floor", "Diastasis work", "Posture support", "Exercises with baby"]',
  features_ru = '["Восстановление пресса", "Тазовое дно", "Работа с диастазом", "Поддержка осанки", "Занятия с малышом"]',
  instructor_name = 'Aleksandra Khavanskaia',
  instructor_title = 'NASM CPT • CES • PBC • CAPT',
  instructor_title_ru = 'NASM CPT • CES • PBC • CAPT',
  instructor_bio = '17 years of experience. Specializing in recovery programs and body correction.',
  instructor_bio_ru = '17 лет опыта. Специализация на программах восстановления и коррекции тела.',
  cta_title = 'Ready to Start Your Recovery?',
  cta_title_ru = 'Готовы начать восстановление?',
  cta_subtitle = 'Join thousands of women who have already completed this journey',
  cta_subtitle_ru = 'Присоединяйтесь к тысячам женщин, которые уже прошли этот путь',
  includes = '["Lifetime access", "Certificate of completion"]',
  includes_ru = '["Пожизненный доступ", "Сертификат об окончании"]'
WHERE slug = 'cesarean-recovery';

UPDATE courses SET
  rating = 4.8,
  reviews_count = 85,
  tags = '["Phased recovery", "Safe exercises", "Nutrition tips", "Scar care", "Video instructions"]',
  tags_ru = '["Поэтапное восстановление", "Безопасные упражнения", "Рекомендации по питанию", "Уход за швами", "Видео-инструкции"]',
  features = '["Phased recovery", "Safe exercises", "Nutrition tips", "Scar care", "Video instructions"]',
  features_ru = '["Поэтапное восстановление", "Безопасные упражнения", "Рекомендации по питанию", "Уход за швами", "Видео-инструкции"]',
  instructor_name = 'Aleksandra Khavanskaia',
  instructor_title = 'NASM CPT • CES • PBC • CAPT',
  instructor_title_ru = 'NASM CPT • CES • PBC • CAPT',
  instructor_bio = '17 years of experience. Specializing in recovery programs and body correction.',
  instructor_bio_ru = '17 лет опыта. Специализация на программах восстановления и коррекции тела.',
  cta_title = 'Ready to Start Your Recovery?',
  cta_title_ru = 'Готовы начать восстановление?',
  cta_subtitle = 'Join thousands of women who have already completed this journey',
  cta_subtitle_ru = 'Присоединяйтесь к тысячам женщин, которые уже прошли этот путь',
  includes = '["Lifetime access", "Certificate of completion"]',
  includes_ru = '["Пожизненный доступ", "Сертификат об окончании"]'
WHERE slug = 'breast-augmentation-recovery';

-- DONE!
