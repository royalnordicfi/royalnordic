-- B2B.7: Partner booking notification outbox (idempotent, retryable).
-- Emails are sent by process-notification-outbox edge function (Resend).

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel = 'email'),
  template_key TEXT NOT NULL CHECK (template_key IN (
    'partner_booking_submitted_admin',
    'partner_booking_confirmed_partner',
    'partner_booking_declined_partner'
  )),
  recipient_email TEXT NOT NULL,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('admin', 'partner')),
  partner_booking_request_id UUID NOT NULL
    REFERENCES public.partner_booking_requests (id) ON DELETE CASCADE,
  booking_id BIGINT REFERENCES public.bookings (id) ON DELETE SET NULL,
  partner_company_id UUID REFERENCES public.partner_companies (id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'dead')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 8 CHECK (max_attempts >= 1),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  provider_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  CONSTRAINT notification_outbox_email_format
    CHECK (recipient_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_outbox_idempotency_uidx
  ON public.notification_outbox (idempotency_key);

CREATE INDEX IF NOT EXISTS notification_outbox_claim_idx
  ON public.notification_outbox (status, next_attempt_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS notification_outbox_request_idx
  ON public.notification_outbox (partner_booking_request_id, template_key);

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_outbox_admin_select ON public.notification_outbox;
CREATE POLICY notification_outbox_admin_select
  ON public.notification_outbox FOR SELECT TO authenticated
  USING (public.is_admin());

-- No partner/anon writes; enqueue only via SECURITY DEFINER helpers.

CREATE OR REPLACE FUNCTION public._enqueue_notification_outbox(
  p_idempotency_key TEXT,
  p_template_key TEXT,
  p_recipient_email TEXT,
  p_recipient_role TEXT,
  p_request_id UUID,
  p_booking_id BIGINT,
  p_partner_company_id UUID,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(coalesce(p_recipient_email, '')));
  new_id UUID;
BEGIN
  IF nullif(trim(coalesce(p_idempotency_key, '')), '') IS NULL THEN
    RAISE EXCEPTION 'idempotency_required';
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notification_outbox (
    idempotency_key, template_key, recipient_email, recipient_role,
    partner_booking_request_id, booking_id, partner_company_id, payload
  ) VALUES (
    p_idempotency_key,
    p_template_key,
    v_email,
    p_recipient_role,
    p_request_id,
    p_booking_id,
    p_partner_company_id,
    coalesce(p_payload, '{}'::jsonb)
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public._enqueue_notification_outbox(
  TEXT, TEXT, TEXT, TEXT, UUID, BIGINT, UUID, JSONB
) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._partner_booking_notification_payload(
  p_request public.partner_booking_requests,
  p_booking_ref TEXT DEFAULT NULL,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  co public.partner_companies%ROWTYPE;
  t public.tours%ROWTYPE;
BEGIN
  SELECT * INTO co FROM public.partner_companies WHERE id = p_request.partner_company_id;
  SELECT * INTO t FROM public.tours WHERE id = p_request.tour_id;

  RETURN jsonb_build_object(
    'reference', p_request.reference,
    'request_id', p_request.id,
    'company_name', coalesce(co.name, 'Partner'),
    'company_id', p_request.partner_company_id,
    'tour_id', p_request.tour_id,
    'tour_title', coalesce(
      nullif(t.public_name, ''),
      t.name,
      (p_request.pricing_snapshot ->> 'tour_title'),
      'Tour'
    ),
    'tour_date', p_request.tour_date,
    'adults', p_request.adults,
    'children', p_request.children,
    'passenger_count', p_request.passenger_count,
    'guest_name', p_request.guest_name,
    'guest_email', p_request.guest_email,
    'guest_phone', p_request.guest_phone,
    'pickup_location', p_request.pickup_location,
    'meeting_point', CASE WHEN t.id IS NULL THEN NULL ELSE t.meeting_point END,
    'special_requests', p_request.special_requests,
    'unit_net_eur', p_request.unit_net_eur,
    'total_net_eur', p_request.total_net_eur,
    'currency', p_request.currency,
    'status', p_request.status,
    'booking_id', p_request.booking_id,
    'booking_ref', p_booking_ref,
    'admin_note', p_admin_note,
    'admin_url', 'https://admin.royalnordic.fi/partner-bookings',
    'partner_bookings_url', 'https://royalnordic.fi/partners/dashboard/bookings'
  );
END;
$$;

REVOKE ALL ON FUNCTION public._partner_booking_notification_payload(
  public.partner_booking_requests, TEXT, TEXT
) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.enqueue_partner_booking_submitted_notifications(
  p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.partner_booking_requests%ROWTYPE;
  payload JSONB;
  admin_emails TEXT[] := ARRAY['royalnordicfi@gmail.com', 'contact@royalnordic.fi'];
  em TEXT;
  queued INT := 0;
BEGIN
  SELECT * INTO req FROM public.partner_booking_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'request_not_found');
  END IF;

  payload := public._partner_booking_notification_payload(req, NULL, NULL);

  FOREACH em IN ARRAY admin_emails LOOP
    IF public._enqueue_notification_outbox(
      req.id::text || ':partner_booking_submitted_admin:' || lower(em),
      'partner_booking_submitted_admin',
      em,
      'admin',
      req.id,
      NULL,
      req.partner_company_id,
      payload
    ) IS NOT NULL THEN
      queued := queued + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'queued', queued);
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_partner_booking_decision_notifications(
  p_request_id UUID,
  p_action TEXT,
  p_booking_ref TEXT DEFAULT NULL,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.partner_booking_requests%ROWTYPE;
  co public.partner_companies%ROWTYPE;
  payload JSONB;
  template TEXT;
  queued INT := 0;
  contact TEXT;
BEGIN
  IF p_action NOT IN ('approve', 'decline') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_action');
  END IF;

  SELECT * INTO req FROM public.partner_booking_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'request_not_found');
  END IF;

  SELECT * INTO co FROM public.partner_companies WHERE id = req.partner_company_id;
  contact := lower(trim(coalesce(co.contact_email, '')));
  IF contact = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'partner_contact_missing', 'queued', 0);
  END IF;

  template := CASE
    WHEN p_action = 'approve' THEN 'partner_booking_confirmed_partner'
    ELSE 'partner_booking_declined_partner'
  END;

  payload := public._partner_booking_notification_payload(req, p_booking_ref, p_admin_note);

  IF public._enqueue_notification_outbox(
    req.id::text || ':' || template || ':' || contact,
    template,
    contact,
    'partner',
    req.id,
    req.booking_id,
    req.partner_company_id,
    payload
  ) IS NOT NULL THEN
    queued := 1;
  END IF;

  RETURN jsonb_build_object('ok', true, 'queued', queued, 'template', template);
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_partner_booking_submitted_notifications(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_partner_booking_decision_notifications(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;

-- Claim due outbox rows for the processor (service_role only).
CREATE OR REPLACE FUNCTION public.claim_notification_outbox(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.notification_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT id
    FROM public.notification_outbox
    WHERE status IN ('pending', 'failed')
      AND next_attempt_at <= NOW()
      AND attempt_count < max_attempts
    ORDER BY next_attempt_at ASC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(least(coalesce(p_limit, 20), 50), 1)
  )
  UPDATE public.notification_outbox o
  SET
    status = 'processing',
    attempt_count = o.attempt_count + 1,
    updated_at = NOW()
  FROM due
  WHERE o.id = due.id
  RETURNING o.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_notification_outbox(
  p_id UUID,
  p_ok BOOLEAN,
  p_provider_message_id TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.notification_outbox%ROWTYPE;
  backoff INTERVAL;
BEGIN
  SELECT * INTO row FROM public.notification_outbox WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF p_ok THEN
    UPDATE public.notification_outbox
    SET
      status = 'sent',
      provider_message_id = coalesce(p_provider_message_id, provider_message_id),
      last_error = NULL,
      sent_at = NOW(),
      updated_at = NOW()
    WHERE id = p_id;
    RETURN jsonb_build_object('ok', true, 'status', 'sent');
  END IF;

  IF row.attempt_count >= row.max_attempts THEN
    UPDATE public.notification_outbox
    SET
      status = 'dead',
      last_error = left(coalesce(p_error, 'unknown'), 2000),
      updated_at = NOW()
    WHERE id = p_id;
    RETURN jsonb_build_object('ok', true, 'status', 'dead');
  END IF;

  backoff := make_interval(mins => least(60, power(2, greatest(row.attempt_count - 1, 0))::int));
  UPDATE public.notification_outbox
  SET
    status = 'failed',
    last_error = left(coalesce(p_error, 'unknown'), 2000),
    next_attempt_at = NOW() + backoff,
    updated_at = NOW()
  WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'status', 'failed', 'next_attempt_at', NOW() + backoff);
END;
$$;

-- Safe admin retry: re-queue a failed/dead row without duplicating sent mail.
CREATE OR REPLACE FUNCTION public.admin_retry_notification_outbox(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  row public.notification_outbox%ROWTYPE;
BEGIN
  IF uid IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  SELECT * INTO row FROM public.notification_outbox WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF row.status = 'sent' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_sent');
  END IF;
  IF row.status = 'processing' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'processing');
  END IF;

  UPDATE public.notification_outbox
  SET
    status = 'pending',
    next_attempt_at = NOW(),
    last_error = NULL,
    -- keep attempt_count; allow up to max_attempts more from current
    max_attempts = greatest(max_attempts, attempt_count + 3),
    updated_at = NOW()
  WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'status', 'pending');
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_outbox(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_notification_outbox(UUID, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_retry_notification_outbox(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_notification_outbox(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_notification_outbox(UUID, BOOLEAN, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_retry_notification_outbox(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Patch booking RPCs to enqueue in the same transaction (no send here).
-- ---------------------------------------------------------------------------

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

  PERFORM public.enqueue_partner_booking_submitted_notifications(new_row.id);

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

    PERFORM public.enqueue_partner_booking_decision_notifications(
      req.id, 'decline', NULL, note
    );

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

  -- Only after capacity + canonical booking committed in this transaction.
  PERFORM public.enqueue_partner_booking_decision_notifications(
    req.id, 'approve', new_booking_ref, note
  );

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'confirmed',
    'booking_id', new_booking_id,
    'booking_ref', new_booking_ref,
    'request', to_jsonb(req)
  );
END;
$$;

-- Invoke edge processor via pg_net (retries / backlog). Auth: service role from vault when present.
CREATE OR REPLACE FUNCTION public.invoke_process_notification_outbox()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  project_url TEXT;
  secret_key TEXT;
  req_id BIGINT;
BEGIN
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO secret_key
  FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  IF project_url IS NULL OR secret_key IS NULL THEN
    -- Vault not configured: client/admin flush still processes the outbox.
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/process-notification-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret_key,
      'apikey', secret_key
    ),
    body := jsonb_build_object('source', 'pg_cron', 'limit', 25),
    timeout_milliseconds := 15000
  ) INTO req_id;

  RETURN req_id;
EXCEPTION
  WHEN undefined_table THEN
    RETURN NULL;
  WHEN others THEN
    RAISE WARNING 'invoke_process_notification_outbox: %', SQLERRM;
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_process_notification_outbox() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invoke_process_notification_outbox() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'process-notification-outbox';
EXCEPTION WHEN undefined_table THEN
  NULL;
WHEN others THEN
  NULL;
END $$;

SELECT cron.schedule(
  'process-notification-outbox',
  '* * * * *',
  $$SELECT public.invoke_process_notification_outbox();$$
);

COMMENT ON TABLE public.notification_outbox IS
  'B2B.7 transactional email outbox for partner booking notifications. Idempotent keys prevent duplicates.';
