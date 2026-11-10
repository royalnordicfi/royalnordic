-- Shared Bookings foundation (multi-supplier departures).
-- Local records only — GetYourGuide/Bókun channels are reserved, not synchronized.

CREATE TABLE IF NOT EXISTS public.shared_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shared_booking_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.shared_suppliers (id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.shared_departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board TEXT NOT NULL CHECK (board IN ('shared_bus', 'my_tours')),
  departure_date DATE NOT NULL,
  tour_code TEXT NOT NULL,
  tour_title TEXT NOT NULL,
  departure_time TEXT,
  meeting_point TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  tour_id INTEGER REFERENCES public.tours (id) ON DELETE SET NULL,
  tour_date_id BIGINT REFERENCES public.tour_dates (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board, departure_date, tour_code)
);

CREATE INDEX IF NOT EXISTS shared_departures_board_date_idx
  ON public.shared_departures (board, departure_date);

CREATE TABLE IF NOT EXISTS public.shared_departure_access (
  departure_id UUID NOT NULL REFERENCES public.shared_departures (id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.shared_suppliers (id) ON DELETE CASCADE,
  PRIMARY KEY (departure_id, supplier_id)
);

CREATE TABLE IF NOT EXISTS public.shared_departure_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_id UUID NOT NULL REFERENCES public.shared_departures (id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.shared_suppliers (id) ON DELETE RESTRICT,
  channel TEXT NOT NULL CHECK (
    channel IN (
      'royal_nordic_direct',
      'royal_nordic_manual',
      'royal_nordic_partner',
      'elias',
      'getyourguide',
      'bokun',
      'other'
    )
  ),
  -- Foundation: always local_only until a real external connection exists.
  sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK (
    sync_status IN ('local_only', 'pending_sync', 'synced')
  ),
  booking_ref TEXT,
  external_ref TEXT,
  guest_name TEXT,
  adults INTEGER NOT NULL DEFAULT 0 CHECK (adults >= 0),
  children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0),
  passenger_count INTEGER GENERATED ALWAYS AS (adults + children) STORED,
  pickup_location TEXT,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'pending')),
  rn_booking_id BIGINT REFERENCES public.bookings (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  CONSTRAINT shared_departure_bookings_pax_chk CHECK (adults + children > 0)
);

CREATE INDEX IF NOT EXISTS shared_departure_bookings_dep_status_idx
  ON public.shared_departure_bookings (departure_id, status);

CREATE INDEX IF NOT EXISTS shared_departure_bookings_supplier_idx
  ON public.shared_departure_bookings (supplier_id, departure_id);

-- Seed suppliers
INSERT INTO public.shared_suppliers (code, display_name)
VALUES
  ('royal_nordic', 'Royal Nordic'),
  ('elias', 'Elias')
ON CONFLICT (code) DO UPDATE
SET display_name = EXCLUDED.display_name,
    is_active = true;

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.shared_bookings_operator_supplier_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.supplier_id
  FROM public.shared_booking_operators o
  WHERE o.user_id = auth.uid()
    AND o.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.shared_bookings_is_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR public.shared_bookings_operator_supplier_id() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.shared_bookings_can_access_departure(p_departure_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board TEXT;
  v_supplier UUID;
BEGIN
  IF public.is_admin() THEN
    RETURN true;
  END IF;

  v_supplier := public.shared_bookings_operator_supplier_id();
  IF v_supplier IS NULL THEN
    RETURN false;
  END IF;

  SELECT d.board INTO v_board
  FROM public.shared_departures d
  WHERE d.id = p_departure_id;

  IF v_board IS NULL THEN
    RETURN false;
  END IF;

  -- Elias (and other non-admin operators): shared bus only, when authorized.
  IF v_board <> 'shared_bus' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.shared_departure_access a
    WHERE a.departure_id = p_departure_id
      AND a.supplier_id = v_supplier
  );
END;
$$;

