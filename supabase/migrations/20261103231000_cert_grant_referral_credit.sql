-- Locked certification-only credit seed. Not for public customers.
-- Requires service_role + auth user app_metadata.certification starting with phase33.

ALTER TABLE public.referral_credit_ledger
  DROP CONSTRAINT IF EXISTS referral_credit_ledger_entry_type_check;

ALTER TABLE public.referral_credit_ledger
  ADD CONSTRAINT referral_credit_ledger_entry_type_check
  CHECK (entry_type IN (
    'earn_pending',
    'mature',
    'reverse',
    'redeem_reserve',
    'redeem_apply',
    'redeem_release',
    'cert_grant'
  ));

CREATE OR REPLACE FUNCTION public.grant_certification_referral_credit(
  p_user_id UUID,
  p_amount_cents INTEGER,
  p_idempotency_key TEXT,
  p_note TEXT DEFAULT 'phase33_cert'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB;
  cert TEXT;
  amount INT;
  idem TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_user');
  END IF;

  amount := greatest(coalesce(p_amount_cents, 0), 0);
  IF amount <= 0 OR amount > 500 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'amount_out_of_range');
  END IF;

  SELECT raw_app_meta_data INTO meta
  FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
  END IF;

  cert := lower(coalesce(meta->>'certification', ''));
  IF cert NOT LIKE 'phase33%' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_cert_user');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.referral_profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_referral_profile');
  END IF;

  idem := left(coalesce(nullif(trim(p_idempotency_key), ''), 'cert_grant:' || p_user_id::text), 160);
  IF EXISTS (SELECT 1 FROM public.referral_credit_ledger WHERE idempotency_key = idem) THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'idempotency_key', idem);
  END IF;

  INSERT INTO public.referral_credit_ledger (
    user_id, entry_type, amount_cents, pending_delta, available_delta,
    idempotency_key, metadata
  ) VALUES (
    p_user_id, 'cert_grant', amount, 0, amount,
    idem,
    jsonb_build_object('note', coalesce(p_note, 'phase33_cert'), 'certification', cert)
  );

  PERFORM public.apply_referral_credit_balance_delta(p_user_id, 0, amount, amount, 0);

  INSERT INTO public.referral_activity (referrer_user_id, event_type, amount_cents, metadata)
  VALUES (
    p_user_id,
    'credit_available',
    amount,
    jsonb_build_object('source', 'cert_grant', 'note', coalesce(p_note, 'phase33_cert'))
  );

  RETURN jsonb_build_object('ok', true, 'amount_cents', amount, 'idempotency_key', idem);
END;
$$;

REVOKE ALL ON FUNCTION public.grant_certification_referral_credit(UUID, INTEGER, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_certification_referral_credit(UUID, INTEGER, TEXT, TEXT) TO service_role;
