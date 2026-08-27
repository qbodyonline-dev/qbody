-- ═══════════════════════════════════════════════════════════
-- PRIVATE (HIDDEN) COURSES & PROGRAMS
-- Run this in the Supabase SQL Editor.
--
-- A private course / program is not listed anywhere in the public
-- catalog and is not reachable by its direct link — only clients it
-- was explicitly assigned to (and admins/trainers) can see and open it.
--
-- Assignment reuses the existing access tables:
--   courses            -> course_access   (user_id, course_slug)
--   training_programs  -> client_programs (client_id, program_id)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Flags ───
ALTER TABLE public.courses           ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.training_programs ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS courses_is_private_idx           ON public.courses(is_private)           WHERE is_private;
CREATE INDEX IF NOT EXISTS training_programs_is_private_idx ON public.training_programs(is_private) WHERE is_private;

-- ─── 2. RLS ───
-- The API routes already filter private rows out, these policies are the
-- second line of defence: they also cover direct PostgREST reads with the
-- public anon key (which ships inside the mobile app).
--
-- RESTRICTIVE policies are AND-ed with every existing permissive policy,
-- so nothing existing has to be dropped or renamed.
-- service_role bypasses RLS, so admin/server routes are unaffected.

DROP POLICY IF EXISTS courses_hide_private ON public.courses;
CREATE POLICY courses_hide_private ON public.courses
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (
    is_private = FALSE
    OR EXISTS (
      SELECT 1 FROM public.course_access ca
      WHERE ca.user_id = auth.uid()
        AND ca.course_slug = courses.slug
        AND ca.is_active
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
            WHERE ca.user_id = auth.uid()
              AND ca.course_slug = c.slug
              AND ca.is_active
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
            WHERE ca.user_id = auth.uid()
              AND ca.course_slug = c.slug
              AND ca.is_active
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
        AND cp.client_id = auth.uid()
        AND cp.status <> 'cancelled'
    )
  );

-- program_days has an anon-read policy (pd_public_read) for the public
-- catalog — make sure it can't leak the schedule of a private program.
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
            WHERE cp.program_id = tp.id
              AND cp.client_id = auth.uid()
        AND cp.status <> 'cancelled'
          )
        )
    )
  );

-- ═══════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════
