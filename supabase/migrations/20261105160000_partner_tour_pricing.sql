-- B2B.5: Company-specific partner tour pricing (net rates).
-- Public retail pricing unchanged. Partners never invent default discounts.

CREATE TABLE IF NOT EXISTS public.partner_tour_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_company_id UUID NOT NULL REFERENCES public.partner_companies (id) ON DELETE CASCADE,
  tour_id INTEGER NOT NULL REFERENCES public.tours (id) ON DELETE CASCADE,
  pricing_type TEXT NOT NULL
    CHECK (pricing_type IN ('fixed_net', 'percent_off_retail')),
  fixed_net_eur NUMERIC(10, 2)
    CHECK (fixed_net_eur IS NULL OR fixed_net_eur >= 0),
  percent_off NUMERIC(6, 2)
    CHECK (percent_off IS NULL OR (percent_off >= 0 AND percent_off <= 100)),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATE NOT NULL DEFAULT (CURRENT_DATE),
  effective_to DATE,
  admin_note TEXT,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT partner_tour_prices_type_values CHECK (
    (pricing_type = 'fixed_net' AND fixed_net_eur IS NOT NULL AND percent_off IS NULL)
    OR (pricing_type = 'percent_off_retail' AND percent_off IS NOT NULL AND fixed_net_eur IS NULL)
  ),
  CONSTRAINT partner_tour_prices_dates CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_tour_prices_company_tour_active_uidx
  ON public.partner_tour_prices (partner_company_id, tour_id)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS partner_tour_prices_company_idx
  ON public.partner_tour_prices (partner_company_id, is_active);

CREATE INDEX IF NOT EXISTS partner_tour_prices_tour_idx
  ON public.partner_tour_prices (tour_id);

CREATE TABLE IF NOT EXISTS public.partner_tour_price_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_tour_price_id UUID REFERENCES public.partner_tour_prices (id) ON DELETE SET NULL,
  partner_company_id UUID NOT NULL,
  tour_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'deactivate', 'activate')),
  before_row JSONB,
  after_row JSONB,
  changed_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS partner_tour_price_audit_company_idx
  ON public.partner_tour_price_audit (partner_company_id, created_at DESC);

ALTER TABLE public.partner_tour_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_tour_price_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partner_tour_prices_admin_all ON public.partner_tour_prices;
CREATE POLICY partner_tour_prices_admin_all
  ON public.partner_tour_prices FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No partner table SELECT: resolved net prices only via SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS partner_tour_prices_member_select ON public.partner_tour_prices;

