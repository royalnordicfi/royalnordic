-- Shared Bookings 1.3 — tour templates + departure calendar management (admin RPCs).

CREATE TABLE IF NOT EXISTS public.shared_tour_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'shared_bus'
    CHECK (category IN ('shared_bus', 'my_tours')),
  meeting_point TEXT,
  default_capacity INTEGER NOT NULL DEFAULT 50 CHECK (default_capacity > 0),
  default_departure_time TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_departures
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.shared_tour_templates (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled')),
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

-- Allow recreating a tour_code on the same day after cancel.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shared_departures_board_departure_date_tour_code_key'
  ) THEN
    ALTER TABLE public.shared_departures
      DROP CONSTRAINT shared_departures_board_departure_date_tour_code_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS shared_departures_active_unique
  ON public.shared_departures (board, departure_date, tour_code)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS shared_departures_status_date_idx
  ON public.shared_departures (status, departure_date);

ALTER TABLE public.shared_tour_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shared_tour_templates_admin_all ON public.shared_tour_templates;
CREATE POLICY shared_tour_templates_admin_all
  ON public.shared_tour_templates FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS shared_tour_templates_operator_select ON public.shared_tour_templates;
CREATE POLICY shared_tour_templates_operator_select
  ON public.shared_tour_templates FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      is_active = true
      AND public.shared_bookings_operator_supplier_id() IS NOT NULL
    )
  );

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.shared_departure_confirmed_count(p_departure_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(sum(b.passenger_count), 0)::int
  FROM public.shared_departure_bookings b
  WHERE b.departure_id = p_departure_id
    AND b.status = 'confirmed';
$$;

GRANT EXECUTE ON FUNCTION public.shared_departure_confirmed_count(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Templates (admin)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_shared_tour_templates(p_include_inactive BOOLEAN DEFAULT false)
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
    'templates', coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'code', t.code,
            'title', t.title,
            'category', t.category,
            'meeting_point', t.meeting_point,
            'default_capacity', t.default_capacity,
            'default_departure_time', t.default_departure_time,
            'is_active', t.is_active,
            'created_at', t.created_at
          )
          ORDER BY t.title
        )
        FROM public.shared_tour_templates t
        WHERE p_include_inactive OR t.is_active = true
      ),
      '[]'::jsonb
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_shared_tour_template(
  p_id UUID DEFAULT NULL,
  p_code TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'shared_bus',
  p_meeting_point TEXT DEFAULT NULL,
  p_default_capacity INTEGER DEFAULT 50,
  p_default_departure_time TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_title TEXT;
  v_category TEXT;
  v_cap INTEGER;
  v_row public.shared_tour_templates%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  v_title := nullif(trim(coalesce(p_title, '')), '');
  v_code := lower(regexp_replace(coalesce(nullif(trim(p_code), ''), coalesce(v_title, 'tour')), '[^a-z0-9]+', '_', 'g'));
  v_code := trim(both '_' from v_code);
  IF v_code = '' OR v_title IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'title_required');
  END IF;

  v_category := coalesce(nullif(trim(p_category), ''), 'shared_bus');
  IF v_category NOT IN ('shared_bus', 'my_tours') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_category');
  END IF;

  v_cap := coalesce(p_default_capacity, 50);
  IF v_cap < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_capacity');
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.shared_tour_templates (
      code, title, category, meeting_point, default_capacity, default_departure_time, is_active, created_by
    ) VALUES (
      v_code, v_title, v_category, nullif(trim(coalesce(p_meeting_point, '')), ''),
      v_cap, nullif(trim(coalesce(p_default_departure_time, '')), ''), coalesce(p_is_active, true), auth.uid()
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.shared_tour_templates t
    SET
      code = v_code,
      title = v_title,
      category = v_category,
      meeting_point = nullif(trim(coalesce(p_meeting_point, '')), ''),
      default_capacity = v_cap,
      default_departure_time = nullif(trim(coalesce(p_default_departure_time, '')), ''),
      is_active = coalesce(p_is_active, t.is_active),
      updated_at = now()
    WHERE t.id = p_id
    RETURNING * INTO v_row;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_found');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'template', jsonb_build_object(
      'id', v_row.id,
      'code', v_row.code,
      'title', v_row.title,
      'category', v_row.category,
      'meeting_point', v_row.meeting_point,
      'default_capacity', v_row.default_capacity,
      'default_departure_time', v_row.default_departure_time,
      'is_active', v_row.is_active,
      'created_at', v_row.created_at
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'code_exists');
END;
$$;

