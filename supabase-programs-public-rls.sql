-- =====================================================
-- PUBLIC READ POLICIES FOR PROGRAMS CATALOG
-- Run this in Supabase SQL Editor
-- =====================================================
-- Allows anonymous/public users to view program schedule
-- (days and workout names) for active programs in the catalog.
-- Without these policies, the public programs page shows
-- no schedule because program_days and workouts RLS
-- requires client_programs purchase (auth.uid() check).
-- =====================================================

-- 1. Allow public to view program days for active programs
DROP POLICY IF EXISTS pd_public_read ON program_days;
CREATE POLICY pd_public_read ON program_days
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM training_programs tp
      WHERE tp.id = program_days.program_id
      AND tp.is_active = true
    )
  );

-- 2. Allow public to view workouts that are part of active programs
-- (only basic info: name, type, duration — API limits fields in SELECT)
DROP POLICY IF EXISTS workouts_public_read ON workouts;
CREATE POLICY workouts_public_read ON workouts
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_days pd
      JOIN training_programs tp ON tp.id = pd.program_id
      WHERE pd.workout_id = workouts.id
      AND tp.is_active = true
    )
  );

-- =====================================================
-- DONE! After applying these policies, the public
-- programs API can use anon key instead of service_role.
-- =====================================================
