-- Shared Bookings 1.6E — schedule GYG availability outbox processor (inactive until approved).
-- Mirrors partner notification cron pattern. Delivery still requires:
--   SHARED_BOOKINGS_GYG_NOTIFY_ENABLED=true + notify Basic Auth secrets on the Edge function.
-- This migration only registers the cron job; it does not enable live GYG traffic.

CREATE OR REPLACE FUNCTION public.invoke_process_gyg_availability_outbox()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url TEXT;
  service_key TEXT;
  request_id BIGINT;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO project_url
    FROM vault.decrypted_secrets
    WHERE name = 'project_url'
    LIMIT 1;
    SELECT decrypted_secret INTO service_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
  EXCEPTION WHEN undefined_table OR undefined_object THEN
    RETURN jsonb_build_object('ok', false, 'error', 'vault_unavailable');
  END;

  IF nullif(trim(coalesce(project_url, '')), '') IS NULL
     OR nullif(trim(coalesce(service_key, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'vault_secrets_missing');
  END IF;

  SELECT net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/process-gyg-availability-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('limit', 20)
  ) INTO request_id;

  RETURN jsonb_build_object('ok', true, 'request_id', request_id);
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'invoke_process_gyg_availability_outbox: %', SQLERRM;
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_process_gyg_availability_outbox() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invoke_process_gyg_availability_outbox() TO service_role;

COMMENT ON FUNCTION public.invoke_process_gyg_availability_outbox() IS
  '1.6E cron entry: posts to process-gyg-availability-outbox using Vault project_url + service_role_key. Never logs secret values. Live sends still gated by SHARED_BOOKINGS_GYG_NOTIFY_ENABLED.';

-- Register job only if pg_cron is available. Keep unschedule/recreate idempotent.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'process-gyg-availability-outbox';

    PERFORM cron.schedule(
      'process-gyg-availability-outbox',
      '* * * * *',
      $$SELECT public.invoke_process_gyg_availability_outbox();$$
    );
  END IF;
EXCEPTION WHEN others THEN
  RAISE WARNING 'Could not schedule process-gyg-availability-outbox: %', SQLERRM;
END $$;
