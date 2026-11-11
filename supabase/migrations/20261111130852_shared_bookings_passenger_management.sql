-- Shared Bookings 1.4 — manual passenger booking create / cancel / correct.

ALTER TABLE public.shared_departure_bookings
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.shared_departure_booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.shared_departure_bookings (id) ON DELETE CASCADE,
  departure_id UUID NOT NULL REFERENCES public.shared_departures (id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'updated', 'cancelled')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shared_departure_booking_events_booking_idx
  ON public.shared_departure_booking_events (booking_id, created_at DESC);

CREATE INDEX IF NOT EXISTS shared_departure_booking_events_departure_idx
  ON public.shared_departure_booking_events (departure_id, created_at DESC);

-- Idempotent confirmed refs per supplier (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS shared_departure_bookings_supplier_ref_active_uidx
  ON public.shared_departure_bookings (supplier_id, lower(trim(booking_ref)))
  WHERE booking_ref IS NOT NULL
    AND length(trim(booking_ref)) > 0
    AND status = 'confirmed';

ALTER TABLE public.shared_departure_booking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shared_departure_booking_events_admin_all ON public.shared_departure_booking_events;
CREATE POLICY shared_departure_booking_events_admin_all
  ON public.shared_departure_booking_events FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS shared_departure_booking_events_operator_select ON public.shared_departure_booking_events;
CREATE POLICY shared_departure_booking_events_operator_select
  ON public.shared_departure_booking_events FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.shared_departure_bookings b
      WHERE b.id = booking_id
        AND b.supplier_id = public.shared_bookings_operator_supplier_id()
        AND public.shared_bookings_can_access_departure(b.departure_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.shared_bookings_assert_mutable_access(p_departure_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access JSONB;
  v_dep public.shared_departures%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  v_access := public.get_shared_bookings_access();
  IF coalesce(v_access->>'access', 'none') = 'none' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF coalesce((v_access->>'must_change_password')::boolean, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'password_change_required');
  END IF;

  IF p_departure_id IS NULL OR NOT public.shared_bookings_can_access_departure(p_departure_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO v_dep FROM public.shared_departures WHERE id = p_departure_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_dep.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'departure_cancelled');
  END IF;
  IF v_dep.board = 'my_tours' AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  RETURN jsonb_build_object('ok', true, 'access', v_access, 'departure', to_jsonb(v_dep));
END;
$$;

CREATE OR REPLACE FUNCTION public.shared_bookings_manual_channel(p_supplier_code TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(p_supplier_code, ''))
    WHEN 'royal_nordic' THEN 'royal_nordic_manual'
    WHEN 'elias' THEN 'elias'
    ELSE 'royal_nordic_partner'
  END;
$$;

CREATE OR REPLACE FUNCTION public.shared_bookings_passenger_json(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', b.id,
    'booking_ref', b.booking_ref,
    'external_ref', b.external_ref,
    'guest_name', b.guest_name,
    'adults', b.adults,
    'children', b.children,
    'passenger_count', b.passenger_count,
    'pickup_location', b.pickup_location,
    'contact_email', b.contact_email,
    'contact_phone', b.contact_phone,
    'notes', b.notes,
    'status', b.status,
    'channel', b.channel,
    'sync_status', b.sync_status,
    'supplier_code', s.code,
    'supplier_name', s.display_name,
    'cancelled_at', b.cancelled_at
  )
  INTO v_row
  FROM public.shared_departure_bookings b
  JOIN public.shared_suppliers s ON s.id = b.supplier_id
  WHERE b.id = p_booking_id;

  RETURN coalesce(v_row, 'null'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.shared_bookings_log_event(
  p_booking_id UUID,
  p_departure_id UUID,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.shared_departure_booking_events (
    booking_id, departure_id, actor_user_id, event_type, payload
  ) VALUES (
    p_booking_id, p_departure_id, auth.uid(), p_event_type, coalesce(p_payload, '{}'::jsonb)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Create booking (admin or assigned operator; supplier never from client)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_shared_departure_booking(
  p_departure_id UUID,
  p_guest_name TEXT,
  p_adults INTEGER DEFAULT 1,
  p_children INTEGER DEFAULT 0,
  p_booking_ref TEXT DEFAULT NULL,
  p_pickup_location TEXT DEFAULT NULL,
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
  v_gate JSONB;
  v_dep public.shared_departures%ROWTYPE;
  v_supplier UUID;
  v_supplier_code TEXT;
  v_supplier_name TEXT;
  v_adults INTEGER;
  v_children INTEGER;
  v_pax INTEGER;
  v_ref TEXT;
  v_confirmed INTEGER;
  v_existing public.shared_departure_bookings%ROWTYPE;
  v_row public.shared_departure_bookings%ROWTYPE;
BEGIN
  v_gate := public.shared_bookings_assert_mutable_access(p_departure_id);
  IF NOT coalesce((v_gate->>'ok')::boolean, false) THEN
    RETURN v_gate;
  END IF;

  SELECT * INTO v_dep FROM public.shared_departures WHERE id = p_departure_id FOR UPDATE;

  IF public.is_admin() THEN
    SELECT s.id, s.code, s.display_name
    INTO v_supplier, v_supplier_code, v_supplier_name
    FROM public.shared_suppliers s
    WHERE s.code = 'royal_nordic' AND s.is_active = true
    LIMIT 1;
  ELSE
    v_supplier := public.shared_bookings_operator_supplier_id();
    SELECT s.code, s.display_name
    INTO v_supplier_code, v_supplier_name
    FROM public.shared_suppliers s
    WHERE s.id = v_supplier;
  END IF;

  IF v_supplier IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'supplier_missing');
  END IF;

  -- Operators may only book assigned shared_bus departures (asserted above).
  IF NOT public.is_admin() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.shared_departure_access a
      WHERE a.departure_id = p_departure_id AND a.supplier_id = v_supplier
    ) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
    END IF;
  END IF;

  v_adults := greatest(coalesce(p_adults, 0), 0);
  v_children := greatest(coalesce(p_children, 0), 0);
  v_pax := v_adults + v_children;
  IF v_pax < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'passenger_count_required');
  END IF;
  IF nullif(trim(coalesce(p_guest_name, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'guest_name_required');
  END IF;

  v_ref := nullif(trim(coalesce(p_booking_ref, '')), '');

  -- Safe idempotency: same supplier + booking_ref + departure + confirmed → return existing.
  IF v_ref IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM public.shared_departure_bookings b
    WHERE b.supplier_id = v_supplier
      AND b.status = 'confirmed'
      AND lower(trim(b.booking_ref)) = lower(v_ref)
    LIMIT 1;

    IF FOUND THEN
      IF v_existing.departure_id <> p_departure_id THEN
        RETURN jsonb_build_object('ok', false, 'error', 'duplicate_booking_ref');
      END IF;
      IF v_existing.adults = v_adults
         AND v_existing.children = v_children
         AND lower(coalesce(v_existing.guest_name, '')) = lower(trim(p_guest_name)) THEN
        RETURN jsonb_build_object(
          'ok', true,
          'idempotent', true,
          'booking', public.shared_bookings_passenger_json(v_existing.id),
          'confirmed_passengers', public.shared_departure_confirmed_count(p_departure_id),
          'available_seats', greatest(
            v_dep.capacity - public.shared_departure_confirmed_count(p_departure_id), 0
          )
        );
      END IF;
      RETURN jsonb_build_object('ok', false, 'error', 'duplicate_booking_ref');
    END IF;
  END IF;

  v_confirmed := public.shared_departure_confirmed_count(p_departure_id);
  IF v_confirmed + v_pax > v_dep.capacity THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'capacity_exceeded',
      'confirmed_passengers', v_confirmed,
      'available_seats', greatest(v_dep.capacity - v_confirmed, 0),
      'requested_passengers', v_pax
    );
  END IF;

  INSERT INTO public.shared_departure_bookings (
    departure_id, supplier_id, channel, sync_status, booking_ref, guest_name,
    adults, children, pickup_location, contact_email, contact_phone, notes,
    status, created_by, updated_by
  ) VALUES (
    p_departure_id,
    v_supplier,
    public.shared_bookings_manual_channel(v_supplier_code),
    'local_only',
    v_ref,
    trim(p_guest_name),
    v_adults,
    v_children,
    nullif(trim(coalesce(p_pickup_location, '')), ''),
    nullif(trim(coalesce(p_contact_email, '')), ''),
    nullif(trim(coalesce(p_contact_phone, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    'confirmed',
    auth.uid(),
    auth.uid()
  )
  RETURNING * INTO v_row;

  PERFORM public.shared_bookings_log_event(
    v_row.id,
    p_departure_id,
    'created',
    jsonb_build_object(
      'guest_name', v_row.guest_name,
      'adults', v_row.adults,
      'children', v_row.children,
      'booking_ref', v_row.booking_ref,
      'supplier_code', v_supplier_code
    )
  );

  v_confirmed := public.shared_departure_confirmed_count(p_departure_id);

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'booking', public.shared_bookings_passenger_json(v_row.id),
    'confirmed_passengers', v_confirmed,
    'available_seats', greatest(v_dep.capacity - v_confirmed, 0)
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate_booking_ref');
END;
$$;

-- ---------------------------------------------------------------------------
-- Cancel booking
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_shared_departure_booking(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.shared_departure_bookings%ROWTYPE;
  v_gate JSONB;
  v_supplier UUID;
  v_confirmed INTEGER;
  v_capacity INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_row
  FROM public.shared_departure_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  v_gate := public.shared_bookings_assert_mutable_access(v_row.departure_id);
  IF NOT coalesce((v_gate->>'ok')::boolean, false) THEN
    -- Allow cancel view on cancelled departures for admin history only via detail; mutations blocked.
    RETURN v_gate;
  END IF;

  IF NOT public.is_admin() THEN
    v_supplier := public.shared_bookings_operator_supplier_id();
    IF v_row.supplier_id IS DISTINCT FROM v_supplier THEN
      RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
    END IF;
  END IF;

  IF v_row.status = 'cancelled' THEN
    SELECT capacity INTO v_capacity FROM public.shared_departures WHERE id = v_row.departure_id;
    v_confirmed := public.shared_departure_confirmed_count(v_row.departure_id);
    RETURN jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'booking', public.shared_bookings_passenger_json(v_row.id),
      'confirmed_passengers', v_confirmed,
      'available_seats', greatest(coalesce(v_capacity, 0) - v_confirmed, 0)
    );
  END IF;

  UPDATE public.shared_departure_bookings
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = auth.uid(),
    updated_at = now(),
    updated_by = auth.uid()
  WHERE id = p_booking_id
  RETURNING * INTO v_row;

  PERFORM public.shared_bookings_log_event(
    v_row.id,
    v_row.departure_id,
    'cancelled',
    jsonb_build_object('passenger_count', v_row.passenger_count)
  );

  SELECT capacity INTO v_capacity FROM public.shared_departures WHERE id = v_row.departure_id;
  v_confirmed := public.shared_departure_confirmed_count(v_row.departure_id);

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'booking', public.shared_bookings_passenger_json(v_row.id),
    'confirmed_passengers', v_confirmed,
    'available_seats', greatest(coalesce(v_capacity, 0) - v_confirmed, 0)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Correct booking (name / pax / contact / notes / ref)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_shared_departure_booking(
  p_booking_id UUID,
  p_guest_name TEXT DEFAULT NULL,
  p_adults INTEGER DEFAULT NULL,
  p_children INTEGER DEFAULT NULL,
  p_booking_ref TEXT DEFAULT NULL,
  p_pickup_location TEXT DEFAULT NULL,
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
  v_row public.shared_departure_bookings%ROWTYPE;
  v_dep public.shared_departures%ROWTYPE;
  v_gate JSONB;
  v_supplier UUID;
  v_adults INTEGER;
  v_children INTEGER;
  v_pax INTEGER;
  v_delta INTEGER;
  v_confirmed INTEGER;
  v_ref TEXT;
  v_before JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_row
  FROM public.shared_departure_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_row.status <> 'confirmed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'booking_not_confirmed');
  END IF;

  v_gate := public.shared_bookings_assert_mutable_access(v_row.departure_id);
  IF NOT coalesce((v_gate->>'ok')::boolean, false) THEN
    RETURN v_gate;
  END IF;

  IF NOT public.is_admin() THEN
    v_supplier := public.shared_bookings_operator_supplier_id();
    IF v_row.supplier_id IS DISTINCT FROM v_supplier THEN
      RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
    END IF;
  END IF;

  SELECT * INTO v_dep FROM public.shared_departures WHERE id = v_row.departure_id FOR UPDATE;

  v_adults := coalesce(p_adults, v_row.adults);
  v_children := coalesce(p_children, v_row.children);
  v_adults := greatest(v_adults, 0);
  v_children := greatest(v_children, 0);
  v_pax := v_adults + v_children;
  IF v_pax < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'passenger_count_required');
  END IF;

  v_delta := v_pax - v_row.passenger_count;
  IF v_delta > 0 THEN
    v_confirmed := public.shared_departure_confirmed_count(v_row.departure_id);
    IF v_confirmed + v_delta > v_dep.capacity THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'capacity_exceeded',
        'confirmed_passengers', v_confirmed,
        'available_seats', greatest(v_dep.capacity - v_confirmed, 0),
        'requested_passengers', v_delta
      );
    END IF;
  END IF;

  IF p_booking_ref IS NOT NULL THEN
    v_ref := nullif(trim(p_booking_ref), '');
  ELSE
    v_ref := v_row.booking_ref;
  END IF;

  v_before := public.shared_bookings_passenger_json(v_row.id);

  UPDATE public.shared_departure_bookings
  SET
    guest_name = CASE
      WHEN p_guest_name IS NULL THEN guest_name
      ELSE nullif(trim(p_guest_name), '')
    END,
    adults = v_adults,
    children = v_children,
    booking_ref = v_ref,
    pickup_location = CASE
      WHEN p_pickup_location IS NULL THEN pickup_location
      ELSE nullif(trim(p_pickup_location), '')
    END,
    contact_email = CASE
      WHEN p_contact_email IS NULL THEN contact_email
      ELSE nullif(trim(p_contact_email), '')
    END,
    contact_phone = CASE
      WHEN p_contact_phone IS NULL THEN contact_phone
      ELSE nullif(trim(p_contact_phone), '')
    END,
    notes = CASE
      WHEN p_notes IS NULL THEN notes
      ELSE nullif(trim(p_notes), '')
    END,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE id = p_booking_id
  RETURNING * INTO v_row;

  IF v_row.guest_name IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'guest_name_required');
  END IF;

  PERFORM public.shared_bookings_log_event(
    v_row.id,
    v_row.departure_id,
    'updated',
    jsonb_build_object('before', v_before, 'after', public.shared_bookings_passenger_json(v_row.id))
  );

  v_confirmed := public.shared_departure_confirmed_count(v_row.departure_id);

  RETURN jsonb_build_object(
    'ok', true,
    'booking', public.shared_bookings_passenger_json(v_row.id),
    'confirmed_passengers', v_confirmed,
    'available_seats', greatest(v_dep.capacity - v_confirmed, 0)
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate_booking_ref');
END;
$$;

-- ---------------------------------------------------------------------------
-- Refresh detail payload to include contact/notes (no financial fields)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_shared_departure_detail(p_departure_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dep public.shared_departures%ROWTYPE;
  v_supplier UUID;
  v_confirmed INT;
  v_manifest JSONB;
  v_breakdown JSONB;
  v_history JSONB;
  v_access JSONB;
  v_assigned JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  v_access := public.get_shared_bookings_access();
  IF coalesce(v_access->>'access', 'none') = 'none' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF coalesce((v_access->>'must_change_password')::boolean, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'password_change_required');
  END IF;

  IF p_departure_id IS NULL OR NOT public.shared_bookings_can_access_departure(p_departure_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO v_dep FROM public.shared_departures WHERE id = p_departure_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_dep.board = 'my_tours' AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF v_dep.status = 'cancelled' AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  v_supplier := public.shared_bookings_operator_supplier_id();
  v_confirmed := public.shared_departure_confirmed_count(p_departure_id);

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'supplier_code', s.code,
        'supplier_name', s.display_name,
        'confirmed_passengers', sub.confirmed_passengers
      )
      ORDER BY s.display_name
    ),
    '[]'::jsonb
  )
  INTO v_breakdown
  FROM (
    SELECT b.supplier_id, coalesce(sum(b.passenger_count), 0)::int AS confirmed_passengers
    FROM public.shared_departure_bookings b
    WHERE b.departure_id = p_departure_id
      AND b.status = 'confirmed'
    GROUP BY b.supplier_id
  ) sub
  JOIN public.shared_suppliers s ON s.id = sub.supplier_id;

  SELECT coalesce(jsonb_agg(m ORDER BY (m->>'status'), (m->>'guest_name')), '[]'::jsonb)
  INTO v_manifest
  FROM (
    SELECT jsonb_build_object(
      'id', b.id,
      'booking_ref', b.booking_ref,
      'external_ref', b.external_ref,
      'guest_name', b.guest_name,
      'adults', b.adults,
      'children', b.children,
      'passenger_count', b.passenger_count,
      'pickup_location', b.pickup_location,
      'contact_email', b.contact_email,
      'contact_phone', b.contact_phone,
      'notes', b.notes,
      'status', b.status,
      'channel', b.channel,
      'sync_status', b.sync_status,
      'supplier_code', s.code,
      'supplier_name', s.display_name
    ) AS m
    FROM public.shared_departure_bookings b
    JOIN public.shared_suppliers s ON s.id = b.supplier_id
    WHERE b.departure_id = p_departure_id
      AND b.status IN ('confirmed', 'pending')
      AND (
        public.is_admin()
        OR b.supplier_id = v_supplier
      )
  ) q;

  SELECT coalesce(jsonb_agg(h ORDER BY (h->>'cancelled_at') DESC NULLS LAST), '[]'::jsonb)
  INTO v_history
  FROM (
    SELECT jsonb_build_object(
      'id', b.id,
      'booking_ref', b.booking_ref,
      'guest_name', b.guest_name,
      'adults', b.adults,
      'children', b.children,
      'passenger_count', b.passenger_count,
      'pickup_location', b.pickup_location,
      'contact_email', b.contact_email,
      'contact_phone', b.contact_phone,
      'notes', b.notes,
      'status', b.status,
      'channel', b.channel,
      'supplier_code', s.code,
      'supplier_name', s.display_name,
      'cancelled_at', b.cancelled_at
    ) AS h
    FROM public.shared_departure_bookings b
    JOIN public.shared_suppliers s ON s.id = b.supplier_id
    WHERE b.departure_id = p_departure_id
      AND b.status = 'cancelled'
      AND (
        public.is_admin()
        OR b.supplier_id = v_supplier
      )
  ) q;

  IF public.is_admin() THEN
    SELECT coalesce(jsonb_agg(a.supplier_id ORDER BY s.display_name), '[]'::jsonb)
    INTO v_assigned
    FROM public.shared_departure_access a
    JOIN public.shared_suppliers s ON s.id = a.supplier_id
    WHERE a.departure_id = p_departure_id;
  ELSE
    v_assigned := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'departure', jsonb_build_object(
      'id', v_dep.id,
      'board', v_dep.board,
      'departure_date', v_dep.departure_date,
      'tour_code', v_dep.tour_code,
      'tour_title', v_dep.tour_title,
      'departure_time', v_dep.departure_time,
      'meeting_point', v_dep.meeting_point,
      'capacity', v_dep.capacity,
      'status', v_dep.status,
      'template_id', v_dep.template_id,
      'confirmed_passengers', v_confirmed,
      'available_seats', greatest(v_dep.capacity - v_confirmed, 0),
      'supplier_breakdown', v_breakdown,
      'channels_synced', false
    ),
    'passengers', v_manifest,
    'cancelled', v_history,
    'assigned_supplier_ids', v_assigned,
    'channels_synced', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.shared_bookings_assert_mutable_access(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shared_bookings_manual_channel(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shared_bookings_passenger_json(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shared_bookings_log_event(UUID, UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_shared_departure_booking(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_shared_departure_booking(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_shared_departure_booking(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.shared_bookings_assert_mutable_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_shared_departure_booking(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_shared_departure_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_shared_departure_booking(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_departure_detail(UUID) TO authenticated;
