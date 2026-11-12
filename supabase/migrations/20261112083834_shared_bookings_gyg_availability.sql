-- Shared Bookings 1.6A — GYG availability lookup (service role).
-- Remaining seats = capacity − confirmed − pending holds (holds arrive in 1.6B).

CREATE OR REPLACE FUNCTION public.service_list_gyg_availabilities(
  p_product_id TEXT,
  p_from DATE,
  p_to DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_map public.shared_product_mappings%ROWTYPE;
  v_tpl_code TEXT;
  v_rows JSONB;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF nullif(trim(coalesce(p_product_id, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'product_id_required');
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_date_range');
  END IF;

  SELECT * INTO v_map
  FROM public.shared_product_mappings m
  WHERE m.provider = 'getyourguide'
    AND m.is_active = true
    AND m.external_product_id = trim(p_product_id)
  ORDER BY CASE WHEN m.external_option_id IS NULL THEN 1 ELSE 0 END
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'product_id', trim(p_product_id),
      'mapping_found', false,
      'departures', '[]'::jsonb
    );
  END IF;

  SELECT t.code INTO v_tpl_code
  FROM public.shared_tour_templates t
  WHERE t.id = v_map.template_id;

  SELECT coalesce(jsonb_agg(row_data ORDER BY (row_data->>'departure_date'), (row_data->>'departure_time')), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT jsonb_build_object(
      'departure_id', d.id,
      'departure_date', d.departure_date,
      'departure_time', d.departure_time,
      'capacity', d.capacity,
      'confirmed_passengers', coalesce(occ.confirmed_passengers, 0),
      -- Pending rows reserved for 1.6B seat holds; currently usually 0.
      'held_passengers', coalesce(occ.held_passengers, 0),
      'available_seats', greatest(
        d.capacity - coalesce(occ.confirmed_passengers, 0) - coalesce(occ.held_passengers, 0),
        0
      ),
      'template_id', d.template_id,
      'tour_code', d.tour_code
    ) AS row_data
    FROM public.shared_departures d
    LEFT JOIN LATERAL (
      SELECT
        coalesce(sum(b.passenger_count) FILTER (WHERE b.status = 'confirmed'), 0)::int AS confirmed_passengers,
        coalesce(sum(b.passenger_count) FILTER (WHERE b.status = 'pending'), 0)::int AS held_passengers
      FROM public.shared_departure_bookings b
      WHERE b.departure_id = d.id
    ) occ ON true
    WHERE d.status = 'active'
      AND d.departure_date >= p_from
      AND d.departure_date <= p_to
      AND (
        (v_map.template_id IS NOT NULL AND d.template_id = v_map.template_id)
        OR (v_tpl_code IS NOT NULL AND d.tour_code = v_tpl_code)
      )
  ) q;

  RETURN jsonb_build_object(
    'ok', true,
    'product_id', trim(p_product_id),
    'mapping_found', true,
    'mapping_id', v_map.id,
    'template_id', v_map.template_id,
    'default_departure_time', v_map.default_departure_time,
    'departures', v_rows
  );
END;
$$;

REVOKE ALL ON FUNCTION public.service_list_gyg_availabilities(TEXT, DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_list_gyg_availabilities(TEXT, DATE, DATE) TO service_role;
