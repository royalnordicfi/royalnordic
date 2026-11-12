-- Shared Bookings 1.6D — GYG outbound availability notification outbox.
-- Official: POST https://supplier-api.getyourguide.com/1/notify-availability-update
-- Payload includes current vacancies (not a re-fetch signal). Delivery is async.
-- Live outbound stays OFF until SHARED_BOOKINGS_GYG_NOTIFY_ENABLED is explicitly set.

CREATE TABLE IF NOT EXISTS public.shared_gyg_vacancy_snapshots (
  departure_id UUID NOT NULL REFERENCES public.shared_departures (id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  vacancies INTEGER NOT NULL CHECK (vacancies >= 0),
  date_time_local TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (departure_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.shared_gyg_availability_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coalesce_key TEXT NOT NULL,
  product_id TEXT NOT NULL,
  departure_id UUID REFERENCES public.shared_departures (id) ON DELETE SET NULL,
  departure_date DATE,
  departure_time TEXT,
  vacancies INTEGER NOT NULL CHECK (vacancies >= 0),
  reason TEXT NOT NULL DEFAULT 'capacity_change',
  source_channel TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped', 'dead')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 8 CHECK (max_attempts >= 1),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- One open row per product timeslot — duplicates coalesce into the latest vacancies.
CREATE UNIQUE INDEX IF NOT EXISTS shared_gyg_availability_outbox_open_coalesce_uidx
  ON public.shared_gyg_availability_outbox (coalesce_key)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS shared_gyg_availability_outbox_claim_idx
  ON public.shared_gyg_availability_outbox (status, next_attempt_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.shared_gyg_vacancy_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_gyg_availability_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shared_gyg_vacancy_snapshots_admin_select ON public.shared_gyg_vacancy_snapshots;
CREATE POLICY shared_gyg_vacancy_snapshots_admin_select
  ON public.shared_gyg_vacancy_snapshots FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS shared_gyg_availability_outbox_admin_select ON public.shared_gyg_availability_outbox;
CREATE POLICY shared_gyg_availability_outbox_admin_select
  ON public.shared_gyg_availability_outbox FOR SELECT TO authenticated
  USING (public.is_admin());

-- Current sellable vacancies for a departure (confirmed + unexpired holds).
CREATE OR REPLACE FUNCTION public.shared_departure_available_seats(p_departure_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN d.id IS NULL OR d.status <> 'active' THEN 0
    ELSE greatest(
      d.capacity
        - public.shared_departure_confirmed_count(d.id)
        - public.shared_departure_held_count(d.id),
      0
    )
  END
  FROM public.shared_departures d
  WHERE d.id = p_departure_id;
$$;

GRANT EXECUTE ON FUNCTION public.shared_departure_available_seats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shared_departure_available_seats(UUID) TO service_role;

-- Official notify rules (simplified, verifiable from GYG docs):
-- 1) sold out (vacancies → 0)
-- 2) became available (0 → >0)
-- 3) high-demand heuristic: changed, <7 remaining, within 60 days
-- Skip unchanged. Optionally skip GYG-caused vacancy decreases.
CREATE OR REPLACE FUNCTION public.gyg_should_notify_availability(
  p_previous INTEGER,
  p_next INTEGER,
  p_departure_date DATE,
  p_source_channel TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_prev INT := greatest(coalesce(p_previous, 0), 0);
  v_next INT := greatest(coalesce(p_next, 0), 0);
BEGIN
  IF v_prev = v_next THEN
    RETURN false;
  END IF;

  -- Official: not necessary to notify decreases caused by GetYourGuide bookings.
  IF lower(coalesce(p_source_channel, '')) = 'getyourguide' AND v_next < v_prev THEN
    RETURN false;
  END IF;

  IF v_next = 0 THEN
    RETURN true;
  END IF;
  IF v_prev = 0 AND v_next > 0 THEN
    RETURN true;
  END IF;

  IF p_departure_date IS NOT NULL
     AND p_departure_date <= (CURRENT_DATE + 60)
     AND p_departure_date >= CURRENT_DATE
     AND v_next < 7 THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.gyg_should_notify_availability(INTEGER, INTEGER, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gyg_should_notify_availability(INTEGER, INTEGER, DATE, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.service_enqueue_gyg_availability_notify(
  p_departure_id UUID,
  p_reason TEXT DEFAULT 'capacity_change',
  p_source_channel TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dep public.shared_departures%ROWTYPE;
  v_vacancies INT;
  v_map RECORD;
  v_prev INT;
  v_time TEXT;
  v_key TEXT;
  v_enqueued INT := 0;
  v_skipped INT := 0;
  v_outbox_id UUID;
BEGIN
  IF p_departure_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'departure_required');
  END IF;

  SELECT * INTO v_dep FROM public.shared_departures WHERE id = p_departure_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'departure_not_found');
  END IF;

  v_vacancies := public.shared_departure_available_seats(p_departure_id);
  v_time := coalesce(nullif(trim(v_dep.departure_time), ''), '00:00');

  FOR v_map IN
    SELECT m.external_product_id AS product_id, m.default_departure_time
    FROM public.shared_product_mappings m
    WHERE m.provider = 'getyourguide'
      AND m.is_active = true
      AND (
        (m.template_id IS NOT NULL AND m.template_id = v_dep.template_id)
        OR (
          m.template_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.shared_tour_templates t
            WHERE t.id = m.template_id AND t.code = v_dep.tour_code
          )
        )
      )
  LOOP
    SELECT s.vacancies INTO v_prev
    FROM public.shared_gyg_vacancy_snapshots s
    WHERE s.departure_id = p_departure_id
      AND s.product_id = v_map.product_id;

    IF NOT FOUND THEN
      v_prev := NULL;
      -- First observation: seed snapshot without notifying (avoid startup dump).
      IF v_dep.status = 'active' THEN
        INSERT INTO public.shared_gyg_vacancy_snapshots (departure_id, product_id, vacancies, date_time_local)
        VALUES (
          p_departure_id,
          v_map.product_id,
          v_vacancies,
          v_dep.departure_date::text || 'T' ||
            CASE
              WHEN coalesce(nullif(trim(v_dep.departure_time), ''), nullif(trim(v_map.default_departure_time), ''), '00:00')
                   ~ '^\d{1,2}:\d{2}'
              THEN left(lpad(coalesce(nullif(trim(v_dep.departure_time), ''), nullif(trim(v_map.default_departure_time), ''), '00:00'), 5, '0'), 5)
              ELSE '00:00'
            END
        )
        ON CONFLICT (departure_id, product_id) DO NOTHING;
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
      v_prev := v_vacancies; -- cancelled / inactive first sight → treat as unchanged unless rules fire
    END IF;

    IF NOT public.gyg_should_notify_availability(v_prev, v_vacancies, v_dep.departure_date, p_source_channel) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_key := v_map.product_id || '|' || v_dep.departure_date::text || '|' || v_time;

    INSERT INTO public.shared_gyg_availability_outbox (
      coalesce_key, product_id, departure_id, departure_date, departure_time,
      vacancies, reason, source_channel, payload, status, next_attempt_at
    ) VALUES (
      v_key,
      v_map.product_id,
      p_departure_id,
      v_dep.departure_date,
      v_dep.departure_time,
      v_vacancies,
      coalesce(nullif(trim(p_reason), ''), 'capacity_change'),
      nullif(trim(coalesce(p_source_channel, '')), ''),
      jsonb_build_object(
        'productId', v_map.product_id,
        'departure_id', p_departure_id,
        'departure_date', v_dep.departure_date,
        'departure_time', v_dep.departure_time,
        'vacancies', v_vacancies,
        'reason', coalesce(nullif(trim(p_reason), ''), 'capacity_change')
      ),
      'pending',
      now()
    )
    ON CONFLICT (coalesce_key) WHERE status IN ('pending', 'failed')
    DO UPDATE SET
      vacancies = EXCLUDED.vacancies,
      departure_id = EXCLUDED.departure_id,
      departure_date = EXCLUDED.departure_date,
      departure_time = EXCLUDED.departure_time,
      reason = EXCLUDED.reason,
      source_channel = EXCLUDED.source_channel,
      payload = EXCLUDED.payload,
      status = 'pending',
      next_attempt_at = now(),
      last_error = NULL,
      updated_at = now()
    RETURNING id INTO v_outbox_id;

    v_enqueued := v_enqueued + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'departure_id', p_departure_id,
    'vacancies', v_vacancies,
    'enqueued', v_enqueued,
    'skipped', v_skipped
  );
END;
$$;

REVOKE ALL ON FUNCTION public.service_enqueue_gyg_availability_notify(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_enqueue_gyg_availability_notify(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.service_enqueue_gyg_availability_notify(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_gyg_availability_outbox(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.shared_gyg_availability_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH due AS (
    SELECT o.id
    FROM public.shared_gyg_availability_outbox o
    WHERE o.status IN ('pending', 'failed')
      AND o.next_attempt_at <= now()
      AND o.attempt_count < o.max_attempts
    ORDER BY o.next_attempt_at ASC
    LIMIT greatest(coalesce(p_limit, 20), 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.shared_gyg_availability_outbox o
  SET status = 'processing',
      attempt_count = o.attempt_count + 1,
      updated_at = now()
  FROM due
  WHERE o.id = due.id
  RETURNING o.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_gyg_availability_outbox(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_gyg_availability_outbox(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_gyg_availability_outbox(
  p_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL,
  p_vacancies INTEGER DEFAULT NULL,
  p_date_time_local TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.shared_gyg_availability_outbox%ROWTYPE;
  v_backoff INTERVAL;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO v_row FROM public.shared_gyg_availability_outbox WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF p_success THEN
    UPDATE public.shared_gyg_availability_outbox
    SET status = 'sent',
        last_error = NULL,
        sent_at = now(),
        updated_at = now(),
        vacancies = coalesce(p_vacancies, vacancies)
    WHERE id = p_id;

    IF v_row.departure_id IS NOT NULL THEN
      INSERT INTO public.shared_gyg_vacancy_snapshots (
        departure_id, product_id, vacancies, date_time_local, updated_at
      ) VALUES (
        v_row.departure_id,
        v_row.product_id,
        coalesce(p_vacancies, v_row.vacancies),
        coalesce(nullif(trim(p_date_time_local), ''), v_row.departure_date::text || 'T' || coalesce(v_row.departure_time, '00:00')),
        now()
      )
      ON CONFLICT (departure_id, product_id) DO UPDATE SET
        vacancies = EXCLUDED.vacancies,
        date_time_local = EXCLUDED.date_time_local,
        updated_at = now();
    END IF;

    RETURN jsonb_build_object('ok', true, 'status', 'sent');
  END IF;

  IF v_row.attempt_count >= v_row.max_attempts THEN
    UPDATE public.shared_gyg_availability_outbox
    SET status = 'dead',
        last_error = left(coalesce(p_error, 'max_attempts'), 500),
        updated_at = now()
    WHERE id = p_id;
    RETURN jsonb_build_object('ok', true, 'status', 'dead');
  END IF;

  -- Bounded exponential backoff: 1m, 2m, 4m … capped at 60m.
  v_backoff := make_interval(
    mins => least(60, greatest(1, floor(power(2, greatest(v_row.attempt_count - 1, 0)))::int))
  );

  UPDATE public.shared_gyg_availability_outbox
  SET status = 'failed',
      last_error = left(coalesce(p_error, 'delivery_failed'), 500),
      next_attempt_at = now() + v_backoff,
      updated_at = now()
  WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'status', 'failed', 'next_attempt_at', now() + v_backoff);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_gyg_availability_outbox(UUID, BOOLEAN, TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_gyg_availability_outbox(UUID, BOOLEAN, TEXT, INTEGER, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_list_gyg_availability_outbox_problems(p_limit INTEGER DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'items', coalesce((
      SELECT jsonb_agg(to_jsonb(o) ORDER BY o.updated_at DESC)
      FROM (
        SELECT id, product_id, departure_id, departure_date, vacancies, reason,
               status, attempt_count, max_attempts, next_attempt_at, last_error,
               created_at, updated_at, sent_at
        FROM public.shared_gyg_availability_outbox
        WHERE status IN ('failed', 'dead', 'processing')
           OR (status = 'pending' AND next_attempt_at < now() - interval '15 minutes')
        ORDER BY updated_at DESC
        LIMIT greatest(coalesce(p_limit, 50), 1)
      ) o
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_gyg_availability_outbox_problems(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_gyg_availability_outbox_problems(INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_retry_gyg_availability_outbox(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.shared_gyg_availability_outbox%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO v_row FROM public.shared_gyg_availability_outbox WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  UPDATE public.shared_gyg_availability_outbox
  SET status = 'pending',
      next_attempt_at = now(),
      last_error = NULL,
      attempt_count = least(attempt_count, max_attempts - 1),
      updated_at = now()
  WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'status', 'pending');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_retry_gyg_availability_outbox(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_retry_gyg_availability_outbox(UUID) TO authenticated;

-- Detect capacity-relevant changes without coupling every booking RPC.
CREATE OR REPLACE FUNCTION public.trg_shared_bookings_enqueue_gyg_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dep_id UUID;
  v_channel TEXT;
  v_reason TEXT;
BEGIN
  IF TG_TABLE_NAME = 'shared_departure_bookings' THEN
    v_dep_id := coalesce(NEW.departure_id, OLD.departure_id);
    v_channel := coalesce(NEW.channel, OLD.channel);
    IF TG_OP = 'INSERT' THEN
      v_reason := 'booking_created';
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        v_reason := CASE WHEN NEW.status = 'cancelled' THEN 'booking_cancelled' ELSE 'booking_status_changed' END;
      ELSIF NEW.adults IS DISTINCT FROM OLD.adults OR NEW.children IS DISTINCT FROM OLD.children THEN
        v_reason := 'booking_pax_changed';
      ELSIF NEW.hold_expires_at IS DISTINCT FROM OLD.hold_expires_at THEN
        v_reason := 'hold_changed';
      ELSE
        RETURN coalesce(NEW, OLD);
      END IF;
    ELSE
      v_reason := 'booking_deleted';
      v_dep_id := OLD.departure_id;
      v_channel := OLD.channel;
    END IF;
  ELSIF TG_TABLE_NAME = 'shared_departures' THEN
    v_dep_id := NEW.id;
    v_channel := 'system';
    IF TG_OP = 'UPDATE' THEN
      IF NEW.capacity IS DISTINCT FROM OLD.capacity THEN
        v_reason := 'capacity_changed';
      ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
        v_reason := CASE WHEN NEW.status = 'cancelled' THEN 'departure_cancelled' ELSE 'departure_activated' END;
      ELSIF NEW.departure_date IS DISTINCT FROM OLD.departure_date
         OR NEW.departure_time IS DISTINCT FROM OLD.departure_time THEN
        v_reason := 'departure_schedule_changed';
      ELSE
        RETURN NEW;
      END IF;
    ELSE
      RETURN coalesce(NEW, OLD);
    END IF;
  ELSE
    RETURN coalesce(NEW, OLD);
  END IF;

  BEGIN
    PERFORM public.service_enqueue_gyg_availability_notify(v_dep_id, v_reason, v_channel);
  EXCEPTION WHEN others THEN
    -- Never fail the booking transaction because of notify enqueue.
    RAISE WARNING 'gyg availability enqueue failed for %: %', v_dep_id, SQLERRM;
  END;

  RETURN coalesce(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_shared_departure_bookings_gyg_availability ON public.shared_departure_bookings;
CREATE TRIGGER trg_shared_departure_bookings_gyg_availability
  AFTER INSERT OR UPDATE OF status, adults, children, hold_expires_at, departure_id
  OR DELETE
  ON public.shared_departure_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_shared_bookings_enqueue_gyg_availability();

DROP TRIGGER IF EXISTS trg_shared_departures_gyg_availability ON public.shared_departures;
CREATE TRIGGER trg_shared_departures_gyg_availability
  AFTER UPDATE OF capacity, status, departure_date, departure_time
  ON public.shared_departures
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_shared_bookings_enqueue_gyg_availability();
