-- =====================================================
-- COURSE ACCESS UPDATE SCHEMA
-- Adds is_active field for subscription management
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add is_active column to course_access table
ALTER TABLE course_access ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_access_user_active ON course_access(user_id, is_active);

-- Update existing records to have is_active = true
UPDATE course_access SET is_active = true WHERE is_active IS NULL;

-- DONE!
