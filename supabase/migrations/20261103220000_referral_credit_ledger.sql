-- Phase 3.1: Royal Nordic Credit ledger foundation.
-- Guest 10% discount already live behind flags. Referrer earns 10% of net paid as booking credit.
-- Pending → available after tour completion. Redemption APIs exist but are not wired to public checkout.
-- Do not backfill certification / INTERNAL_CERT bookings.

-- ---------- EARNINGS → CREDIT REWARDS ----------
ALTER TABLE public.referral_earnings
  ADD COLUMN IF NOT EXISTS attribution_id UUID REFERENCES public.referral_attributions (id),
  ADD COLUMN IF NOT EXISTS remaining_cents INTEGER,
  ADD COLUMN IF NOT EXISTS original_cents INTEGER,
  ADD COLUMN IF NOT EXISTS net_paid_basis_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mature_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS redeemed_cents INTEGER NOT NULL DEFAULT 0 CHECK (redeemed_cents >= 0),
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Expand status vocabulary (keep void/paid for legacy rows)
ALTER TABLE public.referral_earnings DROP CONSTRAINT IF EXISTS referral_earnings_status_check;
ALTER TABLE public.referral_earnings
  ADD CONSTRAINT referral_earnings_status_check
  CHECK (status IN ('pending', 'available', 'redeemed', 'reversed', 'void', 'paid'));

UPDATE public.referral_earnings
SET original_cents = amount_cents,
    remaining_cents = CASE
      WHEN status IN ('void', 'reversed', 'paid') THEN 0
      ELSE amount_cents
    END
WHERE original_cents IS NULL;

ALTER TABLE public.referral_earnings
  ALTER COLUMN original_cents SET DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS referral_earnings_attribution_uidx
  ON public.referral_earnings (attribution_id)
  WHERE attribution_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS referral_earnings_booking_uidx
  ON public.referral_earnings (source_booking_id)
  WHERE source_booking_id IS NOT NULL
    AND status IN ('pending', 'available', 'redeemed');

