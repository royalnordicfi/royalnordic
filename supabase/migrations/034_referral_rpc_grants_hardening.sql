-- Harden Rewards RPC grants after 033.
-- Revoke trigger helpers from API roles; ensure claim/check are authenticated-only;
-- pin search_path on pure helper functions.

REVOKE ALL ON FUNCTION public.ensure_referral_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_referral_profile_email() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.check_referral_code_available(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_referral_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_referral_code_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral_code(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.normalize_referral_code(raw TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT upper(regexp_replace(coalesce(raw, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

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

REVOKE ALL ON FUNCTION public.normalize_referral_code(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_reserved_referral_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_referral_code(TEXT) TO authenticated, anon;
-- is_reserved is internal; no client grant required
