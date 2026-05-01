-- ═══════════════════════════════════════════════════════════
-- Documents (PDF / file downloads) feature
-- Admin uploads files, sets free/paid + price, gets a smart link.
-- Smart link `/d/[id]` handles all auth/payment cases.
-- ═══════════════════════════════════════════════════════════

-- 1. Documents (catalog)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_secondary TEXT,
  description TEXT,
  description_secondary TEXT,
  file_path TEXT NOT NULL,        -- path inside private 'documents' bucket
  file_name TEXT NOT NULL,        -- original filename for downloads
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  preview_url TEXT,               -- optional cover image URL
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2),
  is_paid BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- 2. Document purchases (per-user grants)
CREATE TABLE IF NOT EXISTS document_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | refunded | failed
  email_sent_at TIMESTAMPTZ,
  download_count INTEGER NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_purchases_user ON document_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_document_purchases_document ON document_purchases(document_id);
CREATE INDEX IF NOT EXISTS idx_document_purchases_status ON document_purchases(status);
CREATE INDEX IF NOT EXISTS idx_document_purchases_session ON document_purchases(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- One paid purchase per (user, document) — extra paid sessions are dedup'd via stripe_session_id UNIQUE
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_purchases_user_doc_paid
  ON document_purchases(user_id, document_id)
  WHERE status = 'paid';

-- 3. Trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION set_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_documents_updated_at();

DROP TRIGGER IF EXISTS trg_document_purchases_updated_at ON document_purchases;
CREATE TRIGGER trg_document_purchases_updated_at
  BEFORE UPDATE ON document_purchases
  FOR EACH ROW EXECUTE FUNCTION set_documents_updated_at();

-- 4. RLS: tables are accessed only via API (service_role bypasses anyway).
-- Enable RLS but do NOT add public policies — locks down direct client access.
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_purchases ENABLE ROW LEVEL SECURITY;

-- Public can SELECT active documents (for free downloads & metadata on smart link)
DROP POLICY IF EXISTS "documents_public_read_active" ON documents;
CREATE POLICY "documents_public_read_active" ON documents
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can SELECT their own purchases
DROP POLICY IF EXISTS "document_purchases_own_select" ON document_purchases;
CREATE POLICY "document_purchases_own_select" ON document_purchases
  FOR SELECT
  USING (auth.uid() = user_id);
