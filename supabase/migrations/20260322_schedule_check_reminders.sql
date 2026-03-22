-- Habilitar extensiones necesarias para cron + HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Eliminar schedule anterior si existe (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-reminders-every-minute') THEN
    PERFORM cron.unschedule('check-reminders-every-minute');
  END IF;
END $$;

-- Llamar a check-reminders cada minuto (sin Authorization, función deployada con --no-verify-jwt)
SELECT cron.schedule(
  'check-reminders-every-minute',
  '* * * * *',
  $$SELECT net.http_post(url := 'https://bfxbzkkresduozdqdjaw.supabase.co/functions/v1/check-reminders', headers := '{"Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) AS request_id;$$
);
