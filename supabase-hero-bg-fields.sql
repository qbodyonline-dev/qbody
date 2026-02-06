-- Add hero background customization fields to courses table
-- Run this in Supabase SQL Editor

ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_bg_color TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_bg_image_url TEXT;

-- hero_bg_color: CSS color or gradient string (e.g. "#667eea" or "linear-gradient(135deg, #667eea, #764ba2)")
-- hero_bg_image_url: URL to background image (takes priority over color when set)
