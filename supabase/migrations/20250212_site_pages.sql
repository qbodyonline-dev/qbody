-- ═══════════ SITE PAGES TABLE ═══════════
-- Multi-page support for the page builder

CREATE TABLE IF NOT EXISTS site_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  title_ru VARCHAR(200) NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_homepage BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON site_pages(slug);
CREATE INDEX IF NOT EXISTS idx_site_pages_published ON site_pages(is_published);

-- Enable RLS
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

-- Public can read published pages
CREATE POLICY "Public can read published pages" ON site_pages
  FOR SELECT USING (is_published = true);

-- Service role can do everything (admin API uses service_role key)
CREATE POLICY "Service role full access" ON site_pages
  FOR ALL USING (true) WITH CHECK (true);

-- Seed the homepage
INSERT INTO site_pages (slug, title, title_ru, is_published, is_homepage, sort_order)
VALUES ('home', 'Home', 'Главная', true, true, 0)
ON CONFLICT (slug) DO NOTHING;
