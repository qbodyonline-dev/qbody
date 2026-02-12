-- Add settings column to site_pages for page-level configuration (bgColor, etc.)
ALTER TABLE site_pages ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
