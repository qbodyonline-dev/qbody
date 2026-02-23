-- 006: Add program_id to orders table for training program purchases
-- Orders table currently only tracks course purchases (course_slug).
-- This adds program_id so we can track training program purchases too.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES training_programs(id) ON DELETE SET NULL;

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_orders_program_id ON orders(program_id) WHERE program_id IS NOT NULL;
