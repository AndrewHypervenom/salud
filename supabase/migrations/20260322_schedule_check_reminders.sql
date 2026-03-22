-- Habilitar extensiones necesarias para cron + HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Eliminar schedule anterior si existe (idempotente)
SELECT cron.unschedule('check-reminders-every-minute') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-reminders-every-minute'
);

-- Llamar a check-reminders cada minuto
SELECT cron.schedule(
  'check-reminders-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://bfxbzkkresduozdqdjaw.supabase.co/functions/v1/check-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeGJ6a2tyZXNkdW96ZHFkamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTEyMDQsImV4cCI6MjA4OTI2NzIwNH0.-RVh0MVghuyah9eDZpkkoVbpIqoRMe0YgYhaYOjCW04"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