REVOKE ALL ON FUNCTION public.shared_bookings_operator_supplier_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shared_bookings_is_operator() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shared_bookings_can_access_departure(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shared_bookings_operator_supplier_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.shared_bookings_is_operator() TO authenticated;
GRANT EXECUTE ON FUNCTION public.shared_bookings_can_access_departure(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.shared_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_booking_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_departure_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_departure_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shared_suppliers_admin_all ON public.shared_suppliers;
CREATE POLICY shared_suppliers_admin_all
  ON public.shared_suppliers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS shared_suppliers_operator_select ON public.shared_suppliers;
CREATE POLICY shared_suppliers_operator_select
  ON public.shared_suppliers FOR SELECT TO authenticated
  USING (
    public.shared_bookings_is_operator()
    AND (
      public.is_admin()
      OR id = public.shared_bookings_operator_supplier_id()
      OR code = 'royal_nordic' -- name-only visibility for breakdown labels on shared bus
    )
  );

DROP POLICY IF EXISTS shared_booking_operators_admin_all ON public.shared_booking_operators;
CREATE POLICY shared_booking_operators_admin_all
  ON public.shared_booking_operators FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS shared_booking_operators_self_select ON public.shared_booking_operators;
CREATE POLICY shared_booking_operators_self_select
  ON public.shared_booking_operators FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND is_active = true);

DROP POLICY IF EXISTS shared_departures_admin_all ON public.shared_departures;
CREATE POLICY shared_departures_admin_all
  ON public.shared_departures FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS shared_departures_operator_select ON public.shared_departures;
CREATE POLICY shared_departures_operator_select
  ON public.shared_departures FOR SELECT TO authenticated
  USING (public.shared_bookings_can_access_departure(id));

DROP POLICY IF EXISTS shared_departure_access_admin_all ON public.shared_departure_access;
CREATE POLICY shared_departure_access_admin_all
  ON public.shared_departure_access FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS shared_departure_access_operator_select ON public.shared_departure_access;
CREATE POLICY shared_departure_access_operator_select
  ON public.shared_departure_access FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      supplier_id = public.shared_bookings_operator_supplier_id()
      AND public.shared_bookings_can_access_departure(departure_id)
    )
  );

DROP POLICY IF EXISTS shared_departure_bookings_admin_all ON public.shared_departure_bookings;
CREATE POLICY shared_departure_bookings_admin_all
  ON public.shared_departure_bookings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Elias may only read their own supplier rows on authorized shared departures.
DROP POLICY IF EXISTS shared_departure_bookings_operator_select ON public.shared_departure_bookings;
CREATE POLICY shared_departure_bookings_operator_select
  ON public.shared_departure_bookings FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      supplier_id = public.shared_bookings_operator_supplier_id()
      AND public.shared_bookings_can_access_departure(departure_id)
    )
  );

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

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
      'channels_synced', false
    );
  END IF;

  SELECT o.supplier_id, s.code, s.display_name
  INTO v_supplier, v_code, v_name
  FROM public.shared_booking_operators o
  JOIN public.shared_suppliers s ON s.id = o.supplier_id
  WHERE o.user_id = auth.uid()
    AND o.is_active = true
    AND s.is_active = true
  LIMIT 1;

  IF v_supplier IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'access', 'none', 'boards', '[]'::jsonb, 'channels_synced', false);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'access', 'supplier',
    'boards', jsonb_build_array('shared_bus'),
    'supplier_id', v_supplier,
    'supplier_code', v_code,
    'supplier_name', v_name,
    'channels_synced', false
  );
END;
$$;

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
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
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

  -- Active manifest: confirmed + pending (pending does not occupy seats).
  -- Elias: own supplier rows only. Never include rn_booking_id, email, phone, prices.
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

  -- Cancelled preserved in history (same supplier visibility rules).
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

