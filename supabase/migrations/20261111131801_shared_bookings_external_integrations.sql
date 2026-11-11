-- Shared Bookings 1.5 — external GetYourGuide / Bókun integration foundation.
-- Live ingestion stays disabled until credentials, mappings and verification are configured.

CREATE TABLE IF NOT EXISTS public.shared_integration_connectors (
  provider TEXT PRIMARY KEY CHECK (provider IN ('getyourguide', 'bokun')),
  display_name TEXT NOT NULL,
  ingestion_enabled BOOLEAN NOT NULL DEFAULT false,
  config_status TEXT NOT NULL DEFAULT 'credentials_required'
    CHECK (config_status IN (
      'credentials_required',
      'credentials_present',
      'mappings_required',
      'ready',
      'error'
    )),
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL
);

INSERT INTO public.shared_integration_connectors (provider, display_name, notes)
VALUES
  (
    'getyourguide',
    'GetYourGuide',
    'GYG Supplier API: GYG calls our endpoints with HTTP Basic Auth (official). Secrets: SHARED_BOOKINGS_GYG_BASIC_USER, SHARED_BOOKINGS_GYG_BASIC_PASSWORD. Enable SHARED_BOOKINGS_GYG_INGESTION_ENABLED only after mappings. Outbound availability notify is not enabled in 1.5.'
  ),
  (
    'bokun',
    'Bókun',
    'Bókun webhooks use X-Bokun-HMAC (official). Secret: SHARED_BOOKINGS_BOKUN_WEBHOOK_SECRET. Optional GraphQL fetch keys for booking detail. Enable SHARED_BOOKINGS_BOKUN_INGESTION_ENABLED only after mappings. Webhook body is bookingId — detail enrichment needs API credentials.'
  )
ON CONFLICT (provider) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.shared_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('getyourguide', 'bokun')),
  external_product_id TEXT NOT NULL,
  external_option_id TEXT,
  template_id UUID REFERENCES public.shared_tour_templates (id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES public.shared_suppliers (id) ON DELETE RESTRICT,
  default_departure_time TEXT,
  adult_categories TEXT[] NOT NULL DEFAULT ARRAY['ADULT','SENIOR','YOUTH','STUDENT'],
  child_categories TEXT[] NOT NULL DEFAULT ARRAY['CHILD','INFANT'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS shared_product_mappings_provider_product_option_uidx
  ON public.shared_product_mappings (
    provider,
    external_product_id,
    (coalesce(external_option_id, ''))
  );

CREATE TABLE IF NOT EXISTS public.shared_inbound_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('getyourguide', 'bokun')),
  event_key TEXT NOT NULL,
  topic TEXT NOT NULL,
  external_booking_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN (
      'received',
      'processed',
      'quarantined',
      'failed',
      'ignored',
      'retrying'
    )),
  error_code TEXT,
  error_message TEXT,
  departure_id UUID REFERENCES public.shared_departures (id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.shared_departure_bookings (id) ON DELETE SET NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_key)
);

