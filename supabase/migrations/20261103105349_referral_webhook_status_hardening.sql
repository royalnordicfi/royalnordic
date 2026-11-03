-- Harden referral status updates for LIVE Stripe webhooks (refund / dispute / expire).
-- Idempotent: repeating the same status does not insert duplicate activity rows.
-- Lookup by payment intent, booking id, or checkout session id.

CREATE OR REPLACE FUNCTION public.mark_referral_attribution_status(
  p_stripe_payment_intent_id TEXT,
  p_booking_id BIGINT,
  p_status TEXT,
  p_stripe_checkout_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_id UUID;
  referrer UUID;
  prev_status TEXT;
  booking_ref_id BIGINT;
BEGIN
  IF p_status NOT IN ('cancelled', 'refunded', 'void') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_status');
  END IF;

  IF p_booking_id IS NULL
     AND (p_stripe_payment_intent_id IS NULL OR length(trim(p_stripe_payment_intent_id)) = 0)
     AND (p_stripe_checkout_session_id IS NULL OR length(trim(p_stripe_checkout_session_id)) = 0)
  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_lookup');
  END IF;

  SELECT id, referrer_user_id, status, booking_id
    INTO row_id, referrer, prev_status, booking_ref_id
  FROM public.referral_attributions
  WHERE (p_booking_id IS NOT NULL AND booking_id = p_booking_id)
     OR (
       p_stripe_payment_intent_id IS NOT NULL
       AND length(trim(p_stripe_payment_intent_id)) > 0
       AND stripe_payment_intent_id = p_stripe_payment_intent_id
     )
     OR (
       p_stripe_checkout_session_id IS NOT NULL
       AND length(trim(p_stripe_checkout_session_id)) > 0
       AND stripe_checkout_session_id = p_stripe_checkout_session_id
     )
  ORDER BY created_at DESC
  LIMIT 1;

  IF row_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF prev_status = p_status THEN
    RETURN jsonb_build_object('ok', true, 'id', row_id, 'status', p_status, 'duplicate', true);
  END IF;

  UPDATE public.referral_attributions
  SET status = p_status, updated_at = NOW()
  WHERE id = row_id;

  INSERT INTO public.referral_activity (referrer_user_id, event_type, metadata)
  VALUES (
    referrer,
    'booking_attributed',
    jsonb_build_object(
      'booking_ref',
      CASE
        WHEN coalesce(p_booking_id, booking_ref_id) IS NOT NULL
          THEN 'RN-' || coalesce(p_booking_id, booking_ref_id)::text
        ELSE NULL
      END,
      'status', p_status
    )
  );

  RETURN jsonb_build_object('ok', true, 'id', row_id, 'status', p_status);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_referral_attribution_status(TEXT, BIGINT, TEXT, TEXT) FROM PUBLIC;
-- Drop prior 3-arg overload if present so callers use the hardened signature.
DROP FUNCTION IF EXISTS public.mark_referral_attribution_status(TEXT, BIGINT, TEXT);
