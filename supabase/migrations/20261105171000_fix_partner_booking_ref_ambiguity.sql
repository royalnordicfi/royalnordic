-- Fix ambiguous booking_ref in admin_review_partner_booking_request.

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
