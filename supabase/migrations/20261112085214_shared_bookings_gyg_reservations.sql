-- Shared Bookings 1.6B — GYG temporary seat reservations (holds).
-- Holds live as pending rows on shared_departure_bookings with hold_expires_at.
-- Expiration is enforced by time checks (no background worker).
-- Live ingestion / production book remains gated separately.

ALTER TABLE public.shared_departure_bookings
  ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.shared_departure_bookings.hold_expires_at IS
  'GYG/seat-hold expiry. Only pending rows with hold_expires_at > now() occupy capacity.';

-- Active GYG reservation references (pending holds).
CREATE UNIQUE INDEX IF NOT EXISTS shared_departure_bookings_gyg_reservation_pending_uidx
  ON public.shared_departure_bookings (channel, lower(trim(external_ref)))
  WHERE channel = 'getyourguide'
    AND status = 'pending'
    AND external_ref IS NOT NULL
    AND length(trim(external_ref)) > 0;

-- Idempotent reserve by GYG cart booking reference while hold is pending.
CREATE UNIQUE INDEX IF NOT EXISTS shared_departure_bookings_gyg_booking_ref_pending_uidx
  ON public.shared_departure_bookings (channel, lower(trim(booking_ref)))
  WHERE channel = 'getyourguide'
    AND status = 'pending'
    AND booking_ref IS NOT NULL
    AND length(trim(booking_ref)) > 0;

CREATE INDEX IF NOT EXISTS shared_departure_bookings_hold_active_idx
  ON public.shared_departure_bookings (departure_id, status, hold_expires_at)
  WHERE status = 'pending' AND hold_expires_at IS NOT NULL;