-- ---------------------------------------------------------------------------
-- Departures (admin mutations)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_create_shared_departure(
  p_template_id UUID DEFAULT NULL,
  p_board TEXT DEFAULT 'shared_bus',
  p_departure_date DATE DEFAULT NULL,
  p_departure_time TEXT DEFAULT NULL,
  p_capacity INTEGER DEFAULT NULL,
  p_meeting_point TEXT DEFAULT NULL,
  p_tour_code TEXT DEFAULT NULL,
  p_tour_title TEXT DEFAULT NULL,
  p_supplier_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tpl public.shared_tour_templates%ROWTYPE;
  v_board TEXT;
  v_code TEXT;
  v_title TEXT;
  v_time TEXT;
  v_meet TEXT;
  v_cap INTEGER;
  v_dep public.shared_departures%ROWTYPE;
  v_sid UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF p_departure_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'departure_date_required');
  END IF;

  IF p_template_id IS NOT NULL THEN
    SELECT * INTO v_tpl FROM public.shared_tour_templates WHERE id = p_template_id AND is_active = true;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'template_not_found');
    END IF;
  END IF;

  v_board := coalesce(nullif(trim(p_board), ''), v_tpl.category, 'shared_bus');
  IF v_board NOT IN ('shared_bus', 'my_tours') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_board');
  END IF;

  v_title := coalesce(nullif(trim(p_tour_title), ''), v_tpl.title);
  v_code := coalesce(
    nullif(trim(p_tour_code), ''),
    v_tpl.code,
    lower(regexp_replace(coalesce(v_title, 'tour'), '[^a-z0-9]+', '_', 'g'))
  );
  v_code := trim(both '_' from v_code);
  IF v_title IS NULL OR v_code = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tour_required');
  END IF;

  v_time := coalesce(nullif(trim(p_departure_time), ''), v_tpl.default_departure_time);
  v_meet := coalesce(nullif(trim(p_meeting_point), ''), v_tpl.meeting_point);
  v_cap := coalesce(p_capacity, v_tpl.default_capacity, 50);
  IF v_cap < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_capacity');
  END IF;

  INSERT INTO public.shared_departures (
    board, departure_date, tour_code, tour_title, departure_time, meeting_point,
    capacity, template_id, status
  ) VALUES (
    v_board, p_departure_date, v_code, v_title, v_time, v_meet, v_cap, p_template_id, 'active'
  )
  RETURNING * INTO v_dep;

  -- Always grant Royal Nordic access on shared_bus; plus any requested suppliers.
  IF v_board = 'shared_bus' THEN
    INSERT INTO public.shared_departure_access (departure_id, supplier_id)
    SELECT v_dep.id, s.id
    FROM public.shared_suppliers s
    WHERE s.code = 'royal_nordic' AND s.is_active = true
    ON CONFLICT DO NOTHING;

    IF p_supplier_ids IS NOT NULL THEN
      FOREACH v_sid IN ARRAY p_supplier_ids LOOP
        INSERT INTO public.shared_departure_access (departure_id, supplier_id)
        VALUES (v_dep.id, v_sid)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
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
      'confirmed_passengers', 0,
      'available_seats', v_dep.capacity,
      'supplier_breakdown', '[]'::jsonb,
      'channels_synced', false
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'departure_exists');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_shared_departure(
  p_departure_id UUID,
  p_departure_date DATE DEFAULT NULL,
  p_departure_time TEXT DEFAULT NULL,
  p_capacity INTEGER DEFAULT NULL,
  p_meeting_point TEXT DEFAULT NULL,
  p_tour_title TEXT DEFAULT NULL,
  p_supplier_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dep public.shared_departures%ROWTYPE;
  v_confirmed INTEGER;
  v_cap INTEGER;
  v_sid UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO v_dep FROM public.shared_departures WHERE id = p_departure_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_dep.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'departure_cancelled');
  END IF;

  v_confirmed := public.shared_departure_confirmed_count(p_departure_id);
  v_cap := coalesce(p_capacity, v_dep.capacity);
  IF v_cap < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_capacity');
  END IF;
  IF v_cap < v_confirmed THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'capacity_below_occupancy',
      'confirmed_passengers', v_confirmed,
      'requested_capacity', v_cap
    );
  END IF;

  UPDATE public.shared_departures
  SET
    departure_date = coalesce(p_departure_date, departure_date),
    departure_time = CASE
      WHEN p_departure_time IS NULL THEN departure_time
      ELSE nullif(trim(p_departure_time), '')
    END,
    meeting_point = CASE
      WHEN p_meeting_point IS NULL THEN meeting_point
      ELSE nullif(trim(p_meeting_point), '')
    END,
    tour_title = coalesce(nullif(trim(p_tour_title), ''), tour_title),
    capacity = v_cap,
    updated_at = now()
  WHERE id = p_departure_id
  RETURNING * INTO v_dep;

  IF p_supplier_ids IS NOT NULL AND v_dep.board = 'shared_bus' THEN
    DELETE FROM public.shared_departure_access a
    WHERE a.departure_id = p_departure_id
      AND a.supplier_id NOT IN (
        SELECT s.id FROM public.shared_suppliers s WHERE s.code = 'royal_nordic'
      )
      AND NOT (a.supplier_id = ANY (p_supplier_ids));

    FOREACH v_sid IN ARRAY p_supplier_ids LOOP
      INSERT INTO public.shared_departure_access (departure_id, supplier_id)
      VALUES (p_departure_id, v_sid)
      ON CONFLICT DO NOTHING;
    END LOOP;

    INSERT INTO public.shared_departure_access (departure_id, supplier_id)
    SELECT p_departure_id, s.id
    FROM public.shared_suppliers s
    WHERE s.code = 'royal_nordic' AND s.is_active = true
    ON CONFLICT DO NOTHING;
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
      'channels_synced', false
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'departure_exists');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_cancel_shared_departure(p_departure_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dep public.shared_departures%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  UPDATE public.shared_departures
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = auth.uid(),
    updated_at = now()
  WHERE id = p_departure_id
    AND status = 'active'
  RETURNING * INTO v_dep;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found_or_cancelled');
  END IF;

  RETURN jsonb_build_object('ok', true, 'departure_id', v_dep.id, 'status', 'cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_departure_access(p_departure_id UUID)
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
    'supplier_ids', coalesce(
      (
        SELECT jsonb_agg(a.supplier_id ORDER BY s.display_name)
        FROM public.shared_departure_access a
        JOIN public.shared_suppliers s ON s.id = a.supplier_id
        WHERE a.departure_id = p_departure_id
      ),
      '[]'::jsonb
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Replace list/detail to include status and hide cancelled by default
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.list_shared_departures(TEXT, DATE, DATE);

CREATE OR REPLACE FUNCTION public.list_shared_departures(
  p_board TEXT,
  p_from DATE DEFAULT CURRENT_DATE,
  p_to DATE DEFAULT (CURRENT_DATE + 60),
  p_include_cancelled BOOLEAN DEFAULT false
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
      'status', d.status,
      'template_id', d.template_id,
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
      AND (p_include_cancelled OR d.status = 'active')
      AND (
        public.is_admin()
        OR (
          p_board = 'shared_bus'
          AND d.status = 'active'
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

REVOKE ALL ON FUNCTION public.list_shared_tour_templates(BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_upsert_shared_tour_template(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_shared_departure(UUID, TEXT, DATE, TEXT, INTEGER, TEXT, TEXT, TEXT, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_shared_departure(UUID, DATE, TEXT, INTEGER, TEXT, TEXT, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_cancel_shared_departure(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_departure_access(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_shared_tour_templates(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_shared_tour_template(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_shared_departure(UUID, TEXT, DATE, TEXT, INTEGER, TEXT, TEXT, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_shared_departure(UUID, DATE, TEXT, INTEGER, TEXT, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cancel_shared_departure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_departure_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_shared_departures(TEXT, DATE, DATE, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_departure_detail(UUID) TO authenticated;
