-- B2B.7.1: Autonomous notification delivery.
-- Cron already schedules process-notification-outbox every minute.
-- This migration hardens reclaim of stuck rows, improves invoke diagnostics,
-- and adds admin visibility for failed/stuck outbox items.
-- Vault secrets (project_url, service_role_key) are configured out-of-band —
-- never store service_role in migration files.

CREATE OR REPLACE FUNCTION public.reclaim_stale_notification_outbox(
  p_stale_after INTERVAL DEFAULT interval '5 minutes'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INTEGER;
BEGIN
  UPDATE public.notification_outbox
  SET
    status = 'failed',
    last_error = left(coalesce(last_error || ' | ', '') || 'stale_processing_reclaimed', 2000),
    next_attempt_at = NOW(),
    updated_at = NOW()
  WHERE status = 'processing'
    AND updated_at < NOW() - p_stale_after;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.reclaim_stale_notification_outbox(INTERVAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reclaim_stale_notification_outbox(INTERVAL) TO service_role;

-- Claim now reclaims stale processing rows first.
CREATE OR REPLACE FUNCTION public.claim_notification_outbox(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.notification_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.reclaim_stale_notification_outbox(interval '5 minutes');

  RETURN QUERY
  WITH due AS (
    SELECT id
    FROM public.notification_outbox
    WHERE status IN ('pending', 'failed')
      AND next_attempt_at <= NOW()
      AND attempt_count < max_attempts
    ORDER BY next_attempt_at ASC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(least(coalesce(p_limit, 20), 50), 1)
  )
  UPDATE public.notification_outbox o
  SET
    status = 'processing',
    attempt_count = o.attempt_count + 1,
    updated_at = NOW()
  FROM due
  WHERE o.id = due.id
  RETURNING o.*;
END;
$$;

-- Invoke returns JSON diagnostics (never includes secret values).
-- Must DROP first: return type changes from BIGINT → JSONB.
DROP FUNCTION IF EXISTS public.invoke_process_notification_outbox();

CREATE OR REPLACE FUNCTION public.invoke_process_notification_outbox()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  project_url TEXT;
  secret_key TEXT;
  req_id BIGINT;
  reclaimed INTEGER := 0;
BEGIN
  reclaimed := public.reclaim_stale_notification_outbox(interval '5 minutes');

  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO secret_key
  FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  IF project_url IS NULL OR length(trim(project_url)) = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'vault_project_url_missing',
      'reclaimed', reclaimed
    );
  END IF;
  IF secret_key IS NULL OR length(trim(secret_key)) = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'vault_service_role_key_missing',
      'reclaimed', reclaimed
    );
  END IF;

  SELECT net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/process-notification-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret_key,
      'apikey', secret_key
    ),
    body := jsonb_build_object('source', 'pg_cron', 'limit', 25),
    timeout_milliseconds := 15000
  ) INTO req_id;

  RETURN jsonb_build_object(
    'ok', true,
    'request_id', req_id,
    'reclaimed', reclaimed
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN jsonb_build_object('ok', false, 'error', 'vault_or_pg_net_unavailable', 'reclaimed', reclaimed);
  WHEN others THEN
    -- Do not include SQLERRM if it might echo secrets; keep generic + SQLSTATE.
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'invoke_failed',
      'sqlstate', SQLSTATE,
      'reclaimed', reclaimed
    );
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_process_notification_outbox() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invoke_process_notification_outbox() TO service_role;

-- Admin health: failed / dead / stuck / overdue pending (no payloads with other-company secrets beyond needed).
CREATE OR REPLACE FUNCTION public.admin_list_notification_outbox_problems(
  p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  result JSONB;
BEGIN
  IF uid IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  SELECT coalesce(jsonb_agg(row_to_json(x)::jsonb ORDER BY x.priority ASC, x.updated_at DESC), '[]'::jsonb)
  INTO result
  FROM (
    SELECT *
    FROM (
      SELECT
        o.id,
        o.template_key,
        o.recipient_email,
        o.recipient_role,
        o.status,
        o.attempt_count,
        o.max_attempts,
        o.last_error,
        o.next_attempt_at,
        o.created_at,
        o.updated_at,
        o.sent_at,
        o.partner_booking_request_id,
        r.reference AS request_reference,
        r.status AS request_status,
        c.name AS company_name,
        CASE
          WHEN o.status = 'dead' THEN 1
          WHEN o.status = 'failed' THEN 2
          WHEN o.status = 'processing' AND o.updated_at < NOW() - interval '5 minutes' THEN 3
          WHEN o.status = 'pending' AND o.created_at < NOW() - interval '10 minutes' THEN 4
          ELSE 9
        END AS priority,
        CASE
          WHEN o.status = 'dead' THEN 'dead'
          WHEN o.status = 'failed' THEN 'failed'
          WHEN o.status = 'processing' AND o.updated_at < NOW() - interval '5 minutes' THEN 'stuck_processing'
          WHEN o.status = 'pending' AND o.created_at < NOW() - interval '10 minutes' THEN 'overdue_pending'
          ELSE o.status
        END AS problem
      FROM public.notification_outbox o
      LEFT JOIN public.partner_booking_requests r ON r.id = o.partner_booking_request_id
      LEFT JOIN public.partner_companies c ON c.id = o.partner_company_id
      WHERE
        o.status IN ('failed', 'dead')
        OR (o.status = 'processing' AND o.updated_at < NOW() - interval '5 minutes')
        OR (o.status = 'pending' AND o.created_at < NOW() - interval '10 minutes'
            AND o.next_attempt_at <= NOW())
    ) ranked
    ORDER BY ranked.priority ASC, ranked.updated_at DESC
    LIMIT greatest(least(coalesce(p_limit, 50), 100), 1)
  ) x;

  RETURN jsonb_build_object(
    'ok', true,
    'count', jsonb_array_length(result),
    'items', result,
    'cron_configured', EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'process-notification-outbox' AND active
    ),
    'vault_project_url_present', EXISTS (
      SELECT 1 FROM vault.decrypted_secrets WHERE name = 'project_url' AND length(trim(decrypted_secret)) > 0
    ),
    'vault_service_role_present', EXISTS (
      SELECT 1 FROM vault.decrypted_secrets WHERE name = 'service_role_key' AND length(trim(decrypted_secret)) > 0
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_notification_outbox_problems(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_notification_outbox_problems(INTEGER) TO authenticated;

-- Ensure cron job is present and active every minute.
DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'process-notification-outbox';
EXCEPTION WHEN undefined_table THEN
  NULL;
WHEN others THEN
  NULL;
END $$;

SELECT cron.schedule(
  'process-notification-outbox',
  '* * * * *',
  $$SELECT public.invoke_process_notification_outbox();$$
);

COMMENT ON FUNCTION public.invoke_process_notification_outbox() IS
  'B2B.7.1 cron entry: posts to process-notification-outbox using Vault project_url + service_role_key. Never logs secret values.';
