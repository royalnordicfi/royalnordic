-- Google Calendar sync + admin departure reminders (outbox architecture).
-- Production sync/reminders stay OFF until explicitly enabled in google_calendar_settings.
-- Never blocks customer checkout; enqueue is best-effort from app/webhook.

-- ---------------------------------------------------------------------------
-- Booking sync columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_sync_status TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_sync_error TEXT;

COMMENT ON COLUMN public.bookings.google_event_id IS 'Google Calendar event id for this booking; unique when set';
COMMENT ON COLUMN public.bookings.google_calendar_sync_status IS 'synced | pending | needs_departure_time | skipped | error | deleted';

CREATE UNIQUE INDEX IF NOT EXISTS bookings_google_event_id_uidx
  ON public.bookings (google_event_id)
  WHERE google_event_id IS NOT NULL AND length(trim(google_event_id)) > 0;

-- ---------------------------------------------------------------------------
-- Connection / settings (singleton row id=1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_calendar_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  calendar_id TEXT,
  connected_email TEXT,
  refresh_token_ciphertext TEXT,
  token_expires_at TIMESTAMPTZ,
  access_token_ciphertext TEXT,
  scopes TEXT,
  calendar_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  reminders_enabled BOOLEAN NOT NULL DEFAULT false,
  admin_reminder_email TEXT,
  connected_at TIMESTAMPTZ,
  connected_by UUID,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.google_calendar_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.google_calendar_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS google_calendar_settings_admin_all ON public.google_calendar_settings;
CREATE POLICY google_calendar_settings_admin_all
  ON public.google_calendar_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service role bypasses RLS; never expose ciphertext to anon.

-- ---------------------------------------------------------------------------
-- Calendar sync outbox
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_sync_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('upsert', 'delete')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'dead', 'skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 8,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS calendar_sync_outbox_idempotency_uidx
  ON public.calendar_sync_outbox (idempotency_key);

CREATE INDEX IF NOT EXISTS calendar_sync_outbox_due_idx
  ON public.calendar_sync_outbox (status, next_attempt_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.calendar_sync_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_sync_outbox_admin_select ON public.calendar_sync_outbox;
CREATE POLICY calendar_sync_outbox_admin_select
  ON public.calendar_sync_outbox
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin departure reminder outbox
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_reminder_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reminder_kind TEXT NOT NULL CHECK (reminder_kind IN ('24h', '10h', '6h')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'dead', 'cancelled', 'skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 6,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  provider_message_id TEXT,
  recipient_email TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS booking_reminder_outbox_idempotency_uidx
  ON public.booking_reminder_outbox (idempotency_key);

-- At most one active (unsent) reminder per booking + kind.
CREATE UNIQUE INDEX IF NOT EXISTS booking_reminder_outbox_active_kind_uidx
  ON public.booking_reminder_outbox (booking_id, reminder_kind)
  WHERE status IN ('pending', 'failed', 'processing');

CREATE INDEX IF NOT EXISTS booking_reminder_outbox_due_idx
  ON public.booking_reminder_outbox (status, next_attempt_at, scheduled_for)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.booking_reminder_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS booking_reminder_outbox_admin_select ON public.booking_reminder_outbox;
CREATE POLICY booking_reminder_outbox_admin_select
  ON public.booking_reminder_outbox
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Enqueue helpers (SECURITY DEFINER; callable by authenticated admin + service)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_calendar_sync(
  p_booking_id BIGINT,
  p_action TEXT DEFAULT 'upsert'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT := lower(trim(coalesce(p_action, 'upsert')));
  v_key TEXT;
  v_id UUID;
  v_status TEXT;
  v_deleted TIMESTAMPTZ;
BEGIN
  IF v_action NOT IN ('upsert', 'delete') THEN
    RAISE EXCEPTION 'invalid_action';
  END IF;

  SELECT status, deleted_at INTO v_status, v_deleted
  FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Cancelled / soft-deleted always delete from calendar.
  IF v_status = 'cancelled' OR v_deleted IS NOT NULL THEN
    v_action := 'delete';
  ELSIF v_status <> 'confirmed' THEN
    -- Only confirmed bookings get calendar events.
    v_action := 'delete';
  END IF;

  -- Version-less stable keys per booking+action so retries coalesce.
  v_key := 'gcal:booking:' || p_booking_id::text || ':' || v_action;

  INSERT INTO public.calendar_sync_outbox (idempotency_key, booking_id, action, status, next_attempt_at)
  VALUES (v_key, p_booking_id, v_action, 'pending', now())
  ON CONFLICT (idempotency_key) DO UPDATE
    SET
      status = CASE
        WHEN public.calendar_sync_outbox.status IN ('sent', 'skipped', 'dead') THEN 'pending'
        ELSE public.calendar_sync_outbox.status
      END,
      next_attempt_at = CASE
        WHEN public.calendar_sync_outbox.status IN ('sent', 'skipped', 'dead', 'failed') THEN now()
        ELSE public.calendar_sync_outbox.next_attempt_at
      END,
      attempt_count = CASE
        WHEN public.calendar_sync_outbox.status IN ('sent', 'skipped', 'dead') THEN 0
        ELSE public.calendar_sync_outbox.attempt_count
      END,
      last_error = NULL,
      updated_at = now(),
      completed_at = NULL
  RETURNING id INTO v_id;

  -- Opposite action becomes obsolete.
  IF v_action = 'upsert' THEN
    UPDATE public.calendar_sync_outbox
    SET status = 'skipped', updated_at = now(), completed_at = now(), last_error = 'superseded_by_upsert'
    WHERE booking_id = p_booking_id AND action = 'delete' AND status IN ('pending', 'failed');
  ELSE
    UPDATE public.calendar_sync_outbox
    SET status = 'skipped', updated_at = now(), completed_at = now(), last_error = 'superseded_by_delete'
    WHERE booking_id = p_booking_id AND action = 'upsert' AND status IN ('pending', 'failed');
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_calendar_sync(BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_calendar_sync(BIGINT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cancel_booking_reminders(p_booking_id BIGINT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INTEGER;
BEGIN
  UPDATE public.booking_reminder_outbox
  SET
    status = 'cancelled',
    cancelled_at = now(),
    updated_at = now(),
    last_error = coalesce(last_error, 'booking_cancelled_or_rescheduled')
  WHERE booking_id = p_booking_id
    AND status IN ('pending', 'failed');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_booking_reminders(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking_reminders(BIGINT) TO authenticated, service_role;

-- Schedule 24h/10h/6h reminders from an absolute departure timestamptz (Helsinki-resolved by caller).
CREATE OR REPLACE FUNCTION public.schedule_booking_reminders(
  p_booking_id BIGINT,
  p_departure_at TIMESTAMPTZ,
  p_recipient_email TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_deleted TIMESTAMPTZ;
  v_email TEXT;
  v_kind TEXT;
  v_hours INTEGER;
  v_when TIMESTAMPTZ;
  v_key TEXT;
  n INTEGER := 0;
BEGIN
  IF p_departure_at IS NULL THEN
    PERFORM public.cancel_booking_reminders(p_booking_id);
    RETURN 0;
  END IF;

  SELECT status, deleted_at INTO v_status, v_deleted
  FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND OR v_status <> 'confirmed' OR v_deleted IS NOT NULL THEN
    PERFORM public.cancel_booking_reminders(p_booking_id);
    RETURN 0;
  END IF;

  SELECT coalesce(
    nullif(trim(p_recipient_email), ''),
    nullif(trim(admin_reminder_email), ''),
    'contact@royalnordic.fi'
  )
  INTO v_email
  FROM public.google_calendar_settings WHERE id = 1;

  -- Reschedule: cancel unsent, then insert fresh windows.
  PERFORM public.cancel_booking_reminders(p_booking_id);

  FOR v_kind, v_hours IN
    SELECT * FROM (VALUES ('24h', 24), ('10h', 10), ('6h', 6)) AS t(kind, hours)
  LOOP
    v_when := p_departure_at - make_interval(hours => v_hours);
    -- Skip windows already in the past (do not backfill spam).
    IF v_when <= now() - interval '2 minutes' THEN
      CONTINUE;
    END IF;

    v_key := 'reminder:' || p_booking_id::text || ':' || v_kind || ':'
      || to_char(p_departure_at AT TIME ZONE 'UTC', 'YYYYMMDDHH24MI');

    INSERT INTO public.booking_reminder_outbox (
      idempotency_key, booking_id, reminder_kind, scheduled_for, status,
      next_attempt_at, recipient_email, payload
    )
    VALUES (
      v_key,
      p_booking_id,
      v_kind,
      v_when,
      'pending',
      v_when,
      v_email,
      jsonb_build_object('departure_at', p_departure_at, 'hours_before', v_hours)
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  END LOOP;

  SELECT count(*)::integer INTO n
  FROM public.booking_reminder_outbox
  WHERE booking_id = p_booking_id AND status = 'pending';

  RETURN coalesce(n, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_booking_reminders(BIGINT, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_booking_reminders(BIGINT, TIMESTAMPTZ, TEXT) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Claim / complete calendar sync
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reclaim_stale_calendar_sync_outbox(
  p_stale_after INTERVAL DEFAULT interval '5 minutes'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE public.calendar_sync_outbox
  SET
    status = 'failed',
    last_error = left(coalesce(last_error || ' | ', '') || 'stale_processing_reclaimed', 2000),
    next_attempt_at = now(),
    updated_at = now()
  WHERE status = 'processing'
    AND updated_at < now() - p_stale_after;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_calendar_sync_outbox(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.calendar_sync_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.reclaim_stale_calendar_sync_outbox(interval '5 minutes');
  RETURN QUERY
  WITH due AS (
    SELECT id
    FROM public.calendar_sync_outbox
    WHERE status IN ('pending', 'failed')
      AND next_attempt_at <= now()
      AND attempt_count < max_attempts
    ORDER BY next_attempt_at ASC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(least(coalesce(p_limit, 20), 50), 1)
  )
  UPDATE public.calendar_sync_outbox o
  SET status = 'processing', attempt_count = o.attempt_count + 1, updated_at = now()
  FROM due WHERE o.id = due.id
  RETURNING o.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_calendar_sync_outbox(
  p_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL,
  p_google_event_id TEXT DEFAULT NULL,
  p_sync_status TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.calendar_sync_outbox%ROWTYPE;
  v_backoff INTERVAL;
BEGIN
  SELECT * INTO v_row FROM public.calendar_sync_outbox WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF p_success THEN
    UPDATE public.calendar_sync_outbox
    SET status = 'sent', completed_at = now(), updated_at = now(), last_error = NULL
    WHERE id = p_id;

    UPDATE public.bookings
    SET
      google_event_id = CASE
        WHEN v_row.action = 'delete' THEN NULL
        ELSE coalesce(nullif(trim(p_google_event_id), ''), google_event_id)
      END,
      google_calendar_synced_at = now(),
      google_calendar_sync_status = coalesce(nullif(trim(p_sync_status), ''), CASE WHEN v_row.action = 'delete' THEN 'deleted' ELSE 'synced' END),
      google_calendar_sync_error = NULL
    WHERE id = v_row.booking_id;
  ELSE
    v_backoff := make_interval(mins => least(60, greatest(1, v_row.attempt_count * 2)));
    IF v_row.attempt_count >= v_row.max_attempts THEN
      UPDATE public.calendar_sync_outbox
      SET status = 'dead', last_error = left(coalesce(p_error, 'max_attempts'), 2000), updated_at = now(), completed_at = now()
      WHERE id = p_id;
      UPDATE public.bookings
      SET google_calendar_sync_status = 'error', google_calendar_sync_error = left(coalesce(p_error, 'max_attempts'), 2000)
      WHERE id = v_row.booking_id;
    ELSE
      UPDATE public.calendar_sync_outbox
      SET status = 'failed', last_error = left(coalesce(p_error, 'failed'), 2000), next_attempt_at = now() + v_backoff, updated_at = now()
      WHERE id = p_id;
      UPDATE public.bookings
      SET google_calendar_sync_status = coalesce(nullif(trim(p_sync_status), ''), 'error'),
          google_calendar_sync_error = left(coalesce(p_error, 'failed'), 2000)
      WHERE id = v_row.booking_id;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reclaim_stale_calendar_sync_outbox(INTERVAL) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_calendar_sync_outbox(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_calendar_sync_outbox(UUID, BOOLEAN, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reclaim_stale_calendar_sync_outbox(INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_calendar_sync_outbox(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_calendar_sync_outbox(UUID, BOOLEAN, TEXT, TEXT, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Claim / complete reminders
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reclaim_stale_booking_reminder_outbox(
  p_stale_after INTERVAL DEFAULT interval '5 minutes'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE public.booking_reminder_outbox
  SET
    status = 'failed',
    last_error = left(coalesce(last_error || ' | ', '') || 'stale_processing_reclaimed', 2000),
    next_attempt_at = now(),
    updated_at = now()
  WHERE status = 'processing'
    AND updated_at < now() - p_stale_after;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_booking_reminder_outbox(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.booking_reminder_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.reclaim_stale_booking_reminder_outbox(interval '5 minutes');
  RETURN QUERY
  WITH due AS (
    SELECT id
    FROM public.booking_reminder_outbox
    WHERE status IN ('pending', 'failed')
      AND scheduled_for <= now()
      AND next_attempt_at <= now()
      AND attempt_count < max_attempts
    ORDER BY scheduled_for ASC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(least(coalesce(p_limit, 20), 50), 1)
  )
  UPDATE public.booking_reminder_outbox o
  SET status = 'processing', attempt_count = o.attempt_count + 1, updated_at = now()
  FROM due WHERE o.id = due.id
  RETURNING o.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_booking_reminder_outbox(
  p_id UUID,
  p_success BOOLEAN,
  p_provider_message_id TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.booking_reminder_outbox%ROWTYPE;
  v_backoff INTERVAL;
BEGIN
  SELECT * INTO v_row FROM public.booking_reminder_outbox WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF p_success THEN
    UPDATE public.booking_reminder_outbox
    SET
      status = 'sent',
      provider_message_id = p_provider_message_id,
      sent_at = now(),
      updated_at = now(),
      last_error = NULL
    WHERE id = p_id;

    INSERT INTO public.booking_emails (booking_id, template_key, to_email, status, provider_message_id)
    VALUES (
      v_row.booking_id,
      'admin_tour_reminder_' || v_row.reminder_kind,
      coalesce(v_row.recipient_email, 'contact@royalnordic.fi'),
      'sent',
      p_provider_message_id
    );
  ELSE
    v_backoff := make_interval(mins => least(30, greatest(1, v_row.attempt_count * 2)));
    IF v_row.attempt_count >= v_row.max_attempts THEN
      UPDATE public.booking_reminder_outbox
      SET status = 'dead', last_error = left(coalesce(p_error, 'max_attempts'), 2000), updated_at = now()
      WHERE id = p_id;
      INSERT INTO public.booking_emails (booking_id, template_key, to_email, status, error_message)
      VALUES (
        v_row.booking_id,
        'admin_tour_reminder_' || v_row.reminder_kind,
        coalesce(v_row.recipient_email, 'contact@royalnordic.fi'),
        'failed',
        left(coalesce(p_error, 'max_attempts'), 2000)
      );
    ELSE
      UPDATE public.booking_reminder_outbox
      SET status = 'failed', last_error = left(coalesce(p_error, 'failed'), 2000), next_attempt_at = now() + v_backoff, updated_at = now()
      WHERE id = p_id;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reclaim_stale_booking_reminder_outbox(INTERVAL) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_booking_reminder_outbox(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_booking_reminder_outbox(UUID, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reclaim_stale_booking_reminder_outbox(INTERVAL) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_booking_reminder_outbox(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_booking_reminder_outbox(UUID, BOOLEAN, TEXT, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Admin status / settings helpers (no ciphertext in SELECT for UI via view)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.google_calendar_status AS
SELECT
  s.id,
  s.calendar_id,
  s.connected_email,
  (s.refresh_token_ciphertext IS NOT NULL AND length(trim(s.refresh_token_ciphertext)) > 0) AS connected,
  s.calendar_sync_enabled,
  s.reminders_enabled,
  s.admin_reminder_email,
  s.connected_at,
  s.last_sync_at,
  s.last_error,
  s.updated_at,
  (SELECT count(*) FROM public.calendar_sync_outbox WHERE status IN ('pending', 'failed')) AS sync_pending,
  (SELECT count(*) FROM public.calendar_sync_outbox WHERE status = 'dead') AS sync_dead,
  (SELECT count(*) FROM public.booking_reminder_outbox WHERE status IN ('pending', 'failed')) AS reminders_pending
FROM public.google_calendar_settings s
WHERE s.id = 1;

GRANT SELECT ON public.google_calendar_status TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_google_calendar_status()
RETURNS SETOF public.google_calendar_status
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.google_calendar_status WHERE public.is_admin();
$$;

REVOKE ALL ON FUNCTION public.admin_get_google_calendar_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_google_calendar_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_google_calendar_flags(
  p_calendar_sync_enabled BOOLEAN DEFAULT NULL,
  p_reminders_enabled BOOLEAN DEFAULT NULL,
  p_admin_reminder_email TEXT DEFAULT NULL,
  p_calendar_id TEXT DEFAULT NULL
)
RETURNS public.google_calendar_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.google_calendar_settings
  SET
    calendar_sync_enabled = coalesce(p_calendar_sync_enabled, calendar_sync_enabled),
    reminders_enabled = coalesce(p_reminders_enabled, reminders_enabled),
    admin_reminder_email = CASE
      WHEN p_admin_reminder_email IS NULL THEN admin_reminder_email
      ELSE nullif(trim(p_admin_reminder_email), '')
    END,
    calendar_id = CASE
      WHEN p_calendar_id IS NULL THEN calendar_id
      ELSE nullif(trim(p_calendar_id), '')
    END,
    updated_at = now()
  WHERE id = 1;

  RETURN (SELECT g FROM public.google_calendar_status g LIMIT 1);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_google_calendar_flags(BOOLEAN, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_google_calendar_flags(BOOLEAN, BOOLEAN, TEXT, TEXT) TO authenticated;

-- Dry-run: upcoming confirmed bookings without inventing times.
CREATE OR REPLACE FUNCTION public.admin_google_calendar_dry_run(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  booking_id BIGINT,
  booking_ref TEXT,
  tour_name TEXT,
  tour_date DATE,
  tour_time TEXT,
  departure_time_source TEXT,
  can_sync BOOLEAN,
  reason TEXT,
  has_google_event BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.booking_ref,
    coalesce(nullif(trim(t.public_name), ''), t.name) AS tour_name,
    td.date AS tour_date,
    coalesce(nullif(trim(b.tour_time), ''), nullif(trim(t.departure_time), '')) AS tour_time,
    CASE
      WHEN nullif(trim(b.tour_time), '') IS NOT NULL THEN 'booking.tour_time'
      WHEN nullif(trim(t.departure_time), '') IS NOT NULL THEN 'tours.departure_time'
      ELSE NULL
    END AS departure_time_source,
    (
      td.date IS NOT NULL
      AND (
        (nullif(trim(b.tour_time), '') ~ '^[0-2]?[0-9]:[0-5][0-9]')
        OR (nullif(trim(t.departure_time), '') ~ '^[0-2]?[0-9]:[0-5][0-9]')
      )
    ) AS can_sync,
    CASE
      WHEN td.date IS NULL THEN 'missing_tour_date'
      WHEN NOT (
        (nullif(trim(b.tour_time), '') ~ '^[0-2]?[0-9]:[0-5][0-9]')
        OR (nullif(trim(t.departure_time), '') ~ '^[0-2]?[0-9]:[0-5][0-9]')
      ) THEN 'needs_departure_time'
      ELSE 'ok'
    END AS reason,
    (b.google_event_id IS NOT NULL AND length(trim(b.google_event_id)) > 0) AS has_google_event
  FROM public.bookings b
  JOIN public.tour_dates td ON td.id = b.tour_date_id
  LEFT JOIN public.tours t ON t.id = b.tour_id
  WHERE b.status = 'confirmed'
    AND b.deleted_at IS NULL
    AND td.date >= (timezone('Europe/Helsinki', now()))::date
  ORDER BY td.date ASC, b.id ASC
  LIMIT greatest(least(coalesce(p_limit, 100), 500), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_google_calendar_dry_run(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_google_calendar_dry_run(INTEGER) TO authenticated;

-- Enqueue sync for dry-run-eligible upcoming bookings (does not call Google).
CREATE OR REPLACE FUNCTION public.admin_enqueue_upcoming_calendar_sync(p_limit INTEGER DEFAULT 100)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  n INTEGER := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  FOR r IN
    SELECT booking_id FROM public.admin_google_calendar_dry_run(p_limit) WHERE can_sync
  LOOP
    PERFORM public.enqueue_calendar_sync(r.booking_id, 'upsert');
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_enqueue_upcoming_calendar_sync(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_enqueue_upcoming_calendar_sync(INTEGER) TO authenticated;

-- Combined side-effect enqueue: calendar outbox + reminder schedule (no Google/Resend calls).
CREATE OR REPLACE FUNCTION public.enqueue_booking_ops_sync(p_booking_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_deleted TIMESTAMPTZ;
  v_date DATE;
  v_time TEXT;
  v_dep TIMESTAMPTZ;
  v_cal UUID;
  v_reminders INTEGER := 0;
BEGIN
  SELECT b.status, b.deleted_at, td.date,
         coalesce(nullif(trim(b.tour_time), ''), nullif(trim(t.departure_time), ''))
  INTO v_status, v_deleted, v_date, v_time
  FROM public.bookings b
  LEFT JOIN public.tour_dates td ON td.id = b.tour_date_id
  LEFT JOIN public.tours t ON t.id = b.tour_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found');
  END IF;

  IF v_status = 'cancelled' OR v_deleted IS NOT NULL OR v_status <> 'confirmed' THEN
    v_cal := public.enqueue_calendar_sync(p_booking_id, 'delete');
    PERFORM public.cancel_booking_reminders(p_booking_id);
    RETURN jsonb_build_object('ok', true, 'calendar_outbox_id', v_cal, 'reminders', 0, 'action', 'delete');
  END IF;

  v_cal := public.enqueue_calendar_sync(p_booking_id, 'upsert');

  IF v_date IS NOT NULL AND v_time ~ '^[0-2]?[0-9]:[0-5][0-9]' THEN
    v_dep := ((v_date::text || ' ' || left(v_time, 5))::timestamp AT TIME ZONE 'Europe/Helsinki');
    v_reminders := public.schedule_booking_reminders(p_booking_id, v_dep, NULL);
  ELSE
    PERFORM public.cancel_booking_reminders(p_booking_id);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'calendar_outbox_id', v_cal,
    'reminders', v_reminders,
    'action', 'upsert',
    'has_departure', v_dep IS NOT NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_booking_ops_sync(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_booking_ops_sync(BIGINT) TO authenticated, service_role;

-- Cover all booking writers (Stripe, admin, partner RPC, crypto) without blocking them.
CREATE OR REPLACE FUNCTION public.trg_bookings_enqueue_ops_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM public.enqueue_booking_ops_sync(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    -- Never fail the booking write because of calendar/reminder enqueue.
    RAISE WARNING 'enqueue_booking_ops_sync failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_enqueue_ops_sync ON public.bookings;
CREATE TRIGGER bookings_enqueue_ops_sync
  AFTER INSERT OR UPDATE OF
    status, deleted_at, tour_time, pickup_location, tour_date_id,
    customer_name, customer_email, customer_phone, adults, children,
    internal_notes, special_requests, booking_ref
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_bookings_enqueue_ops_sync();

-- Cron invoke helpers (Vault + pg_net), same pattern as notification outbox.
CREATE OR REPLACE FUNCTION public.invoke_process_calendar_sync()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  project_url TEXT;
  secret_key TEXT;
  req_id BIGINT;
BEGIN
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO secret_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
  IF project_url IS NULL OR secret_key IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'vault_secrets_missing');
  END IF;
  SELECT net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/process-calendar-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret_key,
      'apikey', secret_key
    ),
    body := jsonb_build_object('source', 'pg_cron', 'limit', 25),
    timeout_milliseconds := 20000
  ) INTO req_id;
  RETURN jsonb_build_object('ok', true, 'request_id', req_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.invoke_process_booking_reminders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  project_url TEXT;
  secret_key TEXT;
  req_id BIGINT;
BEGIN
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO secret_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
  IF project_url IS NULL OR secret_key IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'vault_secrets_missing');
  END IF;
  SELECT net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/process-booking-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret_key,
      'apikey', secret_key
    ),
    body := jsonb_build_object('source', 'pg_cron', 'limit', 25),
    timeout_milliseconds := 20000
  ) INTO req_id;
  RETURN jsonb_build_object('ok', true, 'request_id', req_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_process_calendar_sync() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invoke_process_booking_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invoke_process_calendar_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.invoke_process_booking_reminders() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname IN ('process-calendar-sync', 'process-booking-reminders');

    PERFORM cron.schedule(
      'process-calendar-sync',
      '* * * * *',
      $cron$SELECT public.invoke_process_calendar_sync()$cron$
    );
    PERFORM cron.schedule(
      'process-booking-reminders',
      '*/5 * * * *',
      $cron$SELECT public.invoke_process_booking_reminders()$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END $$;
