-- Royal Nordic Rewards — profiles, unique codes, earnings/activity foundation.
-- Phase 1: accounts + custom codes only. No booking attribution, commissions, or payouts yet.
-- Idempotent where practical. Apply to production only with explicit approval.

-- ---------- PROFILES ----------
CREATE TABLE IF NOT EXISTS public.referral_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_profiles_email_idx
  ON public.referral_profiles (lower(email));

-- ---------- CODES ----------
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.referral_profiles (id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_codes_format CHECK (code ~ '^[A-Z0-9]{4,20}$')
);

-- Case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_code_ci_uidx
  ON public.referral_codes (lower(code));

-- One active code per member
CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_one_active_per_user
  ON public.referral_codes (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS referral_codes_user_id_idx
  ON public.referral_codes (user_id);

-- ---------- EARNINGS (foundation; unused until booking phase) ----------
CREATE TABLE IF NOT EXISTS public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.referral_profiles (id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL
    CHECK (status IN ('pending', 'available', 'paid', 'void')),
  source_booking_id BIGINT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  available_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS referral_earnings_user_status_idx
  ON public.referral_earnings (user_id, status);

-- ---------- ACTIVITY (foundation) ----------
CREATE TABLE IF NOT EXISTS public.referral_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES public.referral_profiles (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (
      event_type IN (
        'signup',
        'code_claimed',
        'booking_attributed',
        'commission_pending',
        'commission_available',
        'payout'
      )
    ),
  amount_cents INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_activity_referrer_created_idx
  ON public.referral_activity (referrer_user_id, created_at DESC);

-- ---------- HELPERS ----------
CREATE OR REPLACE FUNCTION public.normalize_referral_code(raw TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT upper(regexp_replace(coalesce(raw, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.is_reserved_referral_code(normalized TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  blocked TEXT[] := ARRAY[
    'ADMIN', 'ADMINS', 'ROYAL', 'ROYALNORDIC', 'NORDIC', 'RN', 'STAFF', 'SUPPORT',
    'HELP', 'ROOT', 'SYSTEM', 'NULL', 'UNDEFINED', 'TEST', 'TESTING', 'DEMO',
    'FREE', 'DISCOUNT', 'OFFICIAL', 'PARTNER', 'AGENCY', 'TRAVELTRADE',
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
  -- Prefix traps for brand / abuse
  IF normalized LIKE 'RN%' OR normalized LIKE 'ADMIN%' OR normalized LIKE 'ROYAL%' THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_referral_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.referral_profiles (id, email, display_name)
  VALUES (
    NEW.id,
    coalesce(NEW.email, ''),
    coalesce(NEW.raw_user_meta_data ->> 'display_name', split_part(coalesce(NEW.email, ''), '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_referral_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_referral_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_referral_profile();

-- Keep email in sync on auth update
CREATE OR REPLACE FUNCTION public.sync_referral_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.referral_profiles
  SET email = coalesce(NEW.email, email),
      updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated_referral_profile ON auth.users;
CREATE TRIGGER on_auth_user_updated_referral_profile
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_referral_profile_email();

-- Availability check (authenticated); does not reserve
CREATE OR REPLACE FUNCTION public.check_referral_code_available(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized TEXT;
  taken BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  normalized := public.normalize_referral_code(p_code);

  IF length(normalized) < 4 OR length(normalized) > 20 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'available', false,
      'normalized', normalized,
      'error', 'invalid_format'
    );
  END IF;

  IF public.is_reserved_referral_code(normalized) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'available', false,
      'normalized', normalized,
      'error', 'reserved'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.referral_codes c WHERE lower(c.code) = lower(normalized)
  ) INTO taken;

  IF taken THEN
    RETURN jsonb_build_object(
      'ok', true,
      'available', false,
      'normalized', normalized,
      'error', 'taken'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'available', true,
    'normalized', normalized
  );
END;
$$;

-- Atomic claim: validates, reserves, ensures one active code
CREATE OR REPLACE FUNCTION public.claim_referral_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  normalized TEXT;
  existing_active TEXT;
  new_id UUID;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  -- Ensure profile row exists (covers users created before trigger)
  INSERT INTO public.referral_profiles (id, email)
  SELECT u.id, coalesce(u.email, '')
  FROM auth.users u
  WHERE u.id = uid
  ON CONFLICT (id) DO NOTHING;

  SELECT c.code INTO existing_active
  FROM public.referral_codes c
  WHERE c.user_id = uid AND c.status = 'active'
  LIMIT 1;

  IF existing_active IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'already_has_code',
      'code', existing_active
    );
  END IF;

  normalized := public.normalize_referral_code(p_code);

  IF length(normalized) < 4 OR length(normalized) > 20 OR normalized !~ '^[A-Z0-9]{4,20}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_format', 'normalized', normalized);
  END IF;

  IF public.is_reserved_referral_code(normalized) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'reserved', 'normalized', normalized);
  END IF;

  BEGIN
    INSERT INTO public.referral_codes (user_id, code, status)
    VALUES (uid, normalized, 'active')
    RETURNING id INTO new_id;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object('ok', false, 'error', 'taken', 'normalized', normalized);
  END;

  INSERT INTO public.referral_activity (referrer_user_id, event_type, metadata)
  VALUES (uid, 'code_claimed', jsonb_build_object('code', normalized));

  RETURN jsonb_build_object(
    'ok', true,
    'code', normalized,
    'id', new_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_referral_code(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_referral_code_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral_code(TEXT) TO authenticated;

GRANT SELECT, UPDATE ON public.referral_profiles TO authenticated;
GRANT SELECT ON public.referral_codes TO authenticated;
GRANT SELECT ON public.referral_earnings TO authenticated;
GRANT SELECT ON public.referral_activity TO authenticated;

-- ---------- RLS ----------
ALTER TABLE public.referral_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_profiles_select_own ON public.referral_profiles;
CREATE POLICY referral_profiles_select_own
  ON public.referral_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS referral_profiles_update_own ON public.referral_profiles;
CREATE POLICY referral_profiles_update_own
  ON public.referral_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- No direct INSERT/DELETE on profiles from clients (trigger + service role only)

DROP POLICY IF EXISTS referral_codes_select_own ON public.referral_codes;
CREATE POLICY referral_codes_select_own
  ON public.referral_codes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- No client INSERT/UPDATE/DELETE on codes — claim_referral_code only

DROP POLICY IF EXISTS referral_earnings_select_own ON public.referral_earnings;
CREATE POLICY referral_earnings_select_own
  ON public.referral_earnings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS referral_activity_select_own ON public.referral_activity;
CREATE POLICY referral_activity_select_own
  ON public.referral_activity FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid());

-- Admins (if is_admin exists) can read all for support
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    EXECUTE $p$
      DROP POLICY IF EXISTS referral_profiles_admin_all ON public.referral_profiles;
      CREATE POLICY referral_profiles_admin_all
        ON public.referral_profiles FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

      DROP POLICY IF EXISTS referral_codes_admin_all ON public.referral_codes;
      CREATE POLICY referral_codes_admin_all
        ON public.referral_codes FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

      DROP POLICY IF EXISTS referral_earnings_admin_all ON public.referral_earnings;
      CREATE POLICY referral_earnings_admin_all
        ON public.referral_earnings FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

      DROP POLICY IF EXISTS referral_activity_admin_all ON public.referral_activity;
      CREATE POLICY referral_activity_admin_all
        ON public.referral_activity FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    $p$;
  END IF;
END $$;

COMMENT ON TABLE public.referral_profiles IS 'Royal Nordic Rewards member profiles (1:1 with auth.users)';
COMMENT ON TABLE public.referral_codes IS 'Unique referral codes; claim only via claim_referral_code()';
COMMENT ON TABLE public.referral_earnings IS 'Commission ledger foundation — inactive until booking phase';
COMMENT ON TABLE public.referral_activity IS 'Referral event stream foundation';
