-- Shared Bookings 1.6C — GYG booking confirmation + cancellation lifecycle.
-- Completes Availability → Reserve → Book → Cancel on Shared Bookings capacity.
-- Production ingestion remains gated at the Edge env flag (not enabled here).

-- ---------------------------------------------------------------------------
-- Confirm booking (idempotent). Prefers consuming a valid hold.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.service_gyg_confirm_booking(
  p_product_id TEXT,
  p_date_time TEXT,
  p_gyg_booking_reference TEXT,
  p_reservation_reference TEXT DEFAULT NULL,
  p_adults INTEGER DEFAULT 0,
  p_children INTEGER DEFAULT 0,
  p_guest_name TEXT DEFAULT NULL,
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
  v_product TEXT := nullif(trim(coalesce(p_product_id, '')), '');
  v_gyg TEXT := nullif(trim(coalesce(p_gyg_booking_reference, '')), '');
  v_res TEXT := nullif(trim(coalesce(p_reservation_reference, '')), '');
  v_adults INT := greatest(coalesce(p_adults, 0), 0);
  v_children INT := greatest(coalesce(p_children, 0), 0);
  v_existing public.shared_departure_bookings%ROWTYPE;
  v_hold public.shared_departure_bookings%ROWTYPE;
  v_consumed JSONB;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF v_product IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'productId is required');
  END IF;
  IF v_gyg IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'gygBookingReference is required');
  END IF;
  IF v_adults + v_children < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_PARTICIPANTS_CONFIGURATION', 'error_message', 'At least one participant is required');
  END IF;

  -- Idempotent: already confirmed under GYG booking reference.
  SELECT * INTO v_existing
  FROM public.shared_departure_bookings b
  WHERE b.channel = 'getyourguide'
    AND b.status = 'confirmed'
    AND (
      lower(trim(b.external_ref)) = lower(v_gyg)
      OR lower(trim(coalesce(b.booking_ref, ''))) = lower(v_gyg)
    )
  ORDER BY b.updated_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'booking_id', v_existing.id,
      'departure_id', v_existing.departure_id,
      'external_ref', v_existing.external_ref,
      'booking_reference', v_existing.external_ref,
      'status', 'confirmed',
      'adults', v_existing.adults,
      'children', v_existing.children
    );
  END IF;

  -- Path A: explicit reservationReference → consume hold (atomic, no double-count).
  IF v_res IS NOT NULL THEN
    v_consumed := public.service_gyg_consume_reservation(
      v_res, v_gyg, p_guest_name, v_adults, v_children,
      p_contact_email, p_contact_phone, p_notes
    );
    IF coalesce((v_consumed->>'ok')::boolean, false) IS NOT TRUE THEN
      RETURN v_consumed;
    END IF;

    SELECT * INTO v_existing FROM public.shared_departure_bookings WHERE id = (v_consumed->>'booking_id')::uuid;
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', coalesce((v_consumed->>'idempotent')::boolean, false),
      'booking_id', v_consumed->>'booking_id',
      'departure_id', v_consumed->>'departure_id',
      'external_ref', coalesce(v_consumed->>'external_ref', v_gyg),
      'booking_reference', coalesce(v_consumed->>'external_ref', v_gyg),
      'status', 'confirmed',
      'adults', coalesce(v_existing.adults, v_adults),
      'children', coalesce(v_existing.children, v_children),
      'available_seats', v_consumed->'available_seats'
    );
  END IF;

  -- Path B: no reservationReference — recover active hold by GYG cart reference.
  SELECT * INTO v_hold
  FROM public.shared_departure_bookings b
  WHERE b.channel = 'getyourguide'
    AND b.status = 'pending'
    AND lower(trim(coalesce(b.booking_ref, ''))) = lower(v_gyg)
    AND b.hold_expires_at IS NOT NULL
    AND b.hold_expires_at > now()
  ORDER BY b.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    v_consumed := public.service_gyg_consume_reservation(
      v_hold.external_ref, v_gyg, p_guest_name, v_adults, v_children,
      p_contact_email, p_contact_phone, p_notes
    );
    IF coalesce((v_consumed->>'ok')::boolean, false) IS NOT TRUE THEN
      RETURN v_consumed;
    END IF;
    SELECT * INTO v_existing FROM public.shared_departure_bookings WHERE id = (v_consumed->>'booking_id')::uuid;
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', coalesce((v_consumed->>'idempotent')::boolean, false),
      'booking_id', v_consumed->>'booking_id',
      'departure_id', v_consumed->>'departure_id',
      'external_ref', coalesce(v_consumed->>'external_ref', v_gyg),
      'booking_reference', coalesce(v_consumed->>'external_ref', v_gyg),
      'status', 'confirmed',
      'adults', coalesce(v_existing.adults, v_adults),
      'children', coalesce(v_existing.children, v_children),
      'recovered_hold', true
    );
  END IF;

  -- Official book confirms a prior reservation. Without a recoverable hold → INVALID_RESERVATION.
  -- (Do not silently create a brand-new confirmed booking and skip the reserve step.)
  RETURN jsonb_build_object(
    'ok', false,
    'error', 'INVALID_RESERVATION',
    'error_message', 'No valid reservation found for this booking request'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.service_gyg_confirm_booking(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_gyg_confirm_booking(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Harden consume: on unique conflict, return existing confirmed booking (idempotent retry).
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
        'status', 'confirmed',
        'adults', v_hold.adults,
        'children', v_hold.children
      );
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION', 'error_message', 'Reservation not found');
  END IF;

  IF v_hold.status = 'confirmed' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'booking_id', v_hold.id,
      'departure_id', v_hold.departure_id,
      'external_ref', coalesce(nullif(trim(v_hold.external_ref), ''), v_gyg),
      'status', 'confirmed',
      'adults', v_hold.adults,
      'children', v_hold.children
    );
  END IF;

  IF v_hold.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION', 'error_message', 'Reservation was cancelled');
  END IF;

  IF v_hold.status <> 'pending'
     OR v_hold.hold_expires_at IS NULL
     OR v_hold.hold_expires_at <= now() THEN
    -- Failed confirmation must not leave an unusable active hold claiming capacity.
    IF v_hold.status = 'pending' THEN
      UPDATE public.shared_departure_bookings
      SET status = 'cancelled', cancelled_at = now(), hold_expires_at = NULL, updated_at = now()
      WHERE id = v_hold.id;
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_RESERVATION', 'error_message', 'Reservation expired');
  END IF;

  -- Mismatched GYG reference on an active hold → reject without consuming.
  IF v_hold.booking_ref IS NOT NULL
     AND lower(trim(v_hold.booking_ref)) IS DISTINCT FROM lower(v_gyg) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'INVALID_RESERVATION',
      'error_message', 'Reservation does not match gygBookingReference'
    );
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

  v_confirmed := public.shared_departure_confirmed_count(v_dep.id);
  v_held := public.shared_departure_held_count(v_dep.id) - v_hold.passenger_count;
  IF v_held < 0 THEN v_held := 0; END IF;

  IF v_confirmed + v_held + v_adults + v_children > v_dep.capacity THEN
    -- Do not cancel the hold on capacity race — caller may retry; hold still valid until expiry.
    RETURN jsonb_build_object('ok', false, 'error', 'NO_AVAILABILITY', 'error_message', 'Not enough capacity to confirm reservation');
  END IF;

  UPDATE public.shared_departure_bookings
  SET
    status = 'confirmed',
    sync_status = 'synced',
    booking_ref = coalesce(nullif(trim(booking_ref), ''), v_gyg),
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
    'adults', v_hold.adults,
    'children', v_hold.children,
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
        'status', 'confirmed',
        'adults', v_hold.adults,
        'children', v_hold.children
      );
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'Duplicate gygBookingReference');
END;
$$;

