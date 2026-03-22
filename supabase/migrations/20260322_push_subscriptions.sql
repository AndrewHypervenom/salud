CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint        text NOT NULL,
  p256dh          text NOT NULL,
  auth            text NOT NULL,
  habits_time     time,   -- hora diaria para recordatorio de hábitos, ej: '20:00'
  food_time       time,   -- hora diaria para recordatorio de comida
  timezone        text DEFAULT 'America/Costa_Rica',
  created_at      timestamptz DEFAULT now(),
  UNIQUE (profile_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public access" ON push_subscriptions;
CREATE POLICY "public access" ON push_subscriptions FOR ALL USING (true);
