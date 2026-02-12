-- Site Pages table for multi-page support
CREATE TABLE IF NOT EXISTS site_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  title_ru TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_homepage BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default home page
INSERT INTO site_pages (slug, title, title_ru, is_published, is_homepage, sort_order)
VALUES ('home', 'Home', 'Главная', true, true, 0)
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

-- Public can read published pages
CREATE POLICY "Public can read published pages" ON site_pages
  FOR SELECT USING (is_published = true);

-- Service role can do anything (admin API uses service_role key)
CREATE POLICY "Service role full access" ON site_pages
  FOR ALL USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON site_pages(slug);
CREATE INDEX IF NOT EXISTS idx_site_pages_sort ON site_pages(sort_order);
