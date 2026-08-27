-- ═══════════════════════════════════════════════════════════
-- PERSONAL ASSIGNMENTS — FREE OR PAID
-- Run this in the Supabase SQL Editor (already applied on 2026-08-27).
--
-- Handing a course / program to a specific client has two flavours:
--   mode='free' — access is granted right away
--                 (a course_access / client_programs row is written too)
--   mode='paid' — the client can SEE and BUY it; access arrives the usual
--                 way, through the Stripe webhook
--
-- The table is therefore about *visibility + intent*, while access itself
-- keeps living in course_access / client_programs.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.client_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  program_id  uuid REFERENCES public.training_programs(id) ON DELETE CASCADE,
  mode        text NOT NULL DEFAULT 'free' CHECK (mode IN ('free', 'paid')),
  assigned_by uuid REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_assignments_one_target CHECK (
    (course_id IS NOT NULL AND program_id IS NULL) OR
    (course_id IS NULL AND program_id IS NOT NULL)
  )
);

-- Full (not partial) indexes: ON CONFLICT (client_id, course_id) can infer them.
-- NULLs are distinct, so a client may still hold many course rows (program_id
-- NULL) and many program rows (course_id NULL).
CREATE UNIQUE INDEX IF NOT EXISTS client_assignments_course_uniq
  ON public.client_assignments(client_id, course_id);
CREATE UNIQUE INDEX IF NOT EXISTS client_assignments_program_uniq
  ON public.client_assignments(client_id, program_id);
CREATE INDEX IF NOT EXISTS client_assignments_client_idx ON public.client_assignments(client_id);

ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;

-- Clients may read their own assignments; every write goes through service_role.
DROP POLICY IF EXISTS assignments_select_own ON public.client_assignments;
CREATE POLICY assignments_select_own ON public.client_assignments
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- ─── Visibility policies now also honour an assignment ───
-- (these replace the versions from 20260827_private_courses_programs.sql)

DROP POLICY IF EXISTS courses_hide_private ON public.courses;
CREATE POLICY courses_hide_private ON public.courses
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (
    is_private = FALSE
    OR EXISTS (
      SELECT 1 FROM public.course_access ca
      WHERE ca.user_id = auth.uid() AND ca.course_slug = courses.slug AND ca.is_active
    )
    OR EXISTS (
      SELECT 1 FROM public.client_assignments a
      WHERE a.client_id = auth.uid() AND a.course_id = courses.id
    )
  );

DROP POLICY IF EXISTS course_modules_hide_private ON public.course_modules;
CREATE POLICY course_modules_hide_private ON public.course_modules
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_modules.course_id
        AND (
          c.is_private = FALSE
          OR EXISTS (
            SELECT 1 FROM public.course_access ca
            WHERE ca.user_id = auth.uid() AND ca.course_slug = c.slug AND ca.is_active
          )
          OR EXISTS (
            SELECT 1 FROM public.client_assignments a
            WHERE a.client_id = auth.uid() AND a.course_id = c.id
          )
        )
    )
  );

DROP POLICY IF EXISTS course_lessons_hide_private ON public.course_lessons;
CREATE POLICY course_lessons_hide_private ON public.course_lessons
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = course_lessons.module_id
        AND (
          c.is_private = FALSE
          OR EXISTS (
            SELECT 1 FROM public.course_access ca
            WHERE ca.user_id = auth.uid() AND ca.course_slug = c.slug AND ca.is_active
          )
          OR EXISTS (
            SELECT 1 FROM public.client_assignments a
            WHERE a.client_id = auth.uid() AND a.course_id = c.id
          )
        )
    )
  );

DROP POLICY IF EXISTS programs_hide_private ON public.training_programs;
CREATE POLICY programs_hide_private ON public.training_programs
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (
    is_private = FALSE
    OR EXISTS (
      SELECT 1 FROM public.client_programs cp
      WHERE cp.program_id = training_programs.id
        AND cp.client_id = auth.uid() AND cp.status <> 'cancelled'
    )
    OR EXISTS (
      SELECT 1 FROM public.client_assignments a
      WHERE a.client_id = auth.uid() AND a.program_id = training_programs.id
    )
  );

DROP POLICY IF EXISTS pd_hide_private ON public.program_days;
CREATE POLICY pd_hide_private ON public.program_days
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.training_programs tp
      WHERE tp.id = program_days.program_id
        AND (
          tp.is_private = FALSE
          OR EXISTS (
            SELECT 1 FROM public.client_programs cp
            WHERE cp.program_id = tp.id AND cp.client_id = auth.uid() AND cp.status <> 'cancelled'
          )
          OR EXISTS (
            SELECT 1 FROM public.client_assignments a
            WHERE a.client_id = auth.uid() AND a.program_id = tp.id
          )
        )
    )
  );

-- ═══════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════
