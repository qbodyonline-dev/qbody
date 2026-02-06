-- Add phone column to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
