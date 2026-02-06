-- Add data column to page_blocks for structured data (header, hero, about)
-- And items column for structured items (courses, programs, results)
-- Run in Supabase SQL Editor

ALTER TABLE page_blocks ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE page_blocks ADD COLUMN IF NOT EXISTS items JSONB;

NOTIFY pgrst, 'reload schema';