-- Active (unexpired) held seats for a departure.
CREATE OR REPLACE FUNCTION public.shared_departure_held_count(p_departure_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(sum(b.passenger_count), 0)::int
  FROM public.shared_departure_bookings b
  WHERE b.departure_id = p_departure_id
    AND b.status = 'pending'
    AND b.hold_expires_at IS NOT NULL
    AND b.hold_expires_at > now();
$$;

GRANT EXECUTE ON FUNCTION public.shared_departure_held_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shared_departure_held_count(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- Availability: count only unexpired holds
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.service_list_gyg_availabilities(
  p_product_id TEXT,
  p_from DATE,
  p_to DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_map public.shared_product_mappings%ROWTYPE;
  v_tpl_code TEXT;
  v_rows JSONB;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF nullif(trim(coalesce(p_product_id, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'product_id_required');
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_date_range');
  END IF;

  SELECT * INTO v_map
  FROM public.shared_product_mappings m
  WHERE m.provider = 'getyourguide'
    AND m.is_active = true
    AND m.external_product_id = trim(p_product_id)
  ORDER BY CASE WHEN m.external_option_id IS NULL THEN 1 ELSE 0 END
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'product_id', trim(p_product_id),
      'mapping_found', false,
      'departures', '[]'::jsonb
    );
  END IF;

  SELECT t.code INTO v_tpl_code
  FROM public.shared_tour_templates t
  WHERE t.id = v_map.template_id;

  SELECT coalesce(jsonb_agg(row_data ORDER BY (row_data->>'departure_date'), (row_data->>'departure_time')), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT jsonb_build_object(
      'departure_id', d.id,
      'departure_date', d.departure_date,
      'departure_time', d.departure_time,
      'capacity', d.capacity,
      'confirmed_passengers', coalesce(occ.confirmed_passengers, 0),
      'held_passengers', coalesce(occ.held_passengers, 0),
      'available_seats', greatest(
        d.capacity - coalesce(occ.confirmed_passengers, 0) - coalesce(occ.held_passengers, 0),
        0
      ),
      'template_id', d.template_id,
      'tour_code', d.tour_code
    ) AS row_data
    FROM public.shared_departures d
    LEFT JOIN LATERAL (
      SELECT
        coalesce(sum(b.passenger_count) FILTER (WHERE b.status = 'confirmed'), 0)::int AS confirmed_passengers,
        coalesce(sum(b.passenger_count) FILTER (
          WHERE b.status = 'pending'
            AND b.hold_expires_at IS NOT NULL
            AND b.hold_expires_at > now()
        ), 0)::int AS held_passengers
      FROM public.shared_departure_bookings b
      WHERE b.departure_id = d.id
    ) occ ON true
    WHERE d.status = 'active'
      AND d.departure_date >= p_from
      AND d.departure_date <= p_to
      AND (
        (v_map.template_id IS NOT NULL AND d.template_id = v_map.template_id)
        OR (v_tpl_code IS NOT NULL AND d.tour_code = v_tpl_code)
      )
  ) q;

  RETURN jsonb_build_object(
    'ok', true,
    'product_id', trim(p_product_id),
    'mapping_found', true,
    'mapping_id', v_map.id,
    'template_id', v_map.template_id,
    'default_departure_time', v_map.default_departure_time,
    'departures', v_rows
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Reserve seats (atomic FOR UPDATE on departure)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.service_gyg_reserve(
  p_product_id TEXT,
  p_date_time TEXT,
  p_adults INTEGER,
  p_children INTEGER,
  p_gyg_booking_reference TEXT,
  p_hold_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_map public.shared_product_mappings%ROWTYPE;
  v_tpl_code TEXT;
  v_date DATE;
  v_time TEXT;
  v_dep public.shared_departures%ROWTYPE;
  v_existing public.shared_departure_bookings%ROWTYPE;
  v_hold public.shared_departure_bookings%ROWTYPE;
  v_adults INT := greatest(coalesce(p_adults, 0), 0);
  v_children INT := greatest(coalesce(p_children, 0), 0);
  v_pax INT;
  v_confirmed INT;
  v_held INT;
  v_gyg_ref TEXT := nullif(trim(coalesce(p_gyg_booking_reference, '')), '');
  v_product TEXT := nullif(trim(coalesce(p_product_id, '')), '');
  v_minutes INT := greatest(coalesce(p_hold_minutes, 60), 15);
  v_expires TIMESTAMPTZ;
  v_res_ref TEXT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF v_product IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'productId is required');
  END IF;
  IF v_gyg_ref IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'gygBookingReference is required');
  END IF;

  v_pax := v_adults + v_children;
  IF v_pax < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_PARTICIPANTS_CONFIGURATION', 'error_message', 'At least one participant is required');
  END IF;

  BEGIN
    v_date := substring(trim(p_date_time) from 1 for 10)::date;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'dateTime is invalid');
  END;
  IF v_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'dateTime is required');
  END IF;

  v_time := CASE
    WHEN trim(coalesce(p_date_time, '')) ~ '^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})'
      THEN substring(trim(p_date_time) from 'T(\d{2}:\d{2})')
    ELSE NULL
  END;
  IF v_time = '00:00' THEN
    v_time := NULL;
  END IF;

  -- Idempotent: same GYG cart reference with an active hold → return existing.
  SELECT * INTO v_existing
  FROM public.shared_departure_bookings b
  WHERE b.channel = 'getyourguide'
    AND b.status = 'pending'
    AND lower(trim(b.booking_ref)) = lower(v_gyg_ref)
  FOR UPDATE;

  IF FOUND AND v_existing.hold_expires_at IS NOT NULL AND v_existing.hold_expires_at > now() THEN
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'reservation_reference', v_existing.external_ref,
      'reservation_expiration', v_existing.hold_expires_at,
      'departure_id', v_existing.departure_id,
      'booking_id', v_existing.id,
      'passenger_count', v_existing.passenger_count
    );
  END IF;

  -- Expired pending for same GYG ref: release so a fresh hold can be created.
  IF FOUND THEN
    UPDATE public.shared_departure_bookings
    SET status = 'cancelled', cancelled_at = now(), updated_at = now()
    WHERE id = v_existing.id;
  END IF;

  SELECT * INTO v_map
  FROM public.shared_product_mappings m
  WHERE m.provider = 'getyourguide'
    AND m.is_active = true
    AND m.external_product_id = v_product
  ORDER BY CASE WHEN m.external_option_id IS NULL THEN 1 ELSE 0 END
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_PRODUCT', 'error_message', format('Unknown productId %s', v_product));
  END IF;

  v_time := coalesce(v_time, v_map.default_departure_time);
  SELECT t.code INTO v_tpl_code FROM public.shared_tour_templates t WHERE t.id = v_map.template_id;

  SELECT d.* INTO v_dep
  FROM public.shared_departures d
  WHERE d.status = 'active'
    AND d.departure_date = v_date
    AND (
      (v_map.template_id IS NOT NULL AND d.template_id = v_map.template_id)
      OR (v_tpl_code IS NOT NULL AND d.tour_code = v_tpl_code)
    )
    AND (v_time IS NULL OR d.departure_time IS NULL OR d.departure_time = v_time)
  ORDER BY CASE WHEN d.departure_time IS NOT DISTINCT FROM v_time THEN 0 ELSE 1 END
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_AVAILABILITY', 'error_message', 'No matching active departure');
  END IF;

  v_confirmed := public.shared_departure_confirmed_count(v_dep.id);
  v_held := public.shared_departure_held_count(v_dep.id);
  IF v_confirmed + v_held + v_pax > v_dep.capacity THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'NO_AVAILABILITY',
      'error_message', format('Requested %s seats; only %s available', v_pax, greatest(v_dep.capacity - v_confirmed - v_held, 0)),
      'capacity', v_dep.capacity,
      'confirmed_passengers', v_confirmed,
      'held_passengers', v_held
    );
  END IF;

  v_expires := now() + make_interval(mins => v_minutes);
  v_res_ref := 'sb-gyg-res-' || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public.shared_departure_bookings (
    departure_id, supplier_id, channel, sync_status,
    booking_ref, external_ref,
    guest_name, adults, children, status, hold_expires_at
  ) VALUES (
    v_dep.id, v_map.supplier_id, 'getyourguide', 'pending_sync',
    v_gyg_ref, v_res_ref,
    'GYG Hold', v_adults, v_children, 'pending', v_expires
  )
  RETURNING * INTO v_hold;

  INSERT INTO public.shared_departure_access (departure_id, supplier_id)
  VALUES (v_dep.id, v_map.supplier_id)
  ON CONFLICT DO NOTHING;

  PERFORM public.shared_bookings_log_event(
    v_hold.id, v_dep.id, 'created',
    jsonb_build_object(
      'source', 'gyg',
      'action', 'hold_created',
      'reservation_reference', v_res_ref,
      'gyg_booking_reference', v_gyg_ref,
      'hold_expires_at', v_expires,
      'passenger_count', v_pax
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'reservation_reference', v_res_ref,
    'reservation_expiration', v_expires,
    'departure_id', v_dep.id,
    'booking_id', v_hold.id,
    'passenger_count', v_pax,
    'available_seats', greatest(v_dep.capacity - v_confirmed - v_held - v_pax, 0)
  );
EXCEPTION
  WHEN unique_violation THEN
    -- Concurrent duplicate reserve for same gygBookingReference — return the winner.
    SELECT * INTO v_existing
    FROM public.shared_departure_bookings b
    WHERE b.channel = 'getyourguide'
      AND b.status = 'pending'
      AND lower(trim(b.booking_ref)) = lower(v_gyg_ref)
      AND b.hold_expires_at > now()
    LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'reservation_reference', v_existing.external_ref,
        'reservation_expiration', v_existing.hold_expires_at,
        'departure_id', v_existing.departure_id,
        'booking_id', v_existing.id,
        'passenger_count', v_existing.passenger_count
      );
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'INTERNAL_SYSTEM_FAILURE', 'error_message', 'Duplicate reservation conflict');
END;
$$;

