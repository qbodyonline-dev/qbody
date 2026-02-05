-- =====================================================
-- PAGE BUILDER TABLE FOR STORING PAGE CONTENT
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create page_content table to store page builder blocks
CREATE TABLE IF NOT EXISTS page_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL UNIQUE,
  blocks JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_page_content_slug ON page_content(page_slug);

-- Insert default homepage content
INSERT INTO page_content (page_slug, blocks, is_published)
VALUES ('homepage', '[]', true)
ON CONFLICT (page_slug) DO NOTHING;

-- Enable RLS
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published pages
CREATE POLICY "Public read access for published pages" ON page_content
FOR SELECT USING (is_published = true);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access" ON page_content
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_page_content_updated_at ON page_content;
CREATE TRIGGER trigger_page_content_updated_at
  BEFORE UPDATE ON page_content
  FOR EACH ROW EXECUTE FUNCTION update_page_content_updated_at();
