-- ═══════════════════════════════════════════════════════════
-- Trainer Notifications table
-- Stores auto-generated alerts (missed checkins, etc.)
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trainer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'missed_checkin',
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tn_is_read ON trainer_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_tn_type ON trainer_notifications(type);
CREATE INDEX IF NOT EXISTS idx_tn_created ON trainer_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tn_client ON trainer_notifications(client_id);

-- RLS — only admins/trainers can access
ALTER TABLE trainer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers and admins can view notifications"
  ON trainer_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'trainer')
    )
  );

CREATE POLICY "Admins can insert notifications"
  ON trainer_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'trainer')
    )
  );

CREATE POLICY "Trainers and admins can update notifications"
  ON trainer_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'trainer')
    )
  );

CREATE POLICY "Trainers and admins can delete notifications"
  ON trainer_notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'trainer')
    )
  );
