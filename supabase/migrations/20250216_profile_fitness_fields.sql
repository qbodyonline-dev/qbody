-- ═══════════════════════════════════════════════════════════
-- Add ALL onboarding/fitness fields to profiles table
-- So data is accessible from both site and mobile app
-- ═══════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_weight NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_experience TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_front TEXT;
