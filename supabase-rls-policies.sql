-- =============================================
-- RLS (Row Level Security) Policies for QBody
-- Run this in Supabase SQL Editor
-- =============================================
-- This ensures that even with the anon key,
-- unauthorized users cannot INSERT/UPDATE/DELETE data.
-- API routes use service_role which bypasses RLS.
-- =============================================

-- ─── 1. site_settings ───
-- Public: read-only via anon key (for frontend rendering)
-- Write: only via service_role (API routes with admin auth)

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read of settings" ON public.site_settings;
DROP POLICY IF EXISTS "Deny anon write to settings" ON public.site_settings;

-- Allow anyone to read settings (needed for frontend)
CREATE POLICY "Allow public read of settings"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (true);

-- No INSERT/UPDATE/DELETE policies for anon = denied by default
-- service_role bypasses RLS, so admin API routes still work


-- ─── 2. page_content ───
-- Public: read-only (for dynamic pages)
-- Write: only via service_role

ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of pages" ON public.page_content;

CREATE POLICY "Allow public read of pages"
ON public.page_content FOR SELECT
TO anon, authenticated
USING (true);


-- ─── 3. page_blocks ───
-- Public: read-only (for page builder content)
-- Write: only via service_role

ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of page blocks" ON public.page_blocks;

CREATE POLICY "Allow public read of page blocks"
ON public.page_blocks FOR SELECT
TO anon, authenticated
USING (true);


-- ─── 4. courses ───
-- Public: read only published courses (for course pages)
-- Admin routes use service_role (bypass)

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of published courses" ON public.courses;

CREATE POLICY "Allow public read of published courses"
ON public.courses FOR SELECT
TO anon, authenticated
USING (is_published = true);


-- ─── 5. course_modules ───
-- Public: read only published modules
-- Admin routes use service_role (bypass)

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of published modules" ON public.course_modules;

CREATE POLICY "Allow public read of published modules"
ON public.course_modules FOR SELECT
TO anon, authenticated
USING (is_published = true);


-- ─── 6. course_lessons ───
-- Public: read only published lessons
-- Admin routes use service_role (bypass)

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of published lessons" ON public.course_lessons;

CREATE POLICY "Allow public read of published lessons"
ON public.course_lessons FOR SELECT
TO anon, authenticated
USING (is_published = true);


-- ─── 7. profiles ───
-- Authenticated users: can read own profile
-- No public access to profiles
-- Admin routes use service_role (bypass)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- ─── 8. course_access ───
-- Authenticated users: can read own access records
-- No public access
-- Admin routes use service_role (bypass)

ALTER TABLE public.course_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own course access" ON public.course_access;

CREATE POLICY "Users can read own course access"
ON public.course_access FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


-- ─── 9. orders ───
-- Authenticated users: can read own orders
-- No public access
-- Admin routes use service_role (bypass)

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;

CREATE POLICY "Users can read own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


-- ─── 10. conversations ───
-- Authenticated users: can read own conversations
-- Admin routes use service_role (bypass)

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own conversations" ON public.conversations;

CREATE POLICY "Users can read own conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = client_id);


-- ─── 11. messages ───
-- Authenticated users: can read messages from own conversations
-- Admin routes use service_role (bypass)

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own conversation messages" ON public.messages;

CREATE POLICY "Users can read own conversation messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.client_id = auth.uid()
  )
);


-- ─── 12. course_lesson_progress ───
-- Authenticated users: can read/write own progress
-- Admin routes use service_role (bypass)

ALTER TABLE public.course_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own progress" ON public.course_lesson_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.course_lesson_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.course_lesson_progress;

CREATE POLICY "Users can read own progress"
ON public.course_lesson_progress FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

CREATE POLICY "Users can insert own progress"
ON public.course_lesson_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own progress"
ON public.course_lesson_progress FOR UPDATE
TO authenticated
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);


-- ─── 13. rate_limits (from Stage 4) ───
-- Already secured: RLS enabled, no policies = only service_role access
-- Verify:
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;


-- =============================================
-- VERIFICATION: Check all tables have RLS enabled
-- =============================================
-- Run this query to verify:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';
--
-- All tables should show rowsecurity = true
-- =============================================
