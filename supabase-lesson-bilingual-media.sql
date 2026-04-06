-- Add secondary video URL for bilingual lesson support
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS video_url_secondary TEXT;
