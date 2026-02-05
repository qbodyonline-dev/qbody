-- =====================================================
-- PAGE BUILDER DATA STORAGE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Table for storing page builder blocks
CREATE TABLE IF NOT EXISTS page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL DEFAULT 'home',
  block_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  label TEXT NOT NULL,
  label_ru TEXT,
  visible BOOLEAN DEFAULT true,
  content_en TEXT,
  content_ru TEXT,
  style JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_slug, block_id)
);

-- Enable RLS
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

-- Allow public read for published pages
CREATE POLICY "Public read page_blocks" ON page_blocks
  FOR SELECT USING (true);

-- Allow authenticated users to manage
CREATE POLICY "Authenticated manage page_blocks" ON page_blocks
  FOR ALL USING (auth.role() = 'authenticated');

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_page_blocks_slug ON page_blocks(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_blocks_sort ON page_blocks(page_slug, sort_order);
