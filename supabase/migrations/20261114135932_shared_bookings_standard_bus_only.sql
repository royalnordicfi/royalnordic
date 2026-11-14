-- Shared Bookings 1.6H — Standard Group Northern Lights shared bus only.
-- Seeds the single shared_bus template (20:00 / 50), links matching departures,
-- ensures RN + Elias access, and restricts GYG mappings to that template.
-- Does NOT invent GYG product/option IDs. Does NOT touch Guaranteed / other tours.
-- Does NOT enable ingestion or notify flags.

CREATE OR REPLACE FUNCTION public.shared_bookings_is_standard_bus_title(p_title TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    coalesce(p_title, '') ~* 'standard[[:space:]]+group'
    AND coalesce(p_title, '') !~* 'guaranteed'
    AND coalesce(p_title, '') !~* 'small[[:space:]]+group'
    AND coalesce(p_title, '') !~* 'korouoma'
    AND coalesce(p_title, '') !~* 'private';
$$;

COMMENT ON FUNCTION public.shared_bookings_is_standard_bus_title(TEXT) IS
  'True only for Standard Group Northern Lights shared-bus titles (excludes Guaranteed/small/private/Korouoma).';

-- 1) Seed the exclusive Standard Bus template (idempotent by code).
INSERT INTO public.shared_tour_templates (
  code,
  title,
  category,
  meeting_point,
  default_capacity,
  default_departure_time,
  is_active
)
VALUES (
  'standard_group_northern_lights',
  'Standard Group Northern Lights',
  'shared_bus',
  'Ruokasenkatu 3, 96100 Rovaniemi, Finland',
  50,
  '20:00',
  true
)
ON CONFLICT (code) DO UPDATE
SET
  title = EXCLUDED.title,
  category = 'shared_bus',
  meeting_point = EXCLUDED.meeting_point,
  default_capacity = 50,
  default_departure_time = '20:00',
  is_active = true,
  updated_at = now();

-- 2) Link existing Standard Group departures to the template.
--    Do not modify Guaranteed / other departures or any booking rows.
WITH tpl AS (
  SELECT id
  FROM public.shared_tour_templates
  WHERE code = 'standard_group_northern_lights'
  LIMIT 1
)
UPDATE public.shared_departures d
SET
  template_id = tpl.id,
  tour_code = 'standard_group_northern_lights',
  tour_title = CASE
    WHEN public.shared_bookings_is_standard_bus_title(d.tour_title) THEN d.tour_title
    ELSE 'Standard Group Northern Lights'
  END,
  departure_time = coalesce(nullif(trim(d.departure_time), ''), '20:00'),
  capacity = 50,
  board = 'shared_bus',
  updated_at = now()
FROM tpl
WHERE d.status = 'active'
  AND (
    d.tour_code = 'standard_group_northern_lights'
    OR public.shared_bookings_is_standard_bus_title(d.tour_title)
  );

-- 3) Ensure Royal Nordic + Elias share access on Standard Bus departures.
INSERT INTO public.shared_departure_access (departure_id, supplier_id)
SELECT d.id, s.id
FROM public.shared_departures d
CROSS JOIN public.shared_suppliers s
WHERE d.template_id = (
    SELECT id FROM public.shared_tour_templates WHERE code = 'standard_group_northern_lights' LIMIT 1
  )
  AND d.status = 'active'
  AND s.code IN ('royal_nordic', 'elias')
  AND s.is_active = true
ON CONFLICT DO NOTHING;

-- 4) Deactivate any non-Standard-Bus GYG mappings (safety; should be none).
UPDATE public.shared_product_mappings m
SET is_active = false, updated_at = now()
WHERE m.provider = 'getyourguide'
  AND m.is_active = true
  AND (
    m.template_id IS NULL
    OR m.template_id <> (
      SELECT id FROM public.shared_tour_templates WHERE code = 'standard_group_northern_lights' LIMIT 1
    )
  );