CREATE INDEX IF NOT EXISTS shared_inbound_events_status_idx
  ON public.shared_inbound_events (provider, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS shared_departure_bookings_channel_external_active_uidx
  ON public.shared_departure_bookings (channel, lower(trim(external_ref)))
  WHERE external_ref IS NOT NULL
    AND length(trim(external_ref)) > 0
    AND status = 'confirmed'
    AND channel IN ('getyourguide', 'bokun');

ALTER TABLE public.shared_integration_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_inbound_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shared_integration_connectors_admin_all ON public.shared_integration_connectors;
CREATE POLICY shared_integration_connectors_admin_all
  ON public.shared_integration_connectors FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS shared_product_mappings_admin_all ON public.shared_product_mappings;
CREATE POLICY shared_product_mappings_admin_all
  ON public.shared_product_mappings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS shared_inbound_events_admin_all ON public.shared_inbound_events;
CREATE POLICY shared_inbound_events_admin_all
  ON public.shared_inbound_events FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.admin_list_shared_integrations()
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
    'connectors', coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'provider', c.provider,
            'display_name', c.display_name,
            'ingestion_enabled', c.ingestion_enabled,
            'config_status', c.config_status,
            'last_success_at', c.last_success_at,
            'last_error_at', c.last_error_at,
            'last_error', c.last_error,
            'notes', c.notes,
            'mapping_count', (
              SELECT count(*)::int FROM public.shared_product_mappings m
              WHERE m.provider = c.provider AND m.is_active = true
            ),
            'open_event_count', (
              SELECT count(*)::int FROM public.shared_inbound_events e
              WHERE e.provider = c.provider
                AND e.status IN ('quarantined', 'failed', 'received', 'retrying')
            )
          )
          ORDER BY c.display_name
        )
        FROM public.shared_integration_connectors c
      ),
      '[]'::jsonb
    ),
    'live_ingestion_note',
      'Edge secrets required. Ingestion flags default off. Credentials are never returned by this RPC.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_shared_product_mappings(p_provider TEXT DEFAULT NULL)
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
    'mappings', coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'provider', m.provider,
            'external_product_id', m.external_product_id,
            'external_option_id', m.external_option_id,
            'template_id', m.template_id,
            'template_title', t.title,
            'supplier_id', m.supplier_id,
            'supplier_code', s.code,
            'supplier_name', s.display_name,
            'default_departure_time', m.default_departure_time,
            'adult_categories', m.adult_categories,
            'child_categories', m.child_categories,
            'is_active', m.is_active
          )
          ORDER BY m.provider, m.external_product_id
        )
        FROM public.shared_product_mappings m
        JOIN public.shared_suppliers s ON s.id = m.supplier_id
        LEFT JOIN public.shared_tour_templates t ON t.id = m.template_id
        WHERE p_provider IS NULL OR m.provider = p_provider
      ),
      '[]'::jsonb
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_shared_product_mapping(
  p_id UUID DEFAULT NULL,
  p_provider TEXT DEFAULT NULL,
  p_external_product_id TEXT DEFAULT NULL,
  p_external_option_id TEXT DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_default_departure_time TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.shared_product_mappings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF p_provider IS NULL OR p_provider NOT IN ('getyourguide', 'bokun') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_provider');
  END IF;
  IF nullif(trim(coalesce(p_external_product_id, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'external_product_id_required');
  END IF;
  IF p_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'supplier_required');
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.shared_product_mappings (
      provider, external_product_id, external_option_id, template_id, supplier_id,
      default_departure_time, is_active
    ) VALUES (
      p_provider,
      trim(p_external_product_id),
      nullif(trim(coalesce(p_external_option_id, '')), ''),
      p_template_id,
      p_supplier_id,
      nullif(trim(coalesce(p_default_departure_time, '')), ''),
      coalesce(p_is_active, true)
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.shared_product_mappings
    SET
      provider = p_provider,
      external_product_id = trim(p_external_product_id),
      external_option_id = nullif(trim(coalesce(p_external_option_id, '')), ''),
      template_id = p_template_id,
      supplier_id = p_supplier_id,
      default_departure_time = nullif(trim(coalesce(p_default_departure_time, '')), ''),
      is_active = coalesce(p_is_active, is_active),
      updated_at = now()
    WHERE id = p_id
    RETURNING * INTO v_row;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_found');
    END IF;
  END IF;

  UPDATE public.shared_integration_connectors
  SET config_status = CASE
        WHEN EXISTS (
          SELECT 1 FROM public.shared_product_mappings m
          WHERE m.provider = p_provider AND m.is_active = true
        ) THEN
          CASE WHEN config_status = 'credentials_required' THEN 'mappings_required' ELSE config_status END
        ELSE config_status
      END,
      updated_at = now()
  WHERE provider = p_provider;

  RETURN jsonb_build_object('ok', true, 'mapping_id', v_row.id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'mapping_exists');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_shared_inbound_events(
  p_provider TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
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
    'events', coalesce(
      (
        SELECT jsonb_agg(row_to_json(q)::jsonb)
        FROM (
          SELECT
            e.id,
            e.provider,
            e.event_key,
            e.topic,
            e.external_booking_id,
            e.status,
            e.error_code,
            e.error_message,
            e.departure_id,
            e.booking_id,
            e.attempt_count,
            e.processed_at,
            e.created_at,
            e.updated_at
          FROM public.shared_inbound_events e
          WHERE (p_provider IS NULL OR e.provider = p_provider)
            AND (p_status IS NULL OR e.status = p_status)
          ORDER BY e.created_at DESC
          LIMIT greatest(1, least(coalesce(p_limit, 50), 200))
        ) q
      ),
      '[]'::jsonb
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_shared_connector_flags(
  p_provider TEXT,
  p_ingestion_enabled BOOLEAN DEFAULT NULL,
  p_config_status TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF p_provider NOT IN ('getyourguide', 'bokun') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_provider');
  END IF;

  -- UI cannot force-enable ingestion unless config_status is ready and mappings exist.
  SELECT CASE
    WHEN p_ingestion_enabled IS FALSE THEN false
    WHEN p_ingestion_enabled IS TRUE
         AND coalesce(p_config_status, c.config_status) = 'ready'
         AND EXISTS (
           SELECT 1 FROM public.shared_product_mappings m
           WHERE m.provider = p_provider AND m.is_active = true
         ) THEN true
    WHEN p_ingestion_enabled IS TRUE THEN false
    ELSE c.ingestion_enabled
  END
  INTO v_enabled
  FROM public.shared_integration_connectors c
  WHERE c.provider = p_provider;

  UPDATE public.shared_integration_connectors
  SET
    ingestion_enabled = coalesce(v_enabled, false),
    config_status = coalesce(nullif(trim(p_config_status), ''), config_status),
    notes = CASE WHEN p_notes IS NULL THEN notes ELSE nullif(trim(p_notes), '') END,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE provider = p_provider;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'ingestion_enabled', coalesce(v_enabled, false));
END;
$$;

CREATE OR REPLACE FUNCTION public.service_upsert_shared_inbound_event(
  p_provider TEXT,
  p_event_key TEXT,
  p_topic TEXT,
  p_external_booking_id TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.shared_inbound_events%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  INSERT INTO public.shared_inbound_events (
    provider, event_key, topic, external_booking_id, payload, status, attempt_count
  ) VALUES (
    p_provider, p_event_key, p_topic, p_external_booking_id, coalesce(p_payload, '{}'::jsonb), 'received', 0
  )
  ON CONFLICT (provider, event_key) DO UPDATE
  SET
    payload = excluded.payload,
    topic = excluded.topic,
    external_booking_id = coalesce(excluded.external_booking_id, shared_inbound_events.external_booking_id),
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'ok', true,
    'event_id', v_row.id,
    'status', v_row.status,
    'already_processed', v_row.status = 'processed'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.service_process_shared_inbound_event(
  p_event_id UUID,
  p_allow_admin_retry BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ev public.shared_inbound_events%ROWTYPE;
  v_map public.shared_product_mappings%ROWTYPE;
  v_payload JSONB;
  v_product TEXT;
  v_option TEXT;
  v_date DATE;
  v_time TEXT;
  v_guest TEXT;
  v_adults INT;
  v_children INT;
  v_ref TEXT;
  v_email TEXT;
  v_phone TEXT;
  v_notes TEXT;
  v_dep public.shared_departures%ROWTYPE;
  v_booking public.shared_departure_bookings%ROWTYPE;
  v_confirmed INT;
  v_action TEXT;
  v_channel TEXT;
  v_conn public.shared_integration_connectors%ROWTYPE;
  v_tpl_code TEXT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND NOT (p_allow_admin_retry AND public.is_admin()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO v_ev FROM public.shared_inbound_events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_ev.status = 'processed' THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'status', 'processed', 'booking_id', v_ev.booking_id);
  END IF;

  SELECT * INTO v_conn FROM public.shared_integration_connectors WHERE provider = v_ev.provider;
  IF NOT FOUND OR v_conn.ingestion_enabled IS NOT TRUE THEN
    UPDATE public.shared_inbound_events
    SET status = 'quarantined',
        error_code = 'ingestion_disabled',
        error_message = 'Live ingestion is disabled until credentials, mappings and verification are confirmed.',
        attempt_count = attempt_count + 1,
        updated_at = now()
    WHERE id = p_event_id;
    RETURN jsonb_build_object('ok', false, 'error', 'ingestion_disabled', 'status', 'quarantined');
  END IF;

  v_payload := coalesce(v_ev.payload, '{}'::jsonb);
  v_action := lower(coalesce(v_payload->>'action', v_ev.topic));
  v_channel := CASE v_ev.provider WHEN 'getyourguide' THEN 'getyourguide' ELSE 'bokun' END;
  v_product := nullif(trim(coalesce(v_payload->>'external_product_id', '')), '');
  v_option := nullif(trim(coalesce(v_payload->>'external_option_id', '')), '');
  v_ref := coalesce(
    nullif(trim(coalesce(v_ev.external_booking_id, '')), ''),
    nullif(trim(coalesce(v_payload->>'external_booking_id', '')), '')
  );
  v_guest := nullif(trim(coalesce(v_payload->>'guest_name', '')), '');
  v_adults := greatest(coalesce((v_payload->>'adults')::int, 0), 0);
  v_children := greatest(coalesce((v_payload->>'children')::int, 0), 0);
  v_email := nullif(trim(coalesce(v_payload->>'contact_email', '')), '');
  v_phone := nullif(trim(coalesce(v_payload->>'contact_phone', '')), '');
  v_notes := nullif(trim(coalesce(v_payload->>'notes', '')), '');
  BEGIN
    v_date := nullif(trim(coalesce(v_payload->>'departure_date', '')), '')::date;
  EXCEPTION WHEN others THEN
    v_date := NULL;
  END;
  v_time := nullif(trim(coalesce(v_payload->>'departure_time', '')), '');

  UPDATE public.shared_inbound_events
  SET attempt_count = attempt_count + 1, status = 'retrying', updated_at = now()
  WHERE id = p_event_id;

  IF v_action LIKE '%cancel%' THEN
    IF v_ref IS NULL THEN
      UPDATE public.shared_inbound_events
      SET status = 'quarantined', error_code = 'missing_external_ref',
          error_message = 'Cancellation missing external booking id', updated_at = now()
      WHERE id = p_event_id;
      RETURN jsonb_build_object('ok', false, 'error', 'missing_external_ref', 'status', 'quarantined');
    END IF;

    SELECT * INTO v_booking
    FROM public.shared_departure_bookings b
    WHERE b.channel = v_channel
      AND lower(trim(b.external_ref)) = lower(v_ref)
      AND b.status = 'confirmed'
    FOR UPDATE;

    IF NOT FOUND THEN
      UPDATE public.shared_inbound_events
      SET status = 'ignored', error_code = 'booking_not_found',
          error_message = 'No confirmed external booking to cancel',
          processed_at = now(), updated_at = now()
      WHERE id = p_event_id;
      RETURN jsonb_build_object('ok', true, 'status', 'ignored');
    END IF;

    UPDATE public.shared_departure_bookings
    SET status = 'cancelled', cancelled_at = now(), updated_at = now()
    WHERE id = v_booking.id;

    PERFORM public.shared_bookings_log_event(
      v_booking.id, v_booking.departure_id, 'cancelled',
      jsonb_build_object('source', 'external', 'provider', v_ev.provider, 'external_ref', v_ref)
    );

    UPDATE public.shared_inbound_events
    SET status = 'processed', booking_id = v_booking.id, departure_id = v_booking.departure_id,
        processed_at = now(), error_code = NULL, error_message = NULL, updated_at = now()
    WHERE id = p_event_id;

    UPDATE public.shared_integration_connectors
    SET last_success_at = now(), last_error = NULL, updated_at = now()
    WHERE provider = v_ev.provider;

    RETURN jsonb_build_object('ok', true, 'status', 'processed', 'booking_id', v_booking.id, 'action', 'cancelled');
  END IF;

  IF v_product IS NULL OR v_date IS NULL OR v_ref IS NULL THEN
    UPDATE public.shared_inbound_events
    SET status = 'quarantined',
        error_code = 'unmatched_payload',
        error_message = 'Missing product, departure date or external booking id for create/update',
        updated_at = now()
    WHERE id = p_event_id;
    RETURN jsonb_build_object('ok', false, 'error', 'unmatched_payload', 'status', 'quarantined');
  END IF;

  IF v_adults + v_children < 1 THEN
    UPDATE public.shared_inbound_events
    SET status = 'quarantined', error_code = 'passenger_count_required',
        error_message = 'External booking has zero passengers', updated_at = now()
    WHERE id = p_event_id;
    RETURN jsonb_build_object('ok', false, 'error', 'passenger_count_required', 'status', 'quarantined');
  END IF;

  SELECT * INTO v_map
  FROM public.shared_product_mappings m
  WHERE m.provider = v_ev.provider
    AND m.is_active = true
    AND m.external_product_id = v_product
    AND coalesce(m.external_option_id, '') = coalesce(v_option, '')
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT * INTO v_map
    FROM public.shared_product_mappings m
    WHERE m.provider = v_ev.provider
      AND m.is_active = true
      AND m.external_product_id = v_product
      AND m.external_option_id IS NULL
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    UPDATE public.shared_inbound_events
    SET status = 'quarantined', error_code = 'unknown_product',
        error_message = format('No active mapping for %s product %s', v_ev.provider, v_product),
        updated_at = now()
    WHERE id = p_event_id;
    UPDATE public.shared_integration_connectors
    SET last_error_at = now(), last_error = 'unknown_product', config_status = 'mappings_required', updated_at = now()
    WHERE provider = v_ev.provider;
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_product', 'status', 'quarantined');
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
    UPDATE public.shared_inbound_events
    SET status = 'quarantined', error_code = 'unmatched_departure',
        error_message = format('No active Shared Bookings departure for %s on %s', v_product, v_date),
        updated_at = now()
    WHERE id = p_event_id;
    RETURN jsonb_build_object('ok', false, 'error', 'unmatched_departure', 'status', 'quarantined');
  END IF;

  SELECT * INTO v_booking
  FROM public.shared_departure_bookings b
  WHERE b.channel = v_channel
    AND lower(trim(b.external_ref)) = lower(v_ref)
  FOR UPDATE;

  IF FOUND AND v_booking.status = 'confirmed' THEN
    v_confirmed := public.shared_departure_confirmed_count(v_dep.id) - v_booking.passenger_count;
    IF v_confirmed + v_adults + v_children > v_dep.capacity THEN
      UPDATE public.shared_inbound_events
      SET status = 'failed', error_code = 'capacity_exceeded',
          error_message = 'Capacity conflict on update — flagged for admin review',
          departure_id = v_dep.id, booking_id = v_booking.id, updated_at = now()
      WHERE id = p_event_id;
      RETURN jsonb_build_object('ok', false, 'error', 'capacity_exceeded', 'status', 'failed');
    END IF;

    UPDATE public.shared_departure_bookings
    SET
      guest_name = coalesce(v_guest, guest_name),
      adults = v_adults,
      children = v_children,
      contact_email = coalesce(v_email, contact_email),
      contact_phone = coalesce(v_phone, contact_phone),
      notes = coalesce(v_notes, notes),
      booking_ref = coalesce(booking_ref, v_ref),
      supplier_id = v_map.supplier_id,
      departure_id = v_dep.id,
      sync_status = 'synced',
      updated_at = now()
    WHERE id = v_booking.id
    RETURNING * INTO v_booking;

    PERFORM public.shared_bookings_log_event(
      v_booking.id, v_dep.id, 'updated',
      jsonb_build_object('source', 'external', 'provider', v_ev.provider, 'external_ref', v_ref)
    );
  ELSIF FOUND AND v_booking.status = 'cancelled' THEN
    v_confirmed := public.shared_departure_confirmed_count(v_dep.id);
    IF v_confirmed + v_adults + v_children > v_dep.capacity THEN
      UPDATE public.shared_inbound_events
      SET status = 'failed', error_code = 'capacity_exceeded',
          error_message = 'Capacity conflict reactivating external booking',
          departure_id = v_dep.id, updated_at = now()
      WHERE id = p_event_id;
      RETURN jsonb_build_object('ok', false, 'error', 'capacity_exceeded', 'status', 'failed');
    END IF;
    UPDATE public.shared_departure_bookings
    SET
      status = 'confirmed',
      cancelled_at = NULL,
      cancelled_by = NULL,
      guest_name = coalesce(v_guest, guest_name, 'Guest'),
      adults = v_adults,
      children = v_children,
      supplier_id = v_map.supplier_id,
      departure_id = v_dep.id,
      sync_status = 'synced',
      updated_at = now()
    WHERE id = v_booking.id
    RETURNING * INTO v_booking;
  ELSE
    v_confirmed := public.shared_departure_confirmed_count(v_dep.id);
    IF v_confirmed + v_adults + v_children > v_dep.capacity THEN
      UPDATE public.shared_inbound_events
      SET status = 'failed', error_code = 'capacity_exceeded',
          error_message = 'Capacity conflict — booking not overbooked; admin review required',
          departure_id = v_dep.id, updated_at = now()
      WHERE id = p_event_id;
      UPDATE public.shared_integration_connectors
      SET last_error_at = now(), last_error = 'capacity_exceeded', updated_at = now()
      WHERE provider = v_ev.provider;
      RETURN jsonb_build_object('ok', false, 'error', 'capacity_exceeded', 'status', 'failed');
    END IF;

    INSERT INTO public.shared_departure_bookings (
      departure_id, supplier_id, channel, sync_status, booking_ref, external_ref,
      guest_name, adults, children, contact_email, contact_phone, notes, status
    ) VALUES (
      v_dep.id, v_map.supplier_id, v_channel, 'synced', v_ref, v_ref,
      coalesce(v_guest, 'Guest'), v_adults, v_children, v_email, v_phone, v_notes, 'confirmed'
    )
    RETURNING * INTO v_booking;

    PERFORM public.shared_bookings_log_event(
      v_booking.id, v_dep.id, 'created',
      jsonb_build_object('source', 'external', 'provider', v_ev.provider, 'external_ref', v_ref)
    );
  END IF;

  INSERT INTO public.shared_departure_access (departure_id, supplier_id)
  VALUES (v_dep.id, v_map.supplier_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.shared_inbound_events
  SET status = 'processed', booking_id = v_booking.id, departure_id = v_dep.id,
      processed_at = now(), error_code = NULL, error_message = NULL, updated_at = now()
  WHERE id = p_event_id;

  UPDATE public.shared_integration_connectors
  SET last_success_at = now(), last_error = NULL, updated_at = now()
  WHERE provider = v_ev.provider;

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'processed',
    'booking_id', v_booking.id,
    'departure_id', v_dep.id,
    'confirmed_passengers', public.shared_departure_confirmed_count(v_dep.id),
    'available_seats', greatest(v_dep.capacity - public.shared_departure_confirmed_count(v_dep.id), 0)
  );
EXCEPTION
  WHEN unique_violation THEN
    UPDATE public.shared_inbound_events
    SET status = 'failed', error_code = 'duplicate_external_ref',
        error_message = 'Duplicate external booking reference', updated_at = now()
    WHERE id = p_event_id;
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate_external_ref', 'status', 'failed');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_retry_shared_inbound_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
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

  UPDATE public.shared_inbound_events
  SET status = 'received', error_code = NULL, error_message = NULL, updated_at = now()
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN public.service_process_shared_inbound_event(p_event_id, true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_shared_integrations() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_shared_product_mappings(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_upsert_shared_product_mapping(UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_shared_inbound_events(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_shared_connector_flags(TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_retry_shared_inbound_event(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.service_upsert_shared_inbound_event(TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.service_process_shared_inbound_event(UUID, BOOLEAN) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_list_shared_integrations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_shared_product_mappings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_shared_product_mapping(UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_shared_inbound_events(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_shared_connector_flags(TEXT, BOOLEAN, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_retry_shared_inbound_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.service_upsert_shared_inbound_event(TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.service_process_shared_inbound_event(UUID, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.service_process_shared_inbound_event(UUID, BOOLEAN) TO authenticated;
