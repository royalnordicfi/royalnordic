-- B2B.6: Partner booking requests (pending → admin approve/decline).
-- Approval atomically reserves capacity and creates a canonical bookings row.
-- No payment collection.

CREATE TABLE IF NOT EXISTS public.partner_booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  partner_company_id UUID NOT NULL REFERENCES public.partner_companies (id) ON DELETE RESTRICT,
  tour_id INTEGER NOT NULL REFERENCES public.tours (id) ON DELETE RESTRICT,
  tour_date DATE NOT NULL,
  tour_date_id BIGINT REFERENCES public.tour_dates (id) ON DELETE SET NULL,
  adults INTEGER NOT NULL CHECK (adults >= 0),
  children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0),
  passenger_count INTEGER NOT NULL CHECK (passenger_count >= 1),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  pickup_location TEXT,
  special_requests TEXT,
  partner_price_id UUID REFERENCES public.partner_tour_prices (id) ON DELETE SET NULL,
  unit_net_eur NUMERIC(10, 2) NOT NULL CHECK (unit_net_eur >= 0),
  total_net_eur NUMERIC(10, 2) NOT NULL CHECK (total_net_eur >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  pricing_type TEXT NOT NULL,
  pricing_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')),
  booking_id BIGINT REFERENCES public.bookings (id) ON DELETE SET NULL,
  idempotency_key TEXT NOT NULL,
  submitted_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_note TEXT,
  decline_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT partner_booking_requests_pax_sum CHECK (passenger_count = adults + children),
  CONSTRAINT partner_booking_requests_email_format
    CHECK (guest_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_booking_requests_reference_uidx
  ON public.partner_booking_requests (reference);

CREATE UNIQUE INDEX IF NOT EXISTS partner_booking_requests_idempotency_uidx
  ON public.partner_booking_requests (partner_company_id, idempotency_key);

CREATE INDEX IF NOT EXISTS partner_booking_requests_company_status_idx
  ON public.partner_booking_requests (partner_company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS partner_booking_requests_status_date_idx
  ON public.partner_booking_requests (status, tour_date);

ALTER TABLE public.partner_booking_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partner_booking_requests_admin_all ON public.partner_booking_requests;
CREATE POLICY partner_booking_requests_admin_all
  ON public.partner_booking_requests FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Partners: select own company rows only (no writes via table — RPC only).
DROP POLICY IF EXISTS partner_booking_requests_member_select ON public.partner_booking_requests;
CREATE POLICY partner_booking_requests_member_select
  ON public.partner_booking_requests FOR SELECT TO authenticated
  USING (public.is_active_partner_member(partner_company_id));

CREATE OR REPLACE FUNCTION public._partner_next_request_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  candidate TEXT;
BEGIN
  LOOP
    candidate := 'PB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.partner_booking_requests WHERE reference = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public._partner_ensure_tour_date(p_tour_id INTEGER, p_date DATE)
RETURNS public.tour_dates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  td public.tour_dates%ROWTYPE;
  cap INTEGER;
BEGIN
  SELECT * INTO td
  FROM public.tour_dates
  WHERE tour_id = p_tour_id AND date = p_date
  FOR UPDATE;

  IF FOUND THEN
    RETURN td;
  END IF;

  SELECT COALESCE(max_capacity, 8) INTO cap FROM public.tours WHERE id = p_tour_id;
  INSERT INTO public.tour_dates (tour_id, date, available_slots, total_booked)
  VALUES (p_tour_id, p_date, COALESCE(cap, 8), 0)
  ON CONFLICT (tour_id, date) DO NOTHING;

  SELECT * INTO td
  FROM public.tour_dates
  WHERE tour_id = p_tour_id AND date = p_date
  FOR UPDATE;

  RETURN td;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_partner_tour_availability(
  p_tour_id INTEGER,
  p_from DATE DEFAULT CURRENT_DATE,
  p_to DATE DEFAULT (CURRENT_DATE + 90)
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  mem public.partner_members%ROWTYPE;
  t public.tours%ROWTYPE;
  has_rate BOOLEAN := FALSE;
  result JSONB;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO mem FROM public.partner_members
  WHERE user_id = uid AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_partner');
  END IF;

  SELECT * INTO t FROM public.tours WHERE id = p_tour_id AND COALESCE(is_active, FALSE) = TRUE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tour_not_found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.partner_tour_prices p
    WHERE p.partner_company_id = mem.partner_company_id
      AND p.tour_id = p_tour_id
      AND public._partner_rate_is_effective(p.is_active, p.effective_from, p.effective_to, CURRENT_DATE)
  ) INTO has_rate;

  IF NOT has_rate THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_partner_rate');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(x)::jsonb ORDER BY x.date), '[]'::jsonb)
  INTO result
  FROM (
    SELECT
      td.id AS tour_date_id,
      td.date,
      td.available_slots,
      COALESCE(td.total_booked, 0) AS total_booked,
      GREATEST(td.available_slots - COALESCE(td.total_booked, 0), 0) AS remaining,
      t.pricing_model,
      t.max_capacity
    FROM public.tour_dates td
    WHERE td.tour_id = p_tour_id
      AND td.date >= GREATEST(p_from, CURRENT_DATE)
      AND td.date <= p_to
      AND (td.available_slots - COALESCE(td.total_booked, 0)) > 0
  ) x;

  RETURN jsonb_build_object(
    'ok', true,
    'tour_id', p_tour_id,
    'pricing_model', t.pricing_model,
    'max_capacity', t.max_capacity,
    'dates', result
  );
END;
$$;

REVOKE ALL ON FUNCTION public.list_partner_tour_availability(INTEGER, DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_partner_tour_availability(INTEGER, DATE, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_partner_booking_request(
  p_tour_id INTEGER,
  p_tour_date DATE,
  p_adults INTEGER,
  p_children INTEGER DEFAULT 0,
  p_guest_name TEXT DEFAULT NULL,
  p_guest_email TEXT DEFAULT NULL,
  p_guest_phone TEXT DEFAULT NULL,
  p_pickup_location TEXT DEFAULT NULL,
  p_special_requests TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  mem public.partner_members%ROWTYPE;
  t public.tours%ROWTYPE;
  pr public.partner_tour_prices%ROWTYPE;
  td public.tour_dates%ROWTYPE;
  unit_net NUMERIC;
  total_net NUMERIC;
  pax INTEGER;
  seats_needed INTEGER;
  remaining INTEGER;
  idem TEXT;
  existing UUID;
  new_row public.partner_booking_requests%ROWTYPE;
  v_email TEXT;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO mem FROM public.partner_members
  WHERE user_id = uid AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_partner');
  END IF;

  IF p_tour_id IS NULL OR p_tour_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tour_and_date_required');
  END IF;
  IF p_tour_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'date_in_past');
  END IF;

  p_adults := COALESCE(p_adults, 0);
  p_children := COALESCE(p_children, 0);
  pax := p_adults + p_children;
  IF pax < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'passengers_required');
  END IF;

  v_email := lower(trim(coalesce(p_guest_email, '')));
  IF length(trim(coalesce(p_guest_name, ''))) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'guest_name_required');
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'guest_email_invalid');
  END IF;

  idem := nullif(trim(coalesce(p_idempotency_key, '')), '');
  IF idem IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'idempotency_required');
  END IF;

  SELECT id INTO existing
  FROM public.partner_booking_requests
  WHERE partner_company_id = mem.partner_company_id
    AND idempotency_key = idem
  LIMIT 1;
  IF existing IS NOT NULL THEN
    SELECT * INTO new_row FROM public.partner_booking_requests WHERE id = existing;
    RETURN jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'request', to_jsonb(new_row)
    );
  END IF;

  SELECT * INTO t FROM public.tours WHERE id = p_tour_id AND COALESCE(is_active, FALSE) = TRUE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tour_not_found');
  END IF;

  SELECT * INTO pr
  FROM public.partner_tour_prices p
  WHERE p.partner_company_id = mem.partner_company_id
    AND p.tour_id = p_tour_id
    AND public._partner_rate_is_effective(p.is_active, p.effective_from, p.effective_to, CURRENT_DATE)
  ORDER BY p.updated_at DESC
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_partner_rate');
  END IF;

  unit_net := public._partner_resolve_net_price(
    t.adult_price, pr.pricing_type, pr.fixed_net_eur, pr.percent_off
  );
  IF unit_net IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_partner_rate');
  END IF;

  IF COALESCE(t.pricing_model, 'per_person') = 'per_vehicle' THEN
    IF pax > COALESCE(t.max_capacity, 8) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'exceeds_vehicle_capacity', 'max', t.max_capacity);
    END IF;
    seats_needed := 1;
    total_net := unit_net;
  ELSE
    seats_needed := pax;
    total_net := ROUND(unit_net * pax, 2);
  END IF;

  -- Soft capacity check (approval revalidates under lock)
  SELECT * INTO td FROM public.tour_dates
  WHERE tour_id = p_tour_id AND date = p_tour_date;
  IF FOUND THEN
    remaining := td.available_slots - COALESCE(td.total_booked, 0);
    IF remaining < seats_needed THEN
      RETURN jsonb_build_object('ok', false, 'error', 'insufficient_capacity', 'remaining', remaining);
    END IF;
  END IF;

  INSERT INTO public.partner_booking_requests (
    reference, partner_company_id, tour_id, tour_date, tour_date_id,
    adults, children, passenger_count,
    guest_name, guest_email, guest_phone, pickup_location, special_requests,
    partner_price_id, unit_net_eur, total_net_eur, pricing_type, pricing_snapshot,
    status, idempotency_key, submitted_by
  ) VALUES (
    public._partner_next_request_reference(),
    mem.partner_company_id,
    p_tour_id,
    p_tour_date,
    td.id,
    p_adults,
    p_children,
    pax,
    trim(p_guest_name),
    v_email,
    nullif(trim(coalesce(p_guest_phone, '')), ''),
    nullif(trim(coalesce(p_pickup_location, '')), ''),
    nullif(trim(coalesce(p_special_requests, '')), ''),
    pr.id,
    unit_net,
    total_net,
    pr.pricing_type,
    jsonb_build_object(
      'partner_price_id', pr.id,
      'pricing_type', pr.pricing_type,
      'fixed_net_eur', pr.fixed_net_eur,
      'percent_off', pr.percent_off,
      'unit_net_eur', unit_net,
      'total_net_eur', total_net,
      'pricing_model', COALESCE(t.pricing_model, 'per_person'),
      'tour_title', COALESCE(NULLIF(t.public_name, ''), t.name),
      'snapshotted_at', NOW()
    ),
    'pending',
    idem,
    uid
  )
  RETURNING * INTO new_row;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'request', to_jsonb(new_row));
EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO new_row
    FROM public.partner_booking_requests
    WHERE partner_company_id = mem.partner_company_id
      AND idempotency_key = idem
    LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'request', to_jsonb(new_row));
    END IF;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_partner_booking_request(
  INTEGER, DATE, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_partner_booking_request(
  INTEGER, DATE, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_my_partner_booking_requests()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  mem public.partner_members%ROWTYPE;
  result JSONB;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  SELECT * INTO mem FROM public.partner_members
  WHERE user_id = uid AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_partner');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(x)::jsonb ORDER BY x.created_at DESC), '[]'::jsonb)
  INTO result
  FROM (
    SELECT
      r.id,
      r.reference,
      r.tour_id,
      COALESCE(NULLIF(t.public_name, ''), t.name) AS tour_title,
      r.tour_date,
      r.adults,
      r.children,
      r.passenger_count,
      r.unit_net_eur,
      r.total_net_eur,
      r.currency,
      r.status,
      r.booking_id,
      r.guest_name,
      r.created_at,
      r.reviewed_at
    FROM public.partner_booking_requests r
    JOIN public.tours t ON t.id = r.tour_id
    WHERE r.partner_company_id = mem.partner_company_id
  ) x;

  RETURN jsonb_build_object('ok', true, 'company_id', mem.partner_company_id, 'requests', result);
END;
$$;

REVOKE ALL ON FUNCTION public.list_my_partner_booking_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_partner_booking_requests() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_partner_booking_request(
  p_request_id UUID,
  p_action TEXT,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  req public.partner_booking_requests%ROWTYPE;
  t public.tours%ROWTYPE;
  td public.tour_dates%ROWTYPE;
  seats_needed INTEGER;
  remaining INTEGER;
  new_booking_id BIGINT;
  new_booking_ref TEXT;
  note TEXT := nullif(trim(coalesce(p_admin_note, '')), '');
BEGIN
  IF uid IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  IF p_action NOT IN ('approve', 'decline') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_action');
  END IF;

  SELECT * INTO req
  FROM public.partner_booking_requests
  WHERE id = p_request_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'request_not_found');
  END IF;

  IF req.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_pending', 'status', req.status);
  END IF;

  IF p_action = 'decline' THEN
    UPDATE public.partner_booking_requests
    SET
      status = 'declined',
      admin_note = note,
      decline_reason = note,
      reviewed_by = uid,
      reviewed_at = NOW(),
      updated_at = NOW()
    WHERE id = req.id
    RETURNING * INTO req;
    RETURN jsonb_build_object('ok', true, 'status', 'declined', 'request', to_jsonb(req));
  END IF;

  -- APPROVE
  SELECT * INTO t FROM public.tours WHERE id = req.tour_id;
  IF NOT FOUND OR COALESCE(t.is_active, FALSE) = FALSE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tour_unavailable');
  END IF;

  td := public._partner_ensure_tour_date(req.tour_id, req.tour_date);

  IF COALESCE(t.pricing_model, 'per_person') = 'per_vehicle' THEN
    seats_needed := 1;
  ELSE
    seats_needed := req.passenger_count;
  END IF;

  remaining := td.available_slots - COALESCE(td.total_booked, 0);
  IF remaining < seats_needed THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'insufficient_capacity',
      'remaining', remaining,
      'needed', seats_needed,
      'status', 'pending'
    );
  END IF;

  INSERT INTO public.bookings (
    tour_id, tour_date_id,
    customer_name, customer_email, customer_phone,
    adults, children, total_price,
    status, payment_status, payment_type, source,
    pickup_location, special_requests, internal_notes
  ) VALUES (
    req.tour_id,
    td.id,
    req.guest_name,
    req.guest_email,
    req.guest_phone,
    req.adults,
    req.children,
    req.total_net_eur,
    'confirmed',
    'unpaid',
    'partner_net',
    'manual',
    req.pickup_location,
    req.special_requests,
    'Partner request ' || req.reference ||
      COALESCE(' · company ' || req.partner_company_id::text, '') ||
      CASE WHEN note IS NOT NULL THEN ' · ' || note ELSE '' END
  )
  RETURNING id INTO new_booking_id;

  new_booking_ref := 'RN-' || new_booking_id::text;
  UPDATE public.bookings b
  SET booking_ref = new_booking_ref
  WHERE b.id = new_booking_id AND b.booking_ref IS NULL;

  UPDATE public.partner_booking_requests
  SET
    status = 'confirmed',
    booking_id = new_booking_id,
    tour_date_id = td.id,
    admin_note = note,
    reviewed_by = uid,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = req.id
  RETURNING * INTO req;

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'confirmed',
    'booking_id', new_booking_id,
    'booking_ref', new_booking_ref,
    'request', to_jsonb(req)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_partner_booking_request(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_review_partner_booking_request(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON TABLE public.partner_booking_requests IS
  'B2B.6 partner booking requests. Net totals are immutable snapshots; approval reserves capacity once.';
