-- Royal Nordic Rewards Phase 2 — booking attribution foundation.
-- Guest discounts are gated by app/edge REWARDS_DISCOUNTS_ENABLED (default off).
-- Additive only: does not alter payment math in existing rows.

-- ---------- ELIGIBILITY (configurable) ----------
CREATE TABLE IF NOT EXISTS public.referral_eligible_tours (
  tour_id BIGINT PRIMARY KEY REFERENCES public.tours (id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.referral_eligible_tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_eligible_tours_public_read ON public.referral_eligible_tours;
CREATE POLICY referral_eligible_tours_public_read
  ON public.referral_eligible_tours FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

GRANT SELECT ON public.referral_eligible_tours TO anon, authenticated;

-- Initial NL eligibility (excludes catalogue-sale Guaranteed NL #1, private NL #11, transfers)
INSERT INTO public.referral_eligible_tours (tour_id, enabled, notes)
VALUES
  (8, true, 'Family-Friendly Northern Lights'),
  (10, true, 'Northern Lights Standard Group')
ON CONFLICT (tour_id) DO NOTHING;

-- ---------- ATTRIBUTION LEDGER ----------
CREATE TABLE IF NOT EXISTS public.referral_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES public.referral_profiles (id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  booking_id BIGINT UNIQUE REFERENCES public.bookings (id) ON DELETE SET NULL,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  tour_id BIGINT,
  guest_subtotal_cents INTEGER NOT NULL CHECK (guest_subtotal_cents >= 0),
  discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  charged_cents INTEGER NOT NULL CHECK (charged_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded', 'void')),
  guest_email_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_attributions_referrer_status_idx
  ON public.referral_attributions (referrer_user_id, status, created_at DESC);

ALTER TABLE public.referral_attributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_attributions_select_own ON public.referral_attributions;
CREATE POLICY referral_attributions_select_own
  ON public.referral_attributions FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid());

-- No client writes — service role / SECURITY DEFINER only
GRANT SELECT ON public.referral_attributions TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    EXECUTE $p$
      DROP POLICY IF EXISTS referral_attributions_admin_all ON public.referral_attributions;
      CREATE POLICY referral_attributions_admin_all
        ON public.referral_attributions FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
      DROP POLICY IF EXISTS referral_eligible_tours_admin_all ON public.referral_eligible_tours;
      CREATE POLICY referral_eligible_tours_admin_all
        ON public.referral_eligible_tours FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    $p$;
  END IF;
END $$;

-- ---------- BOOKING AUDIT COLUMNS ----------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referrer_user_id UUID REFERENCES public.referral_profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_discount_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_attribution_id UUID;

CREATE INDEX IF NOT EXISTS bookings_referrer_user_id_idx
  ON public.bookings (referrer_user_id)
  WHERE referrer_user_id IS NOT NULL;

-- Block claiming promotional codes as referral codes
CREATE OR REPLACE FUNCTION public.is_reserved_referral_code(normalized TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  blocked TEXT[] := ARRAY[
    'ADMIN', 'ADMINS', 'ROYAL', 'ROYALNORDIC', 'NORDIC', 'RN', 'STAFF', 'SUPPORT',
    'HELP', 'ROOT', 'SYSTEM', 'NULL', 'UNDEFINED', 'TEST', 'TESTING', 'DEMO',
    'FREE', 'DISCOUNT', 'OFFICIAL', 'PARTNER', 'AGENCY', 'TRAVELTRADE',
    'WINTER20', 'WINTER', 'PROMO', 'SALE',
    'FUCK', 'SHIT', 'CUNT', 'NIGGER', 'NIGGA', 'FAGGOT', 'HITLER', 'NAZI',
    'PORN', 'SEX', 'XXX', 'SLUT', 'WHORE', 'BITCH', 'ASSHOLE', 'DICK', 'PISS',
    'COCK', 'CUM', 'RAPE', 'KILL', 'SUICIDE'
  ];
BEGIN
  IF normalized IS NULL OR length(normalized) < 4 THEN
    RETURN TRUE;
  END IF;
  IF normalized = ANY (blocked) THEN
    RETURN TRUE;
  END IF;
  IF normalized LIKE 'RN%' OR normalized LIKE 'ADMIN%' OR normalized LIKE 'ROYAL%' THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- Public resolve for checkout (no PII of referrer)
CREATE OR REPLACE FUNCTION public.resolve_referral_code_for_checkout(
  p_code TEXT,
  p_tour_id BIGINT,
  p_customer_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized TEXT;
  code_row RECORD;
  eligible BOOLEAN := false;
  email_norm TEXT;
BEGIN
  normalized := public.normalize_referral_code(p_code);
  IF length(normalized) < 4 OR length(normalized) > 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_format');
  END IF;

  SELECT c.id, c.code, c.user_id, c.status
  INTO code_row
  FROM public.referral_codes c
  WHERE lower(c.code) = lower(normalized) AND c.status = 'active'
  LIMIT 1;

  IF code_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found', 'normalized', normalized);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.referral_eligible_tours e
    WHERE e.tour_id = p_tour_id AND e.enabled = true
  ) INTO eligible;

  email_norm := lower(trim(coalesce(p_customer_email, '')));
  IF email_norm <> '' THEN
    IF EXISTS (
      SELECT 1 FROM public.referral_profiles p
      WHERE p.id = code_row.user_id AND lower(p.email) = email_norm
    ) THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'self_referral',
        'normalized', normalized,
        'eligible', eligible
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'normalized', code_row.code,
    'referrer_user_id', code_row.user_id,
    'eligible', eligible,
    'discount_percent', 10
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_referral_code_for_checkout(TEXT, BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_referral_code_for_checkout(TEXT, BIGINT, TEXT) TO anon, authenticated;

-- Confirm attribution after paid booking (service role / webhook)
CREATE OR REPLACE FUNCTION public.confirm_referral_attribution(
  p_booking_id BIGINT,
  p_stripe_checkout_session_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_referral_code TEXT,
  p_referrer_user_id UUID,
  p_tour_id BIGINT,
  p_guest_subtotal_cents INTEGER,
  p_discount_cents INTEGER,
  p_charged_cents INTEGER,
  p_guest_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id UUID;
  new_id UUID;
  email_hash TEXT;
  email_norm TEXT := lower(trim(coalesce(p_guest_email, '')));
BEGIN
  IF p_booking_id IS NULL OR p_referrer_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_ids');
  END IF;

  -- Idempotent on booking or checkout session
  SELECT id INTO existing_id
  FROM public.referral_attributions
  WHERE booking_id = p_booking_id
     OR (p_stripe_checkout_session_id IS NOT NULL AND stripe_checkout_session_id = p_stripe_checkout_session_id)
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE public.referral_attributions
    SET status = 'confirmed',
        booking_id = coalesce(booking_id, p_booking_id),
        stripe_payment_intent_id = coalesce(stripe_payment_intent_id, p_stripe_payment_intent_id),
        updated_at = NOW()
    WHERE id = existing_id;
    RETURN jsonb_build_object('ok', true, 'id', existing_id, 'duplicate', true);
  END IF;

  -- One confirmed attribution per booking
  IF EXISTS (
    SELECT 1 FROM public.referral_attributions
    WHERE booking_id = p_booking_id AND status IN ('confirmed', 'pending')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate_attribution');
  END IF;

  -- Self-referral hard stop
  IF email_norm <> '' AND EXISTS (
    SELECT 1 FROM public.referral_profiles p
    WHERE p.id = p_referrer_user_id AND lower(p.email) = email_norm
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'self_referral');
  END IF;

  IF email_norm <> '' THEN
    email_hash := encode(sha256(convert_to(email_norm, 'UTF8')), 'hex');
  END IF;

  INSERT INTO public.referral_attributions (
    referrer_user_id,
    referral_code,
    booking_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    tour_id,
    guest_subtotal_cents,
    discount_cents,
    charged_cents,
    status,
    guest_email_hash
  ) VALUES (
    p_referrer_user_id,
    upper(p_referral_code),
    p_booking_id,
    p_stripe_checkout_session_id,
    p_stripe_payment_intent_id,
    p_tour_id,
    greatest(p_guest_subtotal_cents, 0),
    greatest(p_discount_cents, 0),
    greatest(p_charged_cents, 0),
    'confirmed',
    email_hash
  )
  RETURNING id INTO new_id;

  UPDATE public.bookings
  SET referral_code = upper(p_referral_code),
      referrer_user_id = p_referrer_user_id,
      referral_discount_cents = greatest(p_discount_cents, 0),
      referral_attribution_id = new_id
  WHERE id = p_booking_id;

  INSERT INTO public.referral_activity (referrer_user_id, event_type, amount_cents, metadata)
  VALUES (
    p_referrer_user_id,
    'booking_attributed',
    greatest(p_discount_cents, 0),
    jsonb_build_object(
      'booking_ref', 'RN-' || p_booking_id::text,
      'status', 'confirmed',
      'tour_id', p_tour_id,
      'code', upper(p_referral_code)
    )
  );

  RETURN jsonb_build_object('ok', true, 'id', new_id);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_referral_attribution(
  BIGINT, TEXT, TEXT, TEXT, UUID, BIGINT, INTEGER, INTEGER, INTEGER, TEXT
) FROM PUBLIC;
-- Invoked with service role from webhook only (no grant to anon)

CREATE OR REPLACE FUNCTION public.mark_referral_attribution_status(
  p_stripe_payment_intent_id TEXT,
  p_booking_id BIGINT,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_id UUID;
  referrer UUID;
BEGIN
  IF p_status NOT IN ('cancelled', 'refunded', 'void') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_status');
  END IF;

  SELECT id, referrer_user_id INTO row_id, referrer
  FROM public.referral_attributions
  WHERE (p_booking_id IS NOT NULL AND booking_id = p_booking_id)
     OR (p_stripe_payment_intent_id IS NOT NULL AND stripe_payment_intent_id = p_stripe_payment_intent_id)
  ORDER BY created_at DESC
  LIMIT 1;

  IF row_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  UPDATE public.referral_attributions
  SET status = p_status, updated_at = NOW()
  WHERE id = row_id;

  INSERT INTO public.referral_activity (referrer_user_id, event_type, metadata)
  VALUES (
    referrer,
    'booking_attributed',
    jsonb_build_object(
      'booking_ref', CASE WHEN p_booking_id IS NOT NULL THEN 'RN-' || p_booking_id::text ELSE NULL END,
      'status', p_status
    )
  );

  RETURN jsonb_build_object('ok', true, 'id', row_id, 'status', p_status);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_referral_attribution_status(TEXT, BIGINT, TEXT) FROM PUBLIC;

COMMENT ON TABLE public.referral_attributions IS 'Guest referral attribution; commissions/payouts not activated';
COMMENT ON TABLE public.referral_eligible_tours IS 'Configurable product eligibility for Rewards discounts';