REVOKE ALL ON FUNCTION public.get_shared_bookings_access() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_shared_departures(TEXT, DATE, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_departure_detail(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_bookings_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_shared_departures(TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_departure_detail(UUID) TO authenticated;

COMMENT ON TABLE public.shared_departures IS
  'Shared Bookings foundation departures. Multi-supplier boards: shared_bus + my_tours.';
COMMENT ON TABLE public.shared_departure_bookings IS
  'Per-departure bookings by supplier/channel. Confirmed seats only count toward occupancy. External channels reserved; sync_status stays local_only until a real integration exists.';
COMMENT ON COLUMN public.shared_departure_bookings.rn_booking_id IS
  'Optional link to Royal Nordic bookings. Never returned to Elias operators via RPCs.';

-- ---------------------------------------------------------------------------
-- Foundation sample data (idempotent by board/date/tour_code)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_rn UUID;
  v_elias UUID;
  v_shared UUID;
  v_mine UUID;
  v_date1 DATE := CURRENT_DATE + 3;
  v_date2 DATE := CURRENT_DATE + 5;
BEGIN
  SELECT id INTO v_rn FROM public.shared_suppliers WHERE code = 'royal_nordic';
  SELECT id INTO v_elias FROM public.shared_suppliers WHERE code = 'elias';

  INSERT INTO public.shared_departures (
    board, departure_date, tour_code, tour_title, departure_time, meeting_point, capacity, tour_id
  )
  VALUES (
    'shared_bus', v_date1, 'standard_group_nl',
    'Standard Group Northern Lights', '20:00', 'Ruokasen katu 3, Rovaniemi', 50,
    (SELECT id FROM public.tours WHERE id = 10)
  )
  ON CONFLICT (board, departure_date, tour_code) DO UPDATE
  SET tour_title = EXCLUDED.tour_title,
      capacity = EXCLUDED.capacity,
      updated_at = now()
  RETURNING id INTO v_shared;

  INSERT INTO public.shared_departure_access (departure_id, supplier_id)
  VALUES (v_shared, v_rn), (v_shared, v_elias)
  ON CONFLICT DO NOTHING;

  -- Confirmed RN + Elias + one cancelled (cancelled must not occupy seats)
  IF NOT EXISTS (
    SELECT 1 FROM public.shared_departure_bookings WHERE departure_id = v_shared AND booking_ref = 'SB-DEMO-RN-1'
  ) THEN
    INSERT INTO public.shared_departure_bookings (
      departure_id, supplier_id, channel, booking_ref, guest_name, adults, children,
      pickup_location, status, sync_status
    ) VALUES
      (v_shared, v_rn, 'royal_nordic_direct', 'SB-DEMO-RN-1', 'Demo Guest RN', 2, 0, 'Meeting point', 'confirmed', 'local_only'),
      (v_shared, v_elias, 'elias', 'SB-DEMO-EL-1', 'Demo Guest Elias', 3, 1, 'Hotel Demo', 'confirmed', 'local_only'),
      (v_shared, v_rn, 'royal_nordic_manual', 'SB-DEMO-RN-X', 'Cancelled Demo', 2, 0, 'Meeting point', 'cancelled', 'local_only');

    UPDATE public.shared_departure_bookings
    SET cancelled_at = now()
    WHERE booking_ref = 'SB-DEMO-RN-X' AND cancelled_at IS NULL;
  END IF;

  INSERT INTO public.shared_departures (
    board, departure_date, tour_code, tour_title, departure_time, meeting_point, capacity, tour_id
  )
  VALUES (
    'my_tours', v_date2, 'guaranteed_nl',
    'Guaranteed Northern Lights & Photography Tour', '18:30', 'Hotel pickup (Rovaniemi)', 8,
    (SELECT id FROM public.tours WHERE id = 1)
  )
  ON CONFLICT (board, departure_date, tour_code) DO UPDATE
  SET tour_title = EXCLUDED.tour_title,
      capacity = EXCLUDED.capacity,
      updated_at = now()
  RETURNING id INTO v_mine;

  INSERT INTO public.shared_departure_access (departure_id, supplier_id)
  VALUES (v_mine, v_rn)
  ON CONFLICT DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.shared_departure_bookings WHERE departure_id = v_mine AND booking_ref = 'SB-DEMO-MY-1'
  ) THEN
    INSERT INTO public.shared_departure_bookings (
      departure_id, supplier_id, channel, booking_ref, guest_name, adults, children,
      pickup_location, status, sync_status
    ) VALUES
      (v_mine, v_rn, 'royal_nordic_direct', 'SB-DEMO-MY-1', 'Private Demo Guest', 2, 0, 'Arctic TreeHouse Hotel', 'confirmed', 'local_only');
  END IF;
END $$;