DROP POLICY IF EXISTS partner_tour_price_audit_admin_all ON public.partner_tour_price_audit;
CREATE POLICY partner_tour_price_audit_admin_all
  ON public.partner_tour_price_audit FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public._partner_resolve_net_price(
  p_retail NUMERIC,
  p_pricing_type TEXT,
  p_fixed_net NUMERIC,
  p_percent_off NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  net NUMERIC;
BEGIN
  IF p_pricing_type = 'fixed_net' THEN
    RETURN ROUND(p_fixed_net, 2);
  ELSIF p_pricing_type = 'percent_off_retail' THEN
    IF p_retail IS NULL THEN
      RETURN NULL;
    END IF;
    net := p_retail * (1 - (p_percent_off / 100.0));
    RETURN ROUND(GREATEST(net, 0), 2);
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public._partner_rate_is_effective(
  p_is_active BOOLEAN,
  p_from DATE,
  p_to DATE,
  p_on DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_is_active, FALSE)
    AND p_from <= p_on
    AND (p_to IS NULL OR p_to >= p_on);
$$;

-- Catalog for the signed-in approved partner company only.
CREATE OR REPLACE FUNCTION public.list_partner_tours()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  mem public.partner_members%ROWTYPE;
  result JSONB;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO mem
  FROM public.partner_members
  WHERE user_id = uid AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_partner');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(x)::jsonb ORDER BY x.tour_id), '[]'::jsonb)
  INTO result
  FROM (
    SELECT
      t.id AS tour_id,
      COALESCE(NULLIF(t.public_name, ''), t.name) AS title,
      t.duration_text,
      COALESCE(NULLIF(t.card_description, ''), NULLIF(t.tagline, ''), LEFT(COALESCE(t.description, ''), 180)) AS short_description,
      t.hero_image_url,
      t.seo_image,
      t.gallery,
      t.is_active,
      CASE
        WHEN t.is_active THEN 'available'
        ELSE 'unavailable'
      END AS availability_status,
      CASE
        WHEN pr.id IS NOT NULL THEN true
        ELSE false
      END AS has_partner_price,
      CASE
        WHEN pr.id IS NOT NULL THEN public._partner_resolve_net_price(
          t.adult_price, pr.pricing_type, pr.fixed_net_eur, pr.percent_off
        )
        ELSE NULL
      END AS partner_net_eur
    FROM public.tours t
    LEFT JOIN LATERAL (
      SELECT p.*
      FROM public.partner_tour_prices p
      WHERE p.partner_company_id = mem.partner_company_id
        AND p.tour_id = t.id
        AND public._partner_rate_is_effective(p.is_active, p.effective_from, p.effective_to, CURRENT_DATE)
      ORDER BY p.updated_at DESC
      LIMIT 1
    ) pr ON TRUE
    WHERE COALESCE(t.is_active, FALSE) = TRUE
      AND COALESCE(t.badge, '') NOT ILIKE '%internal%cert%'
      AND COALESCE(t.name, '') NOT ILIKE '%INTERNAL CERT%'
      AND COALESCE(t.public_name, '') NOT ILIKE '%INTERNAL CERT%'
  ) x;

  RETURN jsonb_build_object(
    'ok', true,
    'company_id', mem.partner_company_id,
    'tours', result
  );
END;
$$;

REVOKE ALL ON FUNCTION public.list_partner_tours() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_partner_tours() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_partner_tour_detail(p_tour_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  mem public.partner_members%ROWTYPE;
  t public.tours%ROWTYPE;
  pr public.partner_tour_prices%ROWTYPE;
  net NUMERIC;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF p_tour_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tour_id_required');
  END IF;

  SELECT * INTO mem
  FROM public.partner_members
  WHERE user_id = uid AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_partner');
  END IF;

  SELECT * INTO t FROM public.tours WHERE id = p_tour_id;
  IF NOT FOUND OR COALESCE(t.is_active, FALSE) = FALSE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tour_not_found');
  END IF;
  IF COALESCE(t.badge, '') ILIKE '%internal%cert%'
     OR COALESCE(t.name, '') ILIKE '%INTERNAL CERT%'
     OR COALESCE(t.public_name, '') ILIKE '%INTERNAL CERT%'
  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tour_not_found');
  END IF;

  SELECT * INTO pr
  FROM public.partner_tour_prices p
  WHERE p.partner_company_id = mem.partner_company_id
    AND p.tour_id = t.id
    AND public._partner_rate_is_effective(p.is_active, p.effective_from, p.effective_to, CURRENT_DATE)
  ORDER BY p.updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    net := public._partner_resolve_net_price(
      t.adult_price, pr.pricing_type, pr.fixed_net_eur, pr.percent_off
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'company_id', mem.partner_company_id,
    'tour', jsonb_build_object(
      'id', t.id,
      'title', COALESCE(NULLIF(t.public_name, ''), t.name),
      'duration_text', t.duration_text,
      'tagline', t.tagline,
      'card_description', t.card_description,
      'full_description', t.full_description,
      'description', t.description,
      'highlights', COALESCE(t.highlights, '[]'::jsonb),
      'included_items', COALESCE(t.included_items, '[]'::jsonb),
      'excluded_items', COALESCE(t.excluded_items, '[]'::jsonb),
      'what_to_expect', t.what_to_expect,
      'important_info', t.important_info,
      'pickup_info', t.pickup_info,
      'meeting_point', t.meeting_point,
      'group_size_text', t.group_size_text,
      'hero_image_url', t.hero_image_url,
      'seo_image', t.seo_image,
      'gallery', COALESCE(t.gallery, '[]'::jsonb),
      'is_active', t.is_active,
      'availability_status', CASE WHEN t.is_active THEN 'available' ELSE 'unavailable' END
    ),
    'pricing', CASE
      WHEN pr.id IS NULL THEN jsonb_build_object(
        'has_partner_price', false,
        'label', 'Contact Royal Nordic for pricing',
        'partner_net_eur', NULL
      )
      ELSE jsonb_build_object(
        'has_partner_price', true,
        'label', 'Partner net rate',
        'partner_net_eur', net,
        'currency', 'EUR'
      )
    END,
    'booking', jsonb_build_object(
      'enabled', false,
      'message', 'Bookings coming soon'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_partner_tour_detail(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_partner_tour_detail(INTEGER) TO authenticated;

-- Admin upsert with audit. Ignores client-supplied company elevation from partners (is_admin gate).
CREATE OR REPLACE FUNCTION public.admin_upsert_partner_tour_price(
  p_partner_company_id UUID,
  p_tour_id INTEGER,
  p_pricing_type TEXT,
  p_fixed_net_eur NUMERIC DEFAULT NULL,
  p_percent_off NUMERIC DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE,
  p_effective_from DATE DEFAULT CURRENT_DATE,
  p_effective_to DATE DEFAULT NULL,
  p_admin_note TEXT DEFAULT NULL,
  p_price_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  before_row public.partner_tour_prices%ROWTYPE;
  after_row public.partner_tour_prices%ROWTYPE;
  action_name TEXT;
BEGIN
  IF uid IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  IF p_partner_company_id IS NULL OR p_tour_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'company_and_tour_required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.partner_companies WHERE id = p_partner_company_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'company_not_found');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tours WHERE id = p_tour_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tour_not_found');
  END IF;

  IF p_pricing_type NOT IN ('fixed_net', 'percent_off_retail') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'pricing_type_invalid');
  END IF;

  IF p_price_id IS NOT NULL THEN
    SELECT * INTO before_row FROM public.partner_tour_prices WHERE id = p_price_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'price_not_found');
    END IF;
    IF before_row.partner_company_id <> p_partner_company_id OR before_row.tour_id <> p_tour_id THEN
      RETURN jsonb_build_object('ok', false, 'error', 'price_mismatch');
    END IF;

    UPDATE public.partner_tour_prices
    SET
      pricing_type = p_pricing_type,
      fixed_net_eur = CASE WHEN p_pricing_type = 'fixed_net' THEN p_fixed_net_eur ELSE NULL END,
      percent_off = CASE WHEN p_pricing_type = 'percent_off_retail' THEN p_percent_off ELSE NULL END,
      is_active = COALESCE(p_is_active, TRUE),
      effective_from = COALESCE(p_effective_from, CURRENT_DATE),
      effective_to = p_effective_to,
      admin_note = nullif(trim(coalesce(p_admin_note, '')), ''),
      updated_by = uid,
      updated_at = NOW()
    WHERE id = p_price_id
    RETURNING * INTO after_row;

    action_name := CASE
      WHEN before_row.is_active AND NOT after_row.is_active THEN 'deactivate'
      WHEN NOT before_row.is_active AND after_row.is_active THEN 'activate'
      ELSE 'update'
    END;
  ELSE
    -- Deactivate any other active row for same company+tour before insert
    UPDATE public.partner_tour_prices
    SET is_active = FALSE, updated_at = NOW(), updated_by = uid
    WHERE partner_company_id = p_partner_company_id
      AND tour_id = p_tour_id
      AND is_active = TRUE;

    INSERT INTO public.partner_tour_prices (
      partner_company_id, tour_id, pricing_type, fixed_net_eur, percent_off,
      is_active, effective_from, effective_to, admin_note, created_by, updated_by
    ) VALUES (
      p_partner_company_id,
      p_tour_id,
      p_pricing_type,
      CASE WHEN p_pricing_type = 'fixed_net' THEN p_fixed_net_eur ELSE NULL END,
      CASE WHEN p_pricing_type = 'percent_off_retail' THEN p_percent_off ELSE NULL END,
      COALESCE(p_is_active, TRUE),
      COALESCE(p_effective_from, CURRENT_DATE),
      p_effective_to,
      nullif(trim(coalesce(p_admin_note, '')), ''),
      uid,
      uid
    )
    RETURNING * INTO after_row;
    action_name := 'create';
  END IF;

  INSERT INTO public.partner_tour_price_audit (
    partner_tour_price_id, partner_company_id, tour_id, action, before_row, after_row, changed_by
  ) VALUES (
    after_row.id,
    after_row.partner_company_id,
    after_row.tour_id,
    action_name,
    CASE WHEN before_row.id IS NULL THEN NULL ELSE to_jsonb(before_row) END,
    to_jsonb(after_row),
    uid
  );

  RETURN jsonb_build_object('ok', true, 'action', action_name, 'price', to_jsonb(after_row));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_partner_tour_price(
  UUID, INTEGER, TEXT, NUMERIC, NUMERIC, BOOLEAN, DATE, DATE, TEXT, UUID
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_upsert_partner_tour_price(
  UUID, INTEGER, TEXT, NUMERIC, NUMERIC, BOOLEAN, DATE, DATE, TEXT, UUID
) TO authenticated;

COMMENT ON TABLE public.partner_tour_prices IS
  'B2B.5 company-specific partner net rates. No default discounts; unresolved rates require contact.';