-- 5) Restrict future GYG mapping upserts to Standard Bus template + RN supplier + 20:00.
CREATE OR REPLACE FUNCTION public.admin_upsert_shared_product_mapping(
  p_id UUID DEFAULT NULL,
  p_provider TEXT DEFAULT NULL,
  p_external_product_id TEXT DEFAULT NULL,
  p_external_option_id TEXT DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_default_departure_time TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.shared_product_mappings%ROWTYPE;
  v_tpl_id UUID;
  v_rn_id UUID;
  v_time TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF p_provider IS NULL OR p_provider NOT IN ('getyourguide', 'bokun') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_provider');
  END IF;
  IF nullif(trim(coalesce(p_external_product_id, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'external_product_id_required');
  END IF;
  IF p_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'supplier_required');
  END IF;

  IF p_provider = 'getyourguide' THEN
    SELECT id INTO v_tpl_id
    FROM public.shared_tour_templates
    WHERE code = 'standard_group_northern_lights' AND is_active = true
    LIMIT 1;
    IF v_tpl_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'standard_bus_template_missing');
    END IF;
    IF p_template_id IS DISTINCT FROM v_tpl_id THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'gyg_standard_bus_only',
        'error_message', 'GetYourGuide mappings are limited to Standard Group Northern Lights shared bus'
      );
    END IF;

    SELECT id INTO v_rn_id
    FROM public.shared_suppliers
    WHERE code = 'royal_nordic' AND is_active = true
    LIMIT 1;
    IF v_rn_id IS NULL OR p_supplier_id IS DISTINCT FROM v_rn_id THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'gyg_royal_nordic_only',
        'error_message', 'GetYourGuide mappings must use the Royal Nordic supplier'
      );
    END IF;

    v_time := coalesce(nullif(trim(coalesce(p_default_departure_time, '')), ''), '20:00');
    IF v_time <> '20:00' THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'gyg_departure_time_invalid',
        'error_message', 'Standard Bus GetYourGuide mappings must use departure time 20:00'
      );
    END IF;
  ELSE
    v_time := nullif(trim(coalesce(p_default_departure_time, '')), '');
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.shared_product_mappings (
      provider, external_product_id, external_option_id, template_id, supplier_id,
      default_departure_time, is_active
    ) VALUES (
      p_provider,
      trim(p_external_product_id),
      nullif(trim(coalesce(p_external_option_id, '')), ''),
      p_template_id,
      p_supplier_id,
      v_time,
      -- Never auto-activate GYG mappings; require explicit verified activation later.
      CASE WHEN p_provider = 'getyourguide' THEN false ELSE coalesce(p_is_active, true) END
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.shared_product_mappings
    SET
      provider = p_provider,
      external_product_id = trim(p_external_product_id),
      external_option_id = nullif(trim(coalesce(p_external_option_id, '')), ''),
      template_id = p_template_id,
      supplier_id = p_supplier_id,
      default_departure_time = v_time,
      -- Activation remains an explicit admin action after product/option IDs are verified.
      is_active = coalesce(p_is_active, is_active),
      updated_at = now()
    WHERE id = p_id
    RETURNING * INTO v_row;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_found');
    END IF;
  END IF;

  UPDATE public.shared_integration_connectors
  SET
    notes = CASE
      WHEN p_provider = 'getyourguide' THEN
        'GYG Supplier API for Standard Group Northern Lights shared bus only (20:00 / 50). Secrets: SHARED_BOOKINGS_GYG_BASIC_USER/PASSWORD + notify pair. Keep ingestion/notify OFF until approved. Do not map Guaranteed/Korouoma/other products.'
      ELSE notes
    END,
    config_status = CASE
      WHEN EXISTS (
        SELECT 1 FROM public.shared_product_mappings m
        WHERE m.provider = p_provider AND m.is_active = true
      ) THEN
        CASE WHEN config_status = 'credentials_required' THEN 'mappings_required' ELSE config_status END
      ELSE config_status
    END,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE provider = p_provider;

  RETURN jsonb_build_object('ok', true, 'mapping_id', v_row.id, 'is_active', v_row.is_active);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'mapping_exists');
END;
$$;

-- 6) Connector notes even before any mapping upsert.
UPDATE public.shared_integration_connectors
SET
  notes = 'GYG Supplier API for Standard Group Northern Lights shared bus only (20:00 / 50). Secrets: SHARED_BOOKINGS_GYG_BASIC_USER/PASSWORD + notify pair. Keep ingestion/notify OFF until approved. Do not map Guaranteed/Korouoma/other products.',
  updated_at = now()
WHERE provider = 'getyourguide';