REVOKE ALL ON FUNCTION public.service_gyg_reserve(TEXT, TEXT, INTEGER, INTEGER, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_gyg_reserve(TEXT, TEXT, INTEGER, INTEGER, TEXT, INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- Cancel reservation (idempotent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.service_gyg_cancel_reservation(
  p_reservation_reference TEXT,
  p_gyg_booking_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT := nullif(trim(coalesce(p_reservation_reference, '')), '');
  v_gyg TEXT := nullif(trim(coalesce(p_gyg_booking_reference, '')), '');
  v_hold public.shared_departure_bookings%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF v_ref IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'reservationReference is required');
  END IF;

  SELECT * INTO v_hold
  FROM public.shared_departure_bookings b
  WHERE b.channel = 'getyourguide'
    AND lower(trim(b.external_ref)) = lower(v_ref)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION', 'error_message', 'Reservation not found');
  END IF;

  IF v_gyg IS NOT NULL AND v_hold.booking_ref IS NOT NULL
     AND lower(trim(v_hold.booking_ref)) IS DISTINCT FROM lower(v_gyg) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION', 'error_message', 'Reservation does not match gygBookingReference');
  END IF;

  -- Already cancelled / already confirmed → idempotent success for cancel-reservation.
  IF v_hold.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'status', 'cancelled', 'reservation_reference', v_ref);
  END IF;

  IF v_hold.status = 'confirmed' THEN
    -- Hold already consumed by book; cancel-reservation is a no-op success.
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'status', 'confirmed', 'reservation_reference', v_ref);
  END IF;

  IF v_hold.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION', 'error_message', 'Reservation is not active');
  END IF;

  UPDATE public.shared_departure_bookings
  SET status = 'cancelled',
      cancelled_at = now(),
      hold_expires_at = NULL,
      updated_at = now()
  WHERE id = v_hold.id;

  PERFORM public.shared_bookings_log_event(
    v_hold.id, v_hold.departure_id, 'cancelled',
    jsonb_build_object('source', 'gyg', 'action', 'hold_cancelled', 'reservation_reference', v_ref)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'status', 'cancelled',
    'reservation_reference', v_ref,
    'departure_id', v_hold.departure_id,
    'booking_id', v_hold.id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.service_gyg_cancel_reservation(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_gyg_cancel_reservation(TEXT, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Consume a valid hold into a confirmed booking (no double capacity count)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.service_gyg_consume_reservation(
  p_reservation_reference TEXT,
  p_gyg_booking_reference TEXT,
  p_guest_name TEXT DEFAULT NULL,
  p_adults INTEGER DEFAULT NULL,
  p_children INTEGER DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res TEXT := nullif(trim(coalesce(p_reservation_reference, '')), '');
  v_gyg TEXT := nullif(trim(coalesce(p_gyg_booking_reference, '')), '');
  v_hold public.shared_departure_bookings%ROWTYPE;
  v_dep public.shared_departures%ROWTYPE;
  v_adults INT;
  v_children INT;
  v_confirmed INT;
  v_held INT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF v_res IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION', 'error_message', 'reservationReference is required');
  END IF;
  IF v_gyg IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'gygBookingReference is required');
  END IF;

  SELECT * INTO v_hold
  FROM public.shared_departure_bookings b
  WHERE b.channel = 'getyourguide'
    AND lower(trim(b.external_ref)) = lower(v_res)
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Idempotent book: already confirmed under the GYG booking reference.
    SELECT * INTO v_hold
    FROM public.shared_departure_bookings b
    WHERE b.channel = 'getyourguide'
      AND b.status = 'confirmed'
      AND lower(trim(b.external_ref)) = lower(v_gyg)
    LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'booking_id', v_hold.id,
        'departure_id', v_hold.departure_id,
        'external_ref', v_hold.external_ref,
        'status', 'confirmed'
      );
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION', 'error_message', 'Reservation not found');
  END IF;

  -- Already consumed (external_ref may still be reservation ref briefly, or already swapped).
  IF v_hold.status = 'confirmed' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'booking_id', v_hold.id,
      'departure_id', v_hold.departure_id,
      'external_ref', v_hold.external_ref,
      'status', 'confirmed'
    );
  END IF;

  IF v_hold.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION', 'error_message', 'Reservation was cancelled');
  END IF;

  IF v_hold.status <> 'pending'
     OR v_hold.hold_expires_at IS NULL
     OR v_hold.hold_expires_at <= now() THEN
    IF v_hold.status = 'pending' THEN
      UPDATE public.shared_departure_bookings
      SET status = 'cancelled', cancelled_at = now(), hold_expires_at = NULL, updated_at = now()
      WHERE id = v_hold.id;
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION', 'error_message', 'Reservation expired');
  END IF;

  SELECT * INTO v_dep FROM public.shared_departures WHERE id = v_hold.departure_id FOR UPDATE;
  IF NOT FOUND OR v_dep.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_AVAILABILITY', 'error_message', 'Departure is no longer active');
  END IF;

  v_adults := coalesce(p_adults, v_hold.adults);
  v_children := coalesce(p_children, v_hold.children);
  IF v_adults + v_children < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_PARTICIPANTS_CONFIGURATION', 'error_message', 'At least one participant is required');
  END IF;

  -- Capacity excluding this hold (it will become confirmed, not an extra seat).
  v_confirmed := public.shared_departure_confirmed_count(v_dep.id);
  v_held := public.shared_departure_held_count(v_dep.id) - v_hold.passenger_count;
  IF v_held < 0 THEN v_held := 0; END IF;

  IF v_confirmed + v_held + v_adults + v_children > v_dep.capacity THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_AVAILABILITY', 'error_message', 'Not enough capacity to confirm reservation');
  END IF;

  UPDATE public.shared_departure_bookings
  SET
    status = 'confirmed',
    sync_status = 'synced',
    booking_ref = coalesce(booking_ref, v_gyg),
    external_ref = v_gyg,
    guest_name = coalesce(nullif(trim(coalesce(p_guest_name, '')), ''), guest_name, 'GYG Guest'),
    adults = v_adults,
    children = v_children,
    contact_email = coalesce(nullif(trim(coalesce(p_contact_email, '')), ''), contact_email),
    contact_phone = coalesce(nullif(trim(coalesce(p_contact_phone, '')), ''), contact_phone),
    notes = coalesce(nullif(trim(coalesce(p_notes, '')), ''), notes),
    hold_expires_at = NULL,
    cancelled_at = NULL,
    updated_at = now()
  WHERE id = v_hold.id
  RETURNING * INTO v_hold;

  PERFORM public.shared_bookings_log_event(
    v_hold.id, v_dep.id, 'updated',
    jsonb_build_object(
      'source', 'gyg',
      'action', 'hold_consumed',
      'reservation_reference', v_res,
      'gyg_booking_reference', v_gyg
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'booking_id', v_hold.id,
    'departure_id', v_dep.id,
    'external_ref', v_hold.external_ref,
    'status', 'confirmed',
    'confirmed_passengers', public.shared_departure_confirmed_count(v_dep.id),
    'held_passengers', public.shared_departure_held_count(v_dep.id),
    'available_seats', greatest(
      v_dep.capacity
        - public.shared_departure_confirmed_count(v_dep.id)
        - public.shared_departure_held_count(v_dep.id),
      0
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'Duplicate gygBookingReference');
END;
$$;

REVOKE ALL ON FUNCTION public.service_gyg_consume_reservation(TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_gyg_consume_reservation(TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT) TO service_role;
