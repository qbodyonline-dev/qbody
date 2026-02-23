-- 008: Subscription access control — auto-expiration of programs
-- Adds 'expired' status to client_programs and index for efficient expiration checks.

-- 1. Drop old CHECK constraint and recreate with 'expired' added
ALTER TABLE client_programs DROP CONSTRAINT IF EXISTS client_programs_status_check;
ALTER TABLE client_programs ADD CONSTRAINT client_programs_status_check
  CHECK (status IN ('active', 'paused', 'completed', 'cancelled', 'expired'));

-- 2. Index for efficient cron expiration queries
CREATE INDEX IF NOT EXISTS idx_cp_active_enddate
  ON client_programs(end_date) WHERE status = 'active';

-- 3. Expire all currently overdue programs in one shot
UPDATE client_programs
SET status = 'expired', updated_at = now()
WHERE status = 'active'
  AND end_date IS NOT NULL
  AND end_date < CURRENT_DATE;
