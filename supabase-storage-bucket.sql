-- =====================================================
-- SUPABASE STORAGE BUCKET FOR COURSE ASSETS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create storage bucket for course assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'course-assets');

-- Allow authenticated uploads (service role)
CREATE POLICY "Service role upload access" ON storage.objects
FOR INSERT TO service_role
WITH CHECK (bucket_id = 'course-assets');

-- Allow authenticated updates
CREATE POLICY "Service role update access" ON storage.objects
FOR UPDATE TO service_role
USING (bucket_id = 'course-assets');

-- Allow authenticated deletes
CREATE POLICY "Service role delete access" ON storage.objects
FOR DELETE TO service_role
USING (bucket_id = 'course-assets');
