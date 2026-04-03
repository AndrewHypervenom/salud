-- Migration: add login_logs table for admin analytics
-- Run in Supabase SQL Editor before deploying code changes

CREATE TABLE IF NOT EXISTS login_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_at  timestamptz NOT NULL DEFAULT now(),
  source     text        NOT NULL DEFAULT 'pin'
             CHECK (source IN ('pin', 'no_pin'))
);

CREATE INDEX IF NOT EXISTS login_logs_profile_id_idx
  ON login_logs (profile_id, logged_at DESC);
