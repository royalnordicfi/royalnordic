-- Phase 3.2: Credit redemption at checkout (foundation).
-- Public activation requires REWARDS_CREDIT_REDEMPTION_ENABLED (+ Vite flag). Default OFF in app/edge.

ALTER TABLE public.referral_credit_redemptions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS restored_cents INTEGER NOT NULL DEFAULT 0 CHECK (restored_cents >= 0),
  ADD COLUMN IF NOT EXISTS cash_charge_cents INTEGER,
  ADD COLUMN IF NOT EXISTS payable_cents INTEGER,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS referral_credit_redemptions_reserved_expires_idx
  ON public.referral_credit_redemptions (expires_at)
  WHERE status = 'reserved';

CREATE INDEX IF NOT EXISTS referral_credit_redemptions_session_idx
  ON public.referral_credit_redemptions (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS referral_credit_redemptions_booking_idx
  ON public.referral_credit_redemptions (booking_id)
  WHERE booking_id IS NOT NULL;

-- Service-role / edge: reserve credit for a known user with payable cap.
CREATE OR REPLACE FUNCTION public.reserve_referral_credit_for_checkout(
  p_user_id UUID,
  p_amount_cents INTEGER,
  p_payable_cents INTEGER,
  p_idempotency_key TEXT,
  p_booking_id BIGINT DEFAULT NULL,
  p_ttl_minutes INTEGER DEFAULT 120
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bal public.referral_credit_balances%ROWTYPE;
  red_id UUID;
  existing public.referral_credit_redemptions%ROWTYPE;
  idem TEXT := trim(coalesce(p_idempotency_key, ''));
  amount INTEGER;
  ttl INTEGER := greatest(coalesce(p_ttl_minutes, 120), 5);
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_user');
  END IF;
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;
  IF p_payable_cents IS NULL OR p_payable_cents < 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_payable');
  END IF;
  IF length(idem) < 8 OR length(idem) > 160 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_idempotency_key');
  END IF;

  amount := least(p_amount_cents, p_payable_cents);
  IF amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'credit_exceeds_payable');
  END IF;

  SELECT * INTO existing FROM public.referral_credit_redemptions WHERE idempotency_key = idem;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'id', existing.id,
      'status', existing.status,
      'amount_cents', existing.amount_cents,
      'duplicate', true
    );
  END IF;

  PERFORM public.ensure_referral_credit_balance(p_user_id);
  SELECT * INTO bal FROM public.referral_credit_balances WHERE user_id = p_user_id FOR UPDATE;

  IF bal.available_cents < amount THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credit',
      'available_cents', bal.available_cents,
      'requested_cents', amount
    );
  END IF;

  INSERT INTO public.referral_credit_redemptions (
    user_id, amount_cents, status, booking_id, idempotency_key,
    payable_cents, expires_at, note
  ) VALUES (
    p_user_id, amount, 'reserved', p_booking_id, idem,
    p_payable_cents, NOW() + make_interval(mins => ttl),
    'checkout_reservation'
  )
  RETURNING id INTO red_id;

  INSERT INTO public.referral_credit_ledger (
    user_id, redemption_id, entry_type, amount_cents, pending_delta, available_delta,
    idempotency_key, metadata
  ) VALUES (
    p_user_id, red_id, 'redeem_reserve', -amount, 0, -amount,
    'redeem_reserve:' || idem,
    jsonb_build_object('payable_cents', p_payable_cents, 'booking_id', p_booking_id)
  );

  PERFORM public.apply_referral_credit_balance_delta(p_user_id, 0, -amount, 0, 0);

  RETURN jsonb_build_object(
    'ok', true,
    'id', red_id,
    'status', 'reserved',
    'amount_cents', amount,
    'expires_at', NOW() + make_interval(mins => ttl)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_referral_credit_checkout_session(
  p_redemption_id UUID,
  p_stripe_checkout_session_id TEXT,
  p_cash_charge_cents INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  red public.referral_credit_redemptions%ROWTYPE;
BEGIN
  SELECT * INTO red FROM public.referral_credit_redemptions WHERE id = p_redemption_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF red.status <> 'reserved' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_reserved', 'status', red.status);
  END IF;

  UPDATE public.referral_credit_redemptions
  SET stripe_checkout_session_id = p_stripe_checkout_session_id,
      cash_charge_cents = p_cash_charge_cents,
      updated_at = NOW()
  WHERE id = red.id;

  RETURN jsonb_build_object('ok', true, 'id', red.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_expired_referral_credit_reservations(
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  released INT := 0;
  idem TEXT;
BEGIN
  FOR r IN
    SELECT *
    FROM public.referral_credit_redemptions
    WHERE status = 'reserved'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
    ORDER BY expires_at ASC
    LIMIT greatest(p_limit, 1)
    FOR UPDATE SKIP LOCKED
  LOOP
    idem := 'redeem_release_expired:' || r.id::text;
    IF EXISTS (SELECT 1 FROM public.referral_credit_ledger WHERE idempotency_key = idem) THEN
      UPDATE public.referral_credit_redemptions
      SET status = 'released', released_at = coalesce(released_at, NOW()), updated_at = NOW()
      WHERE id = r.id AND status = 'reserved';
      CONTINUE;
    END IF;

    INSERT INTO public.referral_credit_ledger (
      user_id, redemption_id, entry_type, amount_cents, pending_delta, available_delta,
      idempotency_key, metadata
    ) VALUES (
      r.user_id, r.id, 'redeem_release', r.amount_cents, 0, r.amount_cents,
      idem, jsonb_build_object('reason', 'expired')
    );

    PERFORM public.apply_referral_credit_balance_delta(r.user_id, 0, r.amount_cents, 0, 0);

    UPDATE public.referral_credit_redemptions
    SET status = 'released', released_at = NOW(), updated_at = NOW()
    WHERE id = r.id;

    released := released + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'released', released);
END;
$$;

-- Apply reserved credit after paid checkout (by session or redemption id).
CREATE OR REPLACE FUNCTION public.apply_referral_credit_for_checkout(
  p_redemption_id UUID DEFAULT NULL,
  p_stripe_checkout_session_id TEXT DEFAULT NULL,
  p_booking_id BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  red public.referral_credit_redemptions%ROWTYPE;
  idem TEXT;
BEGIN
  IF p_redemption_id IS NOT NULL THEN
    SELECT * INTO red FROM public.referral_credit_redemptions WHERE id = p_redemption_id FOR UPDATE;
  ELSIF p_stripe_checkout_session_id IS NOT NULL THEN
    SELECT * INTO red
    FROM public.referral_credit_redemptions
    WHERE stripe_checkout_session_id = p_stripe_checkout_session_id
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'missing_lookup');
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF red.status = 'applied' THEN
    RETURN jsonb_build_object('ok', true, 'id', red.id, 'status', 'applied', 'duplicate', true);
  END IF;
  IF red.status <> 'reserved' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_applicable', 'status', red.status);
  END IF;

  idem := 'redeem_apply:' || red.id::text;
  IF EXISTS (SELECT 1 FROM public.referral_credit_ledger WHERE idempotency_key = idem) THEN
    UPDATE public.referral_credit_redemptions
    SET status = 'applied',
        applied_at = coalesce(applied_at, NOW()),
        booking_id = coalesce(p_booking_id, booking_id),
        updated_at = NOW()
    WHERE id = red.id;
    RETURN jsonb_build_object('ok', true, 'id', red.id, 'duplicate', true);
  END IF;

  INSERT INTO public.referral_credit_ledger (
    user_id, redemption_id, entry_type, amount_cents, pending_delta, available_delta,
    idempotency_key, metadata
  ) VALUES (
    red.user_id, red.id, 'redeem_apply', -red.amount_cents, 0, 0,
    idem, jsonb_build_object('booking_id', coalesce(p_booking_id, red.booking_id))
  );

  PERFORM public.apply_referral_credit_balance_delta(red.user_id, 0, 0, 0, red.amount_cents);

  UPDATE public.referral_credit_redemptions
  SET status = 'applied',
      applied_at = NOW(),
      booking_id = coalesce(p_booking_id, booking_id),
      updated_at = NOW()
  WHERE id = red.id;

  INSERT INTO public.referral_activity (referrer_user_id, event_type, amount_cents, metadata)
  VALUES (
    red.user_id,
    'credit_redeemed',
    red.amount_cents,
    jsonb_build_object(
      'redemption_id', red.id,
      'booking_id', coalesce(p_booking_id, red.booking_id),
      'session_id', red.stripe_checkout_session_id
    )
  );

  RETURN jsonb_build_object('ok', true, 'id', red.id, 'status', 'applied', 'amount_cents', red.amount_cents);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_referral_credit_for_checkout(
  p_redemption_id UUID DEFAULT NULL,
  p_stripe_checkout_session_id TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT 'released'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  red public.referral_credit_redemptions%ROWTYPE;
  idem TEXT;
BEGIN
  IF p_redemption_id IS NOT NULL THEN
    SELECT * INTO red FROM public.referral_credit_redemptions WHERE id = p_redemption_id FOR UPDATE;
  ELSIF p_stripe_checkout_session_id IS NOT NULL THEN
    SELECT * INTO red
    FROM public.referral_credit_redemptions
    WHERE stripe_checkout_session_id = p_stripe_checkout_session_id
      AND status = 'reserved'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'missing_lookup');
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'not_found');
  END IF;
  IF red.status IN ('released', 'void') THEN
    RETURN jsonb_build_object('ok', true, 'id', red.id, 'status', red.status, 'duplicate', true);
  END IF;
  IF red.status <> 'reserved' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_reservable', 'status', red.status);
  END IF;

  idem := 'redeem_release:' || red.id::text || ':' || coalesce(p_reason, 'released');
  IF EXISTS (SELECT 1 FROM public.referral_credit_ledger WHERE idempotency_key = idem) THEN
    RETURN jsonb_build_object('ok', true, 'id', red.id, 'duplicate', true);
  END IF;

  INSERT INTO public.referral_credit_ledger (
    user_id, redemption_id, entry_type, amount_cents, pending_delta, available_delta,
    idempotency_key, metadata
  ) VALUES (
    red.user_id, red.id, 'redeem_release', red.amount_cents, 0, red.amount_cents,
    idem, jsonb_build_object('reason', p_reason)
  );

  PERFORM public.apply_referral_credit_balance_delta(red.user_id, 0, red.amount_cents, 0, 0);

  UPDATE public.referral_credit_redemptions
  SET status = 'released', released_at = NOW(), updated_at = NOW()
  WHERE id = red.id;

  RETURN jsonb_build_object('ok', true, 'id', red.id, 'status', 'released');
END;
$$;

-- Restore applied credit after refund/cancel. Proportional to cash refunded when cash > 0.
CREATE OR REPLACE FUNCTION public.restore_referral_credit_after_refund(
  p_booking_id BIGINT,
  p_stripe_checkout_session_id TEXT DEFAULT NULL,
  p_original_cash_cents INTEGER DEFAULT NULL,
  p_amount_refunded_cents INTEGER DEFAULT NULL,
  p_full_restore BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  red public.referral_credit_redemptions%ROWTYPE;
  restore_amt INTEGER;
  cash INTEGER;
  refunded INTEGER;
  idem TEXT;
BEGIN
  IF p_booking_id IS NOT NULL THEN
    SELECT * INTO red
    FROM public.referral_credit_redemptions
    WHERE booking_id = p_booking_id AND status = 'applied'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF NOT FOUND AND p_stripe_checkout_session_id IS NOT NULL THEN
    SELECT * INTO red
    FROM public.referral_credit_redemptions
    WHERE stripe_checkout_session_id = p_stripe_checkout_session_id AND status = 'applied'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'no_applied_credit');
  END IF;

  cash := coalesce(p_original_cash_cents, red.cash_charge_cents, 0);
  refunded := greatest(coalesce(p_amount_refunded_cents, 0), 0);

  IF p_full_restore OR cash <= 0 OR refunded >= cash THEN
    restore_amt := red.amount_cents - red.restored_cents;
  ELSE
    restore_amt := (red.amount_cents * refunded) / cash - red.restored_cents;
  END IF;

  restore_amt := greatest(least(restore_amt, red.amount_cents - red.restored_cents), 0);
  IF restore_amt <= 0 THEN
    RETURN jsonb_build_object('ok', true, 'id', red.id, 'unchanged', true, 'restored_cents', red.restored_cents);
  END IF;

  idem := 'credit_restore:' || red.id::text || ':' || (red.restored_cents + restore_amt)::text;
  IF EXISTS (SELECT 1 FROM public.referral_credit_ledger WHERE idempotency_key = idem) THEN
    RETURN jsonb_build_object('ok', true, 'id', red.id, 'duplicate', true);
  END IF;

  INSERT INTO public.referral_credit_ledger (
    user_id, redemption_id, entry_type, amount_cents, pending_delta, available_delta,
    idempotency_key, metadata
  ) VALUES (
    red.user_id, red.id, 'redeem_release', restore_amt, 0, restore_amt,
    idem,
    jsonb_build_object(
      'reason', 'refund_restore',
      'restore_cents', restore_amt,
      'booking_id', red.booking_id
    )
  );

  PERFORM public.apply_referral_credit_balance_delta(red.user_id, 0, restore_amt, 0, 0);

  -- lifetime_redeemed should shrink when credit is restored
  UPDATE public.referral_credit_balances
  SET lifetime_redeemed_cents = greatest(lifetime_redeemed_cents - restore_amt, 0),
      updated_at = NOW()
  WHERE user_id = red.user_id;

  UPDATE public.referral_credit_redemptions
  SET restored_cents = restored_cents + restore_amt,
      updated_at = NOW()
  WHERE id = red.id;

  RETURN jsonb_build_object(
    'ok', true,
    'id', red.id,
    'restored_cents', restore_amt,
    'total_restored_cents', red.restored_cents + restore_amt
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_referral_credit_for_checkout(UUID, INTEGER, INTEGER, TEXT, BIGINT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attach_referral_credit_checkout_session(UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_expired_referral_credit_reservations(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_referral_credit_for_checkout(UUID, TEXT, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_referral_credit_for_checkout(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_referral_credit_after_refund(BIGINT, TEXT, INTEGER, INTEGER, BOOLEAN) FROM PUBLIC;

-- Edge/service invokes these; authenticated members keep the original reserve/release/apply helpers.

-- Atomic 100% credit booking confirmation (no Stripe). Capacity checks included.
CREATE OR REPLACE FUNCTION public.confirm_fully_credit_funded_booking(
  p_user_id UUID,
  p_redemption_id UUID,
  p_tour_id BIGINT,
  p_tour_date_id BIGINT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_adults INTEGER,
  p_children INTEGER,
  p_total_price_cents INTEGER,
  p_special_requests TEXT DEFAULT NULL,
  p_tour_time TEXT DEFAULT NULL,
  p_pickup_location TEXT DEFAULT NULL,
  p_referral_code TEXT DEFAULT NULL,
  p_referrer_user_id UUID DEFAULT NULL,
  p_referral_discount_cents INTEGER DEFAULT 0,
  p_guest_subtotal_cents INTEGER DEFAULT NULL,
  p_cash_paid_cents INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  red public.referral_credit_redemptions%ROWTYPE;
  date_row RECORD;
  remaining INTEGER;
  booking_id BIGINT;
  apply_result JSONB;
  credit_attr JSONB;
  requested INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_redemption_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_ids');
  END IF;
  IF coalesce(p_cash_paid_cents, 0) <> 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expected_zero_cash');
  END IF;

  SELECT * INTO red FROM public.referral_credit_redemptions WHERE id = p_redemption_id FOR UPDATE;
  IF NOT FOUND OR red.user_id IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'redemption_not_found');
  END IF;
  IF red.status = 'applied' AND red.booking_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'booking_id', red.booking_id, 'duplicate', true);
  END IF;
  IF red.status <> 'reserved' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'redemption_not_reserved', 'status', red.status);
  END IF;
  IF red.amount_cents < p_total_price_cents THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_reserved_credit');
  END IF;

  SELECT td.id, td.tour_id, td.available_slots, td.total_booked, t.max_capacity, t.pricing_model, t.is_active
    INTO date_row
  FROM public.tour_dates td
  JOIN public.tours t ON t.id = td.tour_id
  WHERE td.id = p_tour_date_id
  FOR UPDATE OF td;

  IF NOT FOUND OR date_row.tour_id <> p_tour_id OR date_row.is_active IS FALSE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'date_unavailable');
  END IF;

  remaining := date_row.available_slots - coalesce(date_row.total_booked, 0);
  requested := CASE
    WHEN coalesce(date_row.pricing_model, 'per_person') = 'per_vehicle' THEN 1
    ELSE greatest(coalesce(p_adults, 0), 0) + greatest(coalesce(p_children, 0), 0)
  END;
  IF requested < 1 OR requested > remaining THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_enough_capacity', 'remaining', remaining);
  END IF;

  INSERT INTO public.bookings (
    tour_id, tour_date_id, customer_name, customer_email, customer_phone,
    adults, children, total_price, status, payment_status, payment_type,
    special_requests, source, email_status, tour_time, pickup_location,
    referral_code, referrer_user_id, referral_discount_cents
  ) VALUES (
    p_tour_id, p_tour_date_id, p_customer_name, p_customer_email, coalesce(p_customer_phone, ''),
    coalesce(p_adults, 0), coalesce(p_children, 0),
    round(p_total_price_cents / 100.0, 2),
    'confirmed', 'paid', 'credit',
    p_special_requests, 'direct_website', 'queued', p_tour_time, p_pickup_location,
    nullif(upper(trim(coalesce(p_referral_code, ''))), ''),
    p_referrer_user_id,
    greatest(coalesce(p_referral_discount_cents, 0), 0)
  )
  RETURNING id INTO booking_id;

  apply_result := public.apply_referral_credit_for_checkout(p_redemption_id, NULL, booking_id);
  IF coalesce((apply_result->>'ok')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'credit_apply_failed:%', apply_result;
  END IF;

  -- Cash paid is 0 → no referral credit earning from this booking's cash basis.
  IF p_referrer_user_id IS NOT NULL AND nullif(upper(trim(coalesce(p_referral_code, ''))), '') IS NOT NULL THEN
    credit_attr := public.confirm_referral_attribution(
      booking_id,
      'credit_only:' || p_redemption_id::text,
      NULL,
      upper(trim(p_referral_code)),
      p_referrer_user_id,
      p_tour_id,
      coalesce(p_guest_subtotal_cents, p_total_price_cents + greatest(coalesce(p_referral_discount_cents, 0), 0)),
      greatest(coalesce(p_referral_discount_cents, 0), 0),
      0, -- charged/cash cents = 0 → create_referral_credit skips zero
      p_customer_email
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'booking_id', booking_id,
    'booking_ref', 'RN-' || booking_id::text,
    'credit', apply_result,
    'attribution', credit_attr
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_fully_credit_funded_booking(
  UUID, UUID, BIGINT, BIGINT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER
) FROM PUBLIC;
