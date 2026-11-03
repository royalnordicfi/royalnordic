-- Phase 3.3: maturity after tour end (incl. variable NL duration),
-- ineligibility hardening, expired-reservation cleanup job, pg_cron schedule.
-- Public redemption flags remain OFF.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Estimated duration hours from tour CMS text / known NL variability.
-- For ranges (e.g. "2–10 h"), use the UPPER bound so credit never matures mid-tour.
CREATE OR REPLACE FUNCTION public.referral_estimate_duration_hours(
  p_tour_id BIGINT,
  p_duration_text TEXT DEFAULT NULL,
  p_tour_name TEXT DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  txt TEXT := lower(coalesce(p_duration_text, ''));
  nm TEXT := lower(coalesce(p_tour_name, ''));
  hi NUMERIC;
  single NUMERIC;
BEGIN
  -- Explicit range: 2–10 h / 2-10h / 3–3.5 hours
  IF txt ~ '([0-9]+(?:\.[0-9]+)?)\s*[–—-]\s*([0-9]+(?:\.[0-9]+)?)' THEN
    hi := greatest(
      (regexp_match(txt, '([0-9]+(?:\.[0-9]+)?)\s*[–—-]\s*([0-9]+(?:\.[0-9]+)?)'))[1]::numeric,
      (regexp_match(txt, '([0-9]+(?:\.[0-9]+)?)\s*[–—-]\s*([0-9]+(?:\.[0-9]+)?)'))[2]::numeric
    );
    RETURN greatest(hi, 1);
  END IF;

  IF txt ~ '([0-9]+(?:\.[0-9]+)?)\s*h' THEN
    single := (regexp_match(txt, '([0-9]+(?:\.[0-9]+)?)\s*h'))[1]::numeric;
    RETURN greatest(ceil(single), 1);
  END IF;

  IF txt ~ '([0-9]+(?:\.[0-9]+)?)\s*hour' THEN
    single := (regexp_match(txt, '([0-9]+(?:\.[0-9]+)?)\s*hour'))[1]::numeric;
    RETURN greatest(ceil(single), 1);
  END IF;

  -- Known Northern Lights products (variable chase length) — conservative 10h.
  IF p_tour_id IN (1, 8, 10, 11) OR nm LIKE '%northern lights%' OR nm LIKE '%aurora%' THEN
    RETURN 10;
  END IF;

  -- Safe default for other experiences.
  RETURN 6;
END;
$$;

-- Completion = departure + estimated duration + 30m buffer (Europe/Helsinki).
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
  dur_hours NUMERIC;
  depart TIMESTAMPTZ;
BEGIN
  SELECT td.date,
         coalesce(nullif(b.tour_time, ''), nullif(t.departure_time, ''), '23:59'),
         public.referral_estimate_duration_hours(t.id, t.duration_text, t.name)
    INTO d, ttext, dur_hours
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

  depart := ((d + make_time(hh, mm, 0)) AT TIME ZONE 'Europe/Helsinki');
  RETURN depart
    + make_interval(hours => greatest(ceil(coalesce(dur_hours, 6)), 1)::int)
    + interval '30 minutes';
END;
$$;

-- Recompute mature_at for still-pending earnings under the new end-of-tour rule.
UPDATE public.referral_earnings e
SET mature_at = public.referral_tour_completion_at(e.source_booking_id)
WHERE e.status = 'pending'
  AND e.remaining_cents > 0
  AND e.source_booking_id IS NOT NULL;

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

    -- Never mature cancelled / refunded / disputed / unpaid / non-confirmed.
    IF att_status IS DISTINCT FROM 'confirmed'
       OR coalesce(b_status, '') IN ('cancelled', 'canceled')
       OR coalesce(b_pay, '') IN (
            'refunded', 'partial_refund', 'unpaid', 'failed',
            'disputed', 'chargeback', 'requires_payment'
          )
       OR public.is_internal_cert_booking(
            (SELECT tour_id FROM public.bookings WHERE id = r.source_booking_id),
            r.source_booking_id
          )
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
      -- Already matured (duplicate cron) — heal earning row if needed.
      UPDATE public.referral_earnings
      SET status = 'available',
          available_at = coalesce(available_at, NOW())
      WHERE id = r.id AND status = 'pending';
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

CREATE TABLE IF NOT EXISTS public.referral_credit_job_runs (
  id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  ok BOOLEAN,
  result JSONB,
  error TEXT
);

ALTER TABLE public.referral_credit_job_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_credit_job_runs_deny_all ON public.referral_credit_job_runs;
CREATE POLICY referral_credit_job_runs_deny_all
  ON public.referral_credit_job_runs
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- Single entrypoint for cron + edge: mature + expire reservations, with run log.
CREATE OR REPLACE FUNCTION public.run_referral_credit_maintenance(
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  run_id BIGINT;
  matured JSONB;
  released JSONB;
  out_json JSONB;
BEGIN
  INSERT INTO public.referral_credit_job_runs (started_at)
  VALUES (NOW())
  RETURNING id INTO run_id;

  BEGIN
    matured := public.mature_due_referral_credits(p_limit);
    released := public.release_expired_referral_credit_reservations(p_limit);
    out_json := jsonb_build_object(
      'ok', true,
      'matured', matured,
      'released', released,
      'run_id', run_id
    );
    UPDATE public.referral_credit_job_runs
    SET finished_at = NOW(), ok = true, result = out_json
    WHERE id = run_id;
    RETURN out_json;
  EXCEPTION WHEN others THEN
    UPDATE public.referral_credit_job_runs
    SET finished_at = NOW(), ok = false, error = SQLERRM
    WHERE id = run_id;
    RAISE;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.referral_estimate_duration_hours(BIGINT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.referral_tour_completion_at(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mature_due_referral_credits(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_referral_credit_maintenance(INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.run_referral_credit_maintenance(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.mature_due_referral_credits(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_expired_referral_credit_reservations(INTEGER) TO service_role;

-- Schedule every 15 minutes. Idempotent via SKIP LOCKED + ledger idempotency keys.
DO $$
BEGIN
  -- Unschedule prior job if re-applied
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'mature-referral-credits';
EXCEPTION WHEN undefined_table THEN
  NULL;
WHEN others THEN
  NULL;
END $$;

SELECT cron.schedule(
  'mature-referral-credits',
  '*/15 * * * *',
  $$SELECT public.run_referral_credit_maintenance(200);$$
);
