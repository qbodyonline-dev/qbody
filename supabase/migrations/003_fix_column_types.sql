-- ═══════════════════════════════════════════════════════════════
-- Fix full_description columns: text → jsonb
-- The BlockEditor saves Block[] arrays; text columns return strings
-- which crash the frontend. JSONB returns parsed JS objects.
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Convert existing text data to jsonb safely
ALTER TABLE training_programs 
  ALTER COLUMN full_description TYPE jsonb USING (
    CASE 
      WHEN full_description IS NULL THEN NULL
      WHEN full_description::text ~ '^\[' THEN full_description::jsonb
      ELSE NULL
    END
  );

ALTER TABLE training_programs 
  ALTER COLUMN full_description_secondary TYPE jsonb USING (
    CASE 
      WHEN full_description_secondary IS NULL THEN NULL
      WHEN full_description_secondary::text ~ '^\[' THEN full_description_secondary::jsonb
      ELSE NULL
    END
  );

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'training_programs'
  AND column_name IN ('full_description', 'full_description_secondary');
