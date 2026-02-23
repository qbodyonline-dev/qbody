-- 007: Allow multiple active programs per client
-- Old constraint: only ONE active program per client (any program)
-- New constraint: only ONE active enrollment per client PER program

-- Drop the old restrictive unique index
DROP INDEX IF EXISTS idx_cp_active_unique;

-- New index: prevents duplicate active enrollments for the SAME program,
-- but allows a client to be enrolled in multiple different programs simultaneously
CREATE UNIQUE INDEX IF NOT EXISTS idx_cp_active_per_program
  ON client_programs(client_id, program_id) WHERE status = 'active';
