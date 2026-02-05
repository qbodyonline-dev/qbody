-- FIX: Drop old policies and create new ones
DROP POLICY IF EXISTS "Public read page_blocks" ON page_blocks;
DROP POLICY IF EXISTS "Authenticated manage page_blocks" ON page_blocks;

-- Allow public read
CREATE POLICY "Public read page_blocks" ON page_blocks
  FOR SELECT USING (true);

-- Allow all operations (API uses service role)
CREATE POLICY "Allow all page_blocks" ON page_blocks
  FOR ALL USING (true) WITH CHECK (true);
