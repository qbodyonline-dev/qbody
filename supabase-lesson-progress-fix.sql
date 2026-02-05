-- =====================================================
-- FIX LESSON_PROGRESS TABLE
-- The table references lessons(id) but we use course_lessons table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Option 1: Create new progress table for course_lessons
-- (Safer - doesn't break existing data if lessons table is used elsewhere)

-- Drop old table if exists and recreate with correct reference
DROP TABLE IF EXISTS public.course_lesson_progress;

CREATE TABLE public.course_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, lesson_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_lesson_progress_client ON course_lesson_progress(client_id);
CREATE INDEX IF NOT EXISTS idx_course_lesson_progress_lesson ON course_lesson_progress(lesson_id);

-- Enable RLS
ALTER TABLE public.course_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Policies for clients to manage their own progress
CREATE POLICY "Clients can view their own progress" 
    ON public.course_lesson_progress FOR SELECT 
    USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert their own progress" 
    ON public.course_lesson_progress FOR INSERT 
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own progress" 
    ON public.course_lesson_progress FOR UPDATE 
    USING (auth.uid() = client_id);

-- Service role full access (for API)
CREATE POLICY "Service role full access to progress"
    ON public.course_lesson_progress FOR ALL
    TO service_role
    USING (true);

-- Admins can view all progress
CREATE POLICY "Admins can view all progress" 
    ON public.course_lesson_progress FOR SELECT 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- DONE!
-- After running this, the API will use course_lesson_progress table
