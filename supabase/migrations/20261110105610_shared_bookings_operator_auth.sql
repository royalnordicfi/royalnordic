-- Shared Bookings 1.1 — operator provisioning metadata + first-login password gate.

ALTER TABLE public.shared_booking_operators
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS shared_booking_operators_email_uidx
  ON public.shared_booking_operators (lower(email))
  WHERE email IS NOT NULL;

COMMENT ON COLUMN public.shared_booking_operators.must_change_password IS
  'True until the operator sets their own password after admin provisioning. Admins never store or re-read plaintext passwords.';

CREATE OR REPLACE FUNCTION public.get_shared_bookings_access()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier UUID;
  v_code TEXT;
  v_name TEXT;
  v_must_change BOOLEAN;
  v_operator_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated', 'access', 'none');
  END IF;

  IF public.is_admin() THEN
    RETURN jsonb_build_object(
      'ok', true,
      'access', 'admin',
      'boards', jsonb_build_array('shared_bus', 'my_tours'),
      'supplier_code', 'royal_nordic',
      'supplier_name', 'Royal Nordic',
      'must_change_password', false,
      'channels_synced', false
    );
  END IF;

  SELECT o.id, o.supplier_id, s.code, s.display_name, o.must_change_password
  INTO v_operator_id, v_supplier, v_code, v_name, v_must_change
  FROM public.shared_booking_operators o
  JOIN public.shared_suppliers s ON s.id = o.supplier_id
  WHERE o.user_id = auth.uid()
    AND o.is_active = true
    AND s.is_active = true
  LIMIT 1;

  IF v_supplier IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'access', 'none',
      'boards', '[]'::jsonb,
      'must_change_password', false,
      'channels_synced', false
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'access', 'supplier',
    'boards', jsonb_build_array('shared_bus'),
    'supplier_id', v_supplier,
    'supplier_code', v_code,
    'supplier_name', v_name,
    'operator_id', v_operator_id,
    'must_change_password', coalesce(v_must_change, false),
    'channels_synced', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_shared_operator_password_change()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  UPDATE public.shared_booking_operators
  SET
    must_change_password = false,
    password_changed_at = now(),
    updated_at = now()
  WHERE user_id = auth.uid()
    AND is_active = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_operator');
  END IF;

  RETURN jsonb_build_object('ok', true, 'must_change_password', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_shared_booking_operators()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'operators', coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', o.id,
            'user_id', o.user_id,
            'email', o.email,
            'display_name', o.display_name,
            'is_active', o.is_active,
            'must_change_password', o.must_change_password,
            'password_changed_at', o.password_changed_at,
            'supplier_id', o.supplier_id,
            'supplier_code', s.code,
            'supplier_name', s.display_name,
            'created_at', o.created_at
          )
          ORDER BY o.created_at DESC
        )
        FROM public.shared_booking_operators o
        JOIN public.shared_suppliers s ON s.id = o.supplier_id
      ),
      '[]'::jsonb
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_shared_suppliers_admin()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'suppliers', coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'code', s.code,
            'display_name', s.display_name,
            'is_active', s.is_active
          )
          ORDER BY s.display_name
        )
        FROM public.shared_suppliers s
        WHERE s.is_active = true
      ),
      '[]'::jsonb
    )
  );
END;
$$;

-- Block departure data until first password change for operators.
CREATE OR REPLACE FUNCTION public.list_shared_departures(
  p_board TEXT,
  p_from DATE DEFAULT CURRENT_DATE,
  p_to DATE DEFAULT (CURRENT_DATE + 60)
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access JSONB;
  v_supplier UUID;
  v_rows JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_board IS NULL OR p_board NOT IN ('shared_bus', 'my_tours') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_board');
  END IF;

  v_access := public.get_shared_bookings_access();
  IF coalesce(v_access->>'access', 'none') = 'none' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF coalesce((v_access->>'must_change_password')::boolean, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'password_change_required');
  END IF;

  IF p_board = 'my_tours' AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden_board');
  END IF;

  v_supplier := public.shared_bookings_operator_supplier_id();

  SELECT coalesce(jsonb_agg(row_data ORDER BY (row_data->>'departure_date'), (row_data->>'tour_title')), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT jsonb_build_object(
      'id', d.id,
      'board', d.board,
      'departure_date', d.departure_date,
      'tour_code', d.tour_code,
      'tour_title', d.tour_title,
      'departure_time', d.departure_time,
      'meeting_point', d.meeting_point,
      'capacity', d.capacity,
      'confirmed_passengers', coalesce(occ.confirmed_passengers, 0),
      'available_seats', greatest(d.capacity - coalesce(occ.confirmed_passengers, 0), 0),
      'supplier_breakdown', coalesce(brk.breakdown, '[]'::jsonb),
      'channels_synced', false
    ) AS row_data
    FROM public.shared_departures d
    LEFT JOIN LATERAL (
      SELECT coalesce(sum(b.passenger_count), 0)::int AS confirmed_passengers
      FROM public.shared_departure_bookings b
      WHERE b.departure_id = d.id
        AND b.status = 'confirmed'
    ) occ ON true
    LEFT JOIN LATERAL (
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
      ) AS breakdown
      FROM (
        SELECT b.supplier_id, coalesce(sum(b.passenger_count), 0)::int AS confirmed_passengers
        FROM public.shared_departure_bookings b
        WHERE b.departure_id = d.id
          AND b.status = 'confirmed'
        GROUP BY b.supplier_id
      ) sub
      JOIN public.shared_suppliers s ON s.id = sub.supplier_id
    ) brk ON true
    WHERE d.board = p_board
      AND d.departure_date >= coalesce(p_from, CURRENT_DATE)
      AND d.departure_date <= coalesce(p_to, CURRENT_DATE + 60)
      AND (
        public.is_admin()
        OR (
          p_board = 'shared_bus'
          AND EXISTS (
            SELECT 1
            FROM public.shared_departure_access a
            WHERE a.departure_id = d.id
              AND a.supplier_id = v_supplier
          )
        )
      )
  ) q;

  RETURN jsonb_build_object(
    'ok', true,
    'board', p_board,
    'departures', v_rows,
    'channels_synced', false
  );
END;
$$;

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

  SELECT * INTO v_dep
  FROM public.shared_departures
  WHERE id = p_departure_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_dep.board = 'my_tours' AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  v_supplier := public.shared_bookings_operator_supplier_id();

  SELECT coalesce(sum(b.passenger_count), 0)::int
  INTO v_confirmed
  FROM public.shared_departure_bookings b
  WHERE b.departure_id = p_departure_id
    AND b.status = 'confirmed';

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
      'passenger_count', b.passenger_count,
      'pickup_location', b.pickup_location,
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
      'confirmed_passengers', v_confirmed,
      'available_seats', greatest(v_dep.capacity - v_confirmed, 0),
      'supplier_breakdown', v_breakdown,
      'channels_synced', false
    ),
    'passengers', v_manifest,
    'cancelled', v_history,
    'channels_synced', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_shared_operator_password_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_shared_booking_operators() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_shared_suppliers_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_shared_operator_password_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_shared_booking_operators() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_shared_suppliers_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_bookings_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_shared_departures(TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_departure_detail(UUID) TO authenticated;
