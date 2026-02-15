-- Language settings migration
-- Adds 'languages' key to site_settings table (key-value store).
--
-- Value format (jsonb):
-- {
--   "primaryLanguage": "en",
--   "secondaryLanguage": "ru"   -- null for monolingual
-- }
--
-- Supported codes: en, ru, fr, de, uk, it, es, ro
--
-- The existing "_ru" columns (name_ru, description_ru, etc.) in all tables
-- serve as secondary-language storage regardless of which language is chosen.
-- Column name is convention only — no schema migration needed.

INSERT INTO site_settings (key, value, updated_at)
VALUES (
  'languages',
  '{"primaryLanguage": "en", "secondaryLanguage": "ru"}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;