-- ---------------------------------------------------------------------------
-- Cancel confirmed booking (idempotent; stable lookup by GYG external refs)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.service_gyg_cancel_booking(
  p_booking_reference TEXT DEFAULT NULL,
  p_gyg_booking_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_book TEXT := nullif(trim(coalesce(p_booking_reference, '')), '');
  v_gyg TEXT := nullif(trim(coalesce(p_gyg_booking_reference, '')), '');
  v_lookup TEXT;
  v_row public.shared_departure_bookings%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  v_lookup := coalesce(v_gyg, v_book);
  IF v_lookup IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'VALIDATION_FAILURE', 'error_message', 'bookingReference or gygBookingReference is required');
  END IF;

  -- Prefer exact GYG booking reference, then supplier bookingReference.
  SELECT * INTO v_row
  FROM public.shared_departure_bookings b
  WHERE b.channel = 'getyourguide'
    AND (
      (v_gyg IS NOT NULL AND lower(trim(b.external_ref)) = lower(v_gyg))
      OR (v_gyg IS NOT NULL AND lower(trim(coalesce(b.booking_ref, ''))) = lower(v_gyg))
      OR (v_book IS NOT NULL AND lower(trim(b.external_ref)) = lower(v_book))
      OR (v_book IS NOT NULL AND lower(trim(coalesce(b.booking_ref, ''))) = lower(v_book))
    )
  ORDER BY
    CASE b.status WHEN 'confirmed' THEN 0 WHEN 'cancelled' THEN 1 ELSE 2 END,
    b.updated_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'INVALID_BOOKING',
      'error_message', 'The booking does not exist or is not in a valid state.'
    );
  END IF;

  IF v_row.status = 'cancelled' THEN
    -- Idempotent success (official also allows BOOKING_ALREADY_CANCELLED to reject).
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'status', 'cancelled',
      'booking_id', v_row.id,
      'departure_id', v_row.departure_id,
      'external_ref', v_row.external_ref
    );
  END IF;

  IF v_row.status = 'pending' THEN
    -- Pending hold cancelled via cancel-booking → release hold (treat as cancel reservation).
    UPDATE public.shared_departure_bookings
    SET status = 'cancelled',
        cancelled_at = now(),
        hold_expires_at = NULL,
        updated_at = now()
    WHERE id = v_row.id;

    PERFORM public.shared_bookings_log_event(
      v_row.id, v_row.departure_id, 'cancelled',
      jsonb_build_object('source', 'gyg', 'action', 'cancel_booking_pending_hold', 'external_ref', v_row.external_ref)
    );

    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'status', 'cancelled',
      'booking_id', v_row.id,
      'departure_id', v_row.departure_id,
      'external_ref', v_row.external_ref
    );
  END IF;

  IF v_row.status <> 'confirmed' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'INVALID_BOOKING',
      'error_message', 'The booking does not exist or is not in a valid state.'
    );
  END IF;

  UPDATE public.shared_departure_bookings
  SET status = 'cancelled',
      cancelled_at = now(),
      hold_expires_at = NULL,
      updated_at = now()
  WHERE id = v_row.id
    AND status = 'confirmed';

  IF NOT FOUND THEN
    -- Lost race to another cancel — still idempotent success.
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'status', 'cancelled',
      'booking_id', v_row.id,
      'departure_id', v_row.departure_id,
      'external_ref', v_row.external_ref
    );
  END IF;

  PERFORM public.shared_bookings_log_event(
    v_row.id, v_row.departure_id, 'cancelled',
    jsonb_build_object(
      'source', 'gyg',
      'action', 'cancel_booking',
      'external_ref', v_row.external_ref,
      'gyg_booking_reference', v_gyg,
      'booking_reference', v_book
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'status', 'cancelled',
    'booking_id', v_row.id,
    'departure_id', v_row.departure_id,
    'external_ref', v_row.external_ref,
    'released_passengers', v_row.passenger_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.service_gyg_cancel_booking(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_gyg_cancel_booking(TEXT, TEXT) TO service_role;
