-- =====================================================
-- SUPABASE STORAGE BUCKET FOR EXERCISE VIDEOS
-- Run in Supabase SQL Editor if bucket doesn't auto-create
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('content-videos', 'content-videos', true, 104857600)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 104857600;

-- Public read access
CREATE POLICY "Public read videos" ON storage.objects
FOR SELECT USING (bucket_id = 'content-videos');

-- Service role upload
CREATE POLICY "Service upload videos" ON storage.objects
FOR INSERT TO service_role
WITH CHECK (bucket_id = 'content-videos');

-- Service role update
CREATE POLICY "Service update videos" ON storage.objects
FOR UPDATE TO service_role
USING (bucket_id = 'content-videos');

-- Service role delete
CREATE POLICY "Service delete videos" ON storage.objects
FOR DELETE TO service_role
USING (bucket_id = 'content-videos');