CREATE UNIQUE INDEX IF NOT EXISTS referral_earnings_idempotency_uidx
  ON public.referral_earnings (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON TABLE public.referral_earnings IS
  'Royal Nordic Credit rewards — 10% of net paid; pending until tour completion; not cash payouts';

-- ---------- IMMUTABLE LEDGER ----------
CREATE TABLE IF NOT EXISTS public.referral_credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.referral_profiles (id) ON DELETE CASCADE,
  earning_id UUID REFERENCES public.referral_earnings (id) ON DELETE SET NULL,
  redemption_id UUID,
  entry_type TEXT NOT NULL
    CHECK (entry_type IN (
      'earn_pending',
      'mature',
      'reverse',
      'redeem_reserve',
      'redeem_apply',
      'redeem_release'
    )),
  amount_cents INTEGER NOT NULL,
  pending_delta INTEGER NOT NULL DEFAULT 0,
  available_delta INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_credit_ledger_idempotency_uidx UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS referral_credit_ledger_user_created_idx
  ON public.referral_credit_ledger (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS referral_credit_ledger_earning_idx
  ON public.referral_credit_ledger (earning_id);

-- ---------- BALANCE CACHE (server authority) ----------
CREATE TABLE IF NOT EXISTS public.referral_credit_balances (
  user_id UUID PRIMARY KEY REFERENCES public.referral_profiles (id) ON DELETE CASCADE,
  pending_cents INTEGER NOT NULL DEFAULT 0 CHECK (pending_cents >= 0),
  available_cents INTEGER NOT NULL DEFAULT 0 CHECK (available_cents >= 0),
  lifetime_earned_cents INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_earned_cents >= 0),
  lifetime_redeemed_cents INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_redeemed_cents >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- REDEMPTIONS (foundation; not public checkout) ----------
CREATE TABLE IF NOT EXISTS public.referral_credit_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.referral_profiles (id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'applied', 'released', 'void')),
  booking_id BIGINT REFERENCES public.bookings (id) ON DELETE SET NULL,
  stripe_checkout_session_id TEXT,
  idempotency_key TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_credit_redemptions_idempotency_uidx UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS referral_credit_redemptions_user_idx
  ON public.referral_credit_redemptions (user_id, created_at DESC);

ALTER TABLE public.referral_credit_ledger
  DROP CONSTRAINT IF EXISTS referral_credit_ledger_redemption_id_fkey;
ALTER TABLE public.referral_credit_ledger
  ADD CONSTRAINT referral_credit_ledger_redemption_id_fkey
  FOREIGN KEY (redemption_id) REFERENCES public.referral_credit_redemptions (id) ON DELETE SET NULL;

-- ---------- ACTIVITY EVENT TYPES ----------
ALTER TABLE public.referral_activity DROP CONSTRAINT IF EXISTS referral_activity_event_type_check;
ALTER TABLE public.referral_activity
  ADD CONSTRAINT referral_activity_event_type_check
  CHECK (
    event_type IN (
      'signup',
      'code_claimed',
      'booking_attributed',
      'commission_pending',
      'commission_available',
      'payout',
      'credit_pending',
      'credit_available',
      'credit_reversed',
      'credit_redeemed'
    )
  );

-- ---------- RLS ----------
ALTER TABLE public.referral_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credit_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_credit_ledger_select_own ON public.referral_credit_ledger;
CREATE POLICY referral_credit_ledger_select_own
  ON public.referral_credit_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS referral_credit_balances_select_own ON public.referral_credit_balances;
CREATE POLICY referral_credit_balances_select_own
  ON public.referral_credit_balances FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS referral_credit_redemptions_select_own ON public.referral_credit_redemptions;
CREATE POLICY referral_credit_redemptions_select_own
  ON public.referral_credit_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON public.referral_credit_ledger TO authenticated;
GRANT SELECT ON public.referral_credit_balances TO authenticated;
GRANT SELECT ON public.referral_credit_redemptions TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    EXECUTE $p$
      DROP POLICY IF EXISTS referral_credit_ledger_admin_all ON public.referral_credit_ledger;
      CREATE POLICY referral_credit_ledger_admin_all
        ON public.referral_credit_ledger FOR ALL TO authenticated
        USING (public.is_admin()) WITH CHECK (public.is_admin());

      DROP POLICY IF EXISTS referral_credit_balances_admin_all ON public.referral_credit_balances;
      CREATE POLICY referral_credit_balances_admin_all
        ON public.referral_credit_balances FOR ALL TO authenticated
        USING (public.is_admin()) WITH CHECK (public.is_admin());

      DROP POLICY IF EXISTS referral_credit_redemptions_admin_all ON public.referral_credit_redemptions;
      CREATE POLICY referral_credit_redemptions_admin_all
        ON public.referral_credit_redemptions FOR ALL TO authenticated
        USING (public.is_admin()) WITH CHECK (public.is_admin());
    $p$;
  END IF;
END $$;

-- ---------- HELPERS ----------
CREATE OR REPLACE FUNCTION public.referral_credit_from_paid_cents(p_paid_cents INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_paid_cents IS NULL OR p_paid_cents <= 0 THEN 0
    ELSE (p_paid_cents + 5) / 10  -- round half up of 10%
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_internal_cert_booking(
  p_tour_id BIGINT,
  p_booking_id BIGINT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge TEXT;
  tname TEXT;
  reqs TEXT;
BEGIN
  IF p_tour_id IS NOT NULL THEN
    SELECT t.badge, t.name INTO badge, tname FROM public.tours t WHERE t.id = p_tour_id;
    IF coalesce(badge, '') = 'INTERNAL_CERT' THEN RETURN TRUE; END IF;
    IF upper(coalesce(tname, '')) LIKE 'INTERNAL CERT%' THEN RETURN TRUE; END IF;
  END IF;
  IF p_booking_id IS NOT NULL THEN
    SELECT b.special_requests INTO reqs FROM public.bookings b WHERE b.id = p_booking_id;
    IF coalesce(reqs, '') ILIKE '%CERTIFICATION%' THEN RETURN TRUE; END IF;
  END IF;
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.referral_tour_completion_at(
  p_booking_id BIGINT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d DATE;
  ttext TEXT;
  hh INT := 23;
  mm INT := 59;
BEGIN
  SELECT td.date,
         coalesce(nullif(b.tour_time, ''), nullif(t.departure_time, ''), '23:59')
    INTO d, ttext
  FROM public.bookings b
  LEFT JOIN public.tour_dates td ON td.id = b.tour_date_id
  LEFT JOIN public.tours t ON t.id = b.tour_id
  WHERE b.id = p_booking_id;

  IF d IS NULL THEN
    RETURN NULL;
  END IF;

  BEGIN
    hh := split_part(ttext, ':', 1)::int;
    mm := split_part(ttext, ':', 2)::int;
  EXCEPTION WHEN others THEN
    hh := 23;
    mm := 59;
  END;

  RETURN ((d + make_time(hh, mm, 0)) AT TIME ZONE 'Europe/Helsinki');
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_referral_credit_balance(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.referral_credit_balances (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_referral_credit_balance_delta(
  p_user_id UUID,
  p_pending_delta INTEGER,
  p_available_delta INTEGER,
  p_lifetime_earned_delta INTEGER DEFAULT 0,
  p_lifetime_redeemed_delta INTEGER DEFAULT 0
)
RETURNS public.referral_credit_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.referral_credit_balances;
BEGIN
  PERFORM public.ensure_referral_credit_balance(p_user_id);
  UPDATE public.referral_credit_balances
  SET pending_cents = pending_cents + p_pending_delta,
      available_cents = available_cents + p_available_delta,
      lifetime_earned_cents = lifetime_earned_cents + greatest(p_lifetime_earned_delta, 0),
      lifetime_redeemed_cents = lifetime_redeemed_cents + greatest(p_lifetime_redeemed_delta, 0),
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO row;

  IF row.pending_cents < 0 OR row.available_cents < 0 THEN
    RAISE EXCEPTION 'referral credit balance would go negative'
      USING ERRCODE = '23514';
  END IF;
  RETURN row;
END;
$$;

-- Create pending credit from a confirmed attribution (idempotent).
CREATE OR REPLACE FUNCTION public.create_referral_credit_for_attribution(
  p_attribution_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  att public.referral_attributions%ROWTYPE;
  credit INTEGER;
  earning_id UUID;
  idem TEXT;
  mature_at TIMESTAMPTZ;
BEGIN
  IF p_attribution_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_attribution');
  END IF;

  SELECT * INTO att FROM public.referral_attributions WHERE id = p_attribution_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF att.status <> 'confirmed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'attribution_not_confirmed', 'status', att.status);
  END IF;

  IF public.is_internal_cert_booking(att.tour_id, att.booking_id) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'internal_cert');
  END IF;

  SELECT id INTO earning_id FROM public.referral_earnings WHERE attribution_id = att.id LIMIT 1;
  IF earning_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'id', earning_id, 'duplicate', true);
  END IF;

  credit := public.referral_credit_from_paid_cents(att.charged_cents);
  IF credit <= 0 THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'zero_credit');
  END IF;

  idem := 'earn:' || att.id::text;
  mature_at := public.referral_tour_completion_at(att.booking_id);

  BEGIN
    INSERT INTO public.referral_earnings (
      user_id,
      amount_cents,
      currency,
      status,
      source_booking_id,
      attribution_id,
      original_cents,
      remaining_cents,
      net_paid_basis_cents,
      mature_at,
      idempotency_key,
      note
    ) VALUES (
      att.referrer_user_id,
      credit,
      'EUR',
      'pending',
      att.booking_id,
      att.id,
      credit,
      credit,
      att.charged_cents,
      mature_at,
      idem,
      'Royal Nordic Credit — 10% of paid booking'
    )
    RETURNING id INTO earning_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO earning_id FROM public.referral_earnings WHERE attribution_id = att.id LIMIT 1;
    RETURN jsonb_build_object('ok', true, 'id', earning_id, 'duplicate', true);
  END;

  INSERT INTO public.referral_credit_ledger (
    user_id, earning_id, entry_type, amount_cents, pending_delta, available_delta,
    idempotency_key, metadata
  ) VALUES (
    att.referrer_user_id, earning_id, 'earn_pending', credit, credit, 0,
    idem,
    jsonb_build_object(
      'attribution_id', att.id,
      'booking_id', att.booking_id,
      'charged_cents', att.charged_cents
    )
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  PERFORM public.apply_referral_credit_balance_delta(
    att.referrer_user_id, credit, 0, credit, 0
  );

  INSERT INTO public.referral_activity (referrer_user_id, event_type, amount_cents, metadata)
  VALUES (
    att.referrer_user_id,
    'credit_pending',
    credit,
    jsonb_build_object(
      'booking_ref', 'RN-' || att.booking_id::text,
      'earning_id', earning_id,
      'attribution_id', att.id
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'id', earning_id,
    'amount_cents', credit,
    'status', 'pending',
    'mature_at', mature_at
  );
END;
$$;

-- Reverse or shrink credit after refund/cancel. Target net paid drives remaining credit.
CREATE OR REPLACE FUNCTION public.sync_referral_credit_for_net_paid(
  p_attribution_id UUID,
  p_net_paid_cents INTEGER,
  p_reason TEXT DEFAULT 'refund'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  att public.referral_attributions%ROWTYPE;
  earn public.referral_earnings%ROWTYPE;
  target INTEGER;
  active INTEGER;
  reverse_amt INTEGER;
  from_pending INTEGER;
  from_available INTEGER;
  idem TEXT;
BEGIN
  SELECT * INTO att FROM public.referral_attributions WHERE id = p_attribution_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT * INTO earn
  FROM public.referral_earnings
  WHERE attribution_id = att.id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'no_earning');
  END IF;

  IF earn.status IN ('reversed', 'void') THEN
    RETURN jsonb_build_object('ok', true, 'id', earn.id, 'status', earn.status, 'duplicate', true);
  END IF;

  target := public.referral_credit_from_paid_cents(greatest(coalesce(p_net_paid_cents, 0), 0));
  -- Redeemed credit cannot be pulled back from the guest; reverse only unredeemed remainder.
  active := greatest(coalesce(earn.remaining_cents, 0), 0);
  IF target >= active THEN
    -- Net paid still supports current remaining (e.g. tiny partial); refresh basis only
    UPDATE public.referral_earnings
    SET net_paid_basis_cents = greatest(coalesce(p_net_paid_cents, 0), 0),
        amount_cents = greatest(target, earn.redeemed_cents)
    WHERE id = earn.id;
    RETURN jsonb_build_object('ok', true, 'id', earn.id, 'unchanged', true, 'remaining_cents', active);
  END IF;

  reverse_amt := active - target;
  from_pending := 0;
  from_available := 0;

  IF earn.status = 'pending' THEN
    from_pending := reverse_amt;
  ELSIF earn.status = 'available' THEN
    from_available := reverse_amt;
  ELSIF earn.status = 'redeemed' THEN
    -- Fully redeemed historically; remaining should be 0 — nothing to reverse
    reverse_amt := 0;
  END IF;

  IF reverse_amt <= 0 THEN
    RETURN jsonb_build_object('ok', true, 'id', earn.id, 'unchanged', true);
  END IF;

  idem := 'reverse:' || earn.id::text || ':' || greatest(coalesce(p_net_paid_cents, 0))::text || ':' || p_reason;

  IF EXISTS (SELECT 1 FROM public.referral_credit_ledger WHERE idempotency_key = idem) THEN
    RETURN jsonb_build_object('ok', true, 'id', earn.id, 'duplicate', true);
  END IF;

  INSERT INTO public.referral_credit_ledger (
    user_id, earning_id, entry_type, amount_cents, pending_delta, available_delta,
    idempotency_key, metadata
  ) VALUES (
    earn.user_id, earn.id, 'reverse', -reverse_amt, -from_pending, -from_available,
    idem,
    jsonb_build_object(
      'reason', p_reason,
      'net_paid_cents', p_net_paid_cents,
      'target_credit_cents', target
    )
  );

  PERFORM public.apply_referral_credit_balance_delta(
    earn.user_id, -from_pending, -from_available, 0, 0
  );

  UPDATE public.referral_earnings
  SET remaining_cents = target,
      amount_cents = target + earn.redeemed_cents,
      net_paid_basis_cents = greatest(coalesce(p_net_paid_cents, 0), 0),
      status = CASE
        WHEN target <= 0 AND earn.redeemed_cents <= 0 THEN 'reversed'
        WHEN target <= 0 AND earn.redeemed_cents > 0 THEN 'redeemed'
        ELSE earn.status
      END,
      reversed_at = CASE WHEN target <= 0 THEN NOW() ELSE reversed_at END
  WHERE id = earn.id;

  INSERT INTO public.referral_activity (referrer_user_id, event_type, amount_cents, metadata)
  VALUES (
    earn.user_id,
    'credit_reversed',
    reverse_amt,
    jsonb_build_object(
      'booking_ref', 'RN-' || att.booking_id::text,
      'earning_id', earn.id,
      'reason', p_reason,
      'remaining_cents', target
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'id', earn.id,
    'reversed_cents', reverse_amt,
    'remaining_cents', target
  );
END;
$$;

-- Mature pending credits whose tour completion time has passed.
CREATE OR REPLACE FUNCTION public.mature_due_referral_credits(
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  matured INT := 0;
  skipped INT := 0;
  idem TEXT;
  att_status TEXT;
  b_status TEXT;
  b_pay TEXT;
BEGIN
  FOR r IN
    SELECT e.*
    FROM public.referral_earnings e
    WHERE e.status = 'pending'
      AND e.remaining_cents > 0
      AND e.mature_at IS NOT NULL
      AND e.mature_at <= NOW()
    ORDER BY e.mature_at ASC
    LIMIT greatest(p_limit, 1)
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT a.status INTO att_status
    FROM public.referral_attributions a WHERE a.id = r.attribution_id;

    SELECT b.status, b.payment_status INTO b_status, b_pay
    FROM public.bookings b WHERE b.id = r.source_booking_id;

    IF att_status IS DISTINCT FROM 'confirmed'
       OR coalesce(b_status, '') = 'cancelled'
       OR coalesce(b_pay, '') IN ('refunded', 'partial_refund')
    THEN
      PERFORM public.sync_referral_credit_for_net_paid(
        r.attribution_id,
        0,
        'ineligible_at_maturity'
      );
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    idem := 'mature:' || r.id::text;
    IF EXISTS (SELECT 1 FROM public.referral_credit_ledger WHERE idempotency_key = idem) THEN
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    INSERT INTO public.referral_credit_ledger (
      user_id, earning_id, entry_type, amount_cents, pending_delta, available_delta,
      idempotency_key, metadata
    ) VALUES (
      r.user_id, r.id, 'mature', r.remaining_cents, -r.remaining_cents, r.remaining_cents,
      idem,
      jsonb_build_object('mature_at', r.mature_at)
    );

    PERFORM public.apply_referral_credit_balance_delta(
      r.user_id, -r.remaining_cents, r.remaining_cents, 0, 0
    );

    UPDATE public.referral_earnings
    SET status = 'available',
        available_at = NOW()
    WHERE id = r.id;

    INSERT INTO public.referral_activity (referrer_user_id, event_type, amount_cents, metadata)
    VALUES (
      r.user_id,
      'credit_available',
      r.remaining_cents,
      jsonb_build_object(
        'booking_ref', 'RN-' || r.source_booking_id::text,
        'earning_id', r.id
      )
    );

    matured := matured + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'matured', matured, 'skipped', skipped);
END;
$$;

-- Balance read for dashboard (authenticated own user, or service role any).
CREATE OR REPLACE FUNCTION public.get_referral_credit_balance(
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  uid UUID;
  bal public.referral_credit_balances%ROWTYPE;
BEGIN
  -- Members may only read their own balance. Service role (no JWT uid) may pass p_user_id.
  IF caller IS NOT NULL THEN
    uid := caller;
  ELSE
    uid := p_user_id;
  END IF;

  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  PERFORM public.ensure_referral_credit_balance(uid);
  SELECT * INTO bal FROM public.referral_credit_balances WHERE user_id = uid;
  RETURN jsonb_build_object(
    'ok', true,
    'pending_cents', bal.pending_cents,
    'available_cents', bal.available_cents,
    'lifetime_earned_cents', bal.lifetime_earned_cents,
    'lifetime_redeemed_cents', bal.lifetime_redeemed_cents,
    'updated_at', bal.updated_at
  );
END;
$$;

-- Reserve available credit for a future booking (not wired to public checkout).
CREATE OR REPLACE FUNCTION public.reserve_referral_credit(
  p_amount_cents INTEGER,
  p_idempotency_key TEXT,
  p_booking_id BIGINT DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  bal public.referral_credit_balances%ROWTYPE;
  red_id UUID;
  existing public.referral_credit_redemptions%ROWTYPE;
  idem TEXT := trim(coalesce(p_idempotency_key, ''));
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;
  IF length(idem) < 8 OR length(idem) > 120 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_idempotency_key');
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

  PERFORM public.ensure_referral_credit_balance(uid);
  SELECT * INTO bal FROM public.referral_credit_balances WHERE user_id = uid FOR UPDATE;

  IF bal.available_cents < p_amount_cents THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credit',
      'available_cents', bal.available_cents
    );
  END IF;

  INSERT INTO public.referral_credit_redemptions (
    user_id, amount_cents, status, booking_id, idempotency_key, note
  ) VALUES (
    uid, p_amount_cents, 'reserved', p_booking_id, idem, p_note
  )
  RETURNING id INTO red_id;

  INSERT INTO public.referral_credit_ledger (
    user_id, redemption_id, entry_type, amount_cents, pending_delta, available_delta,
    idempotency_key, metadata
  ) VALUES (
    uid, red_id, 'redeem_reserve', -p_amount_cents, 0, -p_amount_cents,
    'redeem_reserve:' || idem,
    jsonb_build_object('booking_id', p_booking_id)
  );

  PERFORM public.apply_referral_credit_balance_delta(uid, 0, -p_amount_cents, 0, 0);

  RETURN jsonb_build_object(
    'ok', true,
    'id', red_id,
    'status', 'reserved',
    'amount_cents', p_amount_cents
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.release_referral_credit_reservation(
  p_redemption_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  red public.referral_credit_redemptions%ROWTYPE;
  idem TEXT;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO red FROM public.referral_credit_redemptions WHERE id = p_redemption_id FOR UPDATE;
  IF NOT FOUND OR red.user_id IS DISTINCT FROM uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF red.status IN ('released', 'void') THEN
    RETURN jsonb_build_object('ok', true, 'id', red.id, 'status', red.status, 'duplicate', true);
  END IF;
  IF red.status <> 'reserved' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_reservable', 'status', red.status);
  END IF;

  idem := 'redeem_release:' || red.id::text;
  IF EXISTS (SELECT 1 FROM public.referral_credit_ledger WHERE idempotency_key = idem) THEN
    RETURN jsonb_build_object('ok', true, 'id', red.id, 'duplicate', true);
  END IF;

  INSERT INTO public.referral_credit_ledger (
    user_id, redemption_id, entry_type, amount_cents, pending_delta, available_delta,
    idempotency_key, metadata
  ) VALUES (
    uid, red.id, 'redeem_release', red.amount_cents, 0, red.amount_cents,
    idem, '{}'::jsonb
  );

  PERFORM public.apply_referral_credit_balance_delta(uid, 0, red.amount_cents, 0, 0);

  UPDATE public.referral_credit_redemptions
  SET status = 'released', updated_at = NOW()
  WHERE id = red.id;

  RETURN jsonb_build_object('ok', true, 'id', red.id, 'status', 'released');
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_referral_credit_reservation(
  p_redemption_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  red public.referral_credit_redemptions%ROWTYPE;
  idem TEXT;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO red FROM public.referral_credit_redemptions WHERE id = p_redemption_id FOR UPDATE;
  IF NOT FOUND OR red.user_id IS DISTINCT FROM uid THEN
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
    RETURN jsonb_build_object('ok', true, 'id', red.id, 'duplicate', true);
  END IF;

  INSERT INTO public.referral_credit_ledger (
    user_id, redemption_id, entry_type, amount_cents, pending_delta, available_delta,
    idempotency_key, metadata
  ) VALUES (
    uid, red.id, 'redeem_apply', -red.amount_cents, 0, 0,
    idem, '{}'::jsonb
  );

  -- Available already reduced at reserve; count lifetime redeemed now.
  PERFORM public.apply_referral_credit_balance_delta(uid, 0, 0, 0, red.amount_cents);

  UPDATE public.referral_credit_redemptions
  SET status = 'applied', updated_at = NOW()
  WHERE id = red.id;

  INSERT INTO public.referral_activity (referrer_user_id, event_type, amount_cents, metadata)
  VALUES (
    uid,
    'credit_redeemed',
    red.amount_cents,
    jsonb_build_object('redemption_id', red.id, 'booking_id', red.booking_id)
  );

  RETURN jsonb_build_object('ok', true, 'id', red.id, 'status', 'applied');
END;
$$;

-- Patch confirm_referral_attribution to create credit in the same transaction.
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
  credit_result JSONB;
BEGIN
  IF p_booking_id IS NULL OR p_referrer_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_ids');
  END IF;

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
    credit_result := public.create_referral_credit_for_attribution(existing_id);
    RETURN jsonb_build_object('ok', true, 'id', existing_id, 'duplicate', true, 'credit', credit_result);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.referral_attributions
    WHERE booking_id = p_booking_id AND status IN ('confirmed', 'pending')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate_attribution');
  END IF;

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
    referrer_user_id, referral_code, booking_id, stripe_checkout_session_id,
    stripe_payment_intent_id, tour_id, guest_subtotal_cents, discount_cents,
    charged_cents, status, guest_email_hash
  ) VALUES (
    p_referrer_user_id, upper(p_referral_code), p_booking_id, p_stripe_checkout_session_id,
    p_stripe_payment_intent_id, p_tour_id, greatest(p_guest_subtotal_cents, 0),
    greatest(p_discount_cents, 0), greatest(p_charged_cents, 0), 'confirmed', email_hash
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

  credit_result := public.create_referral_credit_for_attribution(new_id);

  RETURN jsonb_build_object('ok', true, 'id', new_id, 'credit', credit_result);
END;
$$;

-- Hardened mark status (4-arg) + credit sync on terminal states.
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
  credit_result JSONB;
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
  LIMIT 1
  FOR UPDATE;

  IF row_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF prev_status = p_status THEN
    credit_result := public.sync_referral_credit_for_net_paid(row_id, 0, p_status);
    RETURN jsonb_build_object('ok', true, 'id', row_id, 'status', p_status, 'duplicate', true, 'credit', credit_result);
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

  credit_result := public.sync_referral_credit_for_net_paid(row_id, 0, p_status);

  RETURN jsonb_build_object('ok', true, 'id', row_id, 'status', p_status, 'credit', credit_result);
END;
$$;

-- Partial refund helper: keep attribution confirmed when net paid > 0.
CREATE OR REPLACE FUNCTION public.adjust_referral_credit_for_charge_refund(
  p_stripe_payment_intent_id TEXT,
  p_charge_amount_cents INTEGER,
  p_amount_refunded_cents INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  att public.referral_attributions%ROWTYPE;
  net_paid INTEGER;
  mark_result JSONB;
  sync_result JSONB;
BEGIN
  IF p_stripe_payment_intent_id IS NULL OR length(trim(p_stripe_payment_intent_id)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_pi');
  END IF;

  SELECT * INTO att
  FROM public.referral_attributions
  WHERE stripe_payment_intent_id = p_stripe_payment_intent_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  net_paid := greatest(
    coalesce(p_charge_amount_cents, att.charged_cents) - greatest(coalesce(p_amount_refunded_cents, 0), 0),
    0
  );

  IF net_paid <= 0 THEN
    mark_result := public.mark_referral_attribution_status(
      p_stripe_payment_intent_id, att.booking_id, 'refunded', att.stripe_checkout_session_id
    );
    RETURN jsonb_build_object('ok', true, 'full_refund', true, 'mark', mark_result);
  END IF;

  sync_result := public.sync_referral_credit_for_net_paid(att.id, net_paid, 'partial_refund');
  RETURN jsonb_build_object('ok', true, 'full_refund', false, 'net_paid_cents', net_paid, 'credit', sync_result);
END;
$$;

REVOKE ALL ON FUNCTION public.referral_credit_from_paid_cents(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_internal_cert_booking(BIGINT, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.referral_tour_completion_at(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_referral_credit_for_attribution(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_referral_credit_for_net_paid(UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mature_due_referral_credits(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.adjust_referral_credit_for_charge_refund(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_referral_credit_balance(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_referral_credit_balance_delta(UUID, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_referral_credit_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_referral_credit(INTEGER, TEXT, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_referral_credit_reservation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_credit_reservation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mature_due_referral_credits(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.referral_credit_from_paid_cents(INTEGER) TO authenticated;

-- Ensure existing cert attribution does not receive credit if somehow reprocessed
SELECT public.sync_referral_credit_for_net_paid(
  id, 0, 'cert_cleanup'
)
FROM public.referral_attributions
WHERE tour_id = 13 OR referral_code = 'CERT93704883';
