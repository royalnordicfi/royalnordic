-- B2B.8.1: Enrich partner booking list for dashboard (company-scoped only).
-- No retail/commission/admin-note fields. No lifecycle changes.

CREATE OR REPLACE FUNCTION public.list_my_partner_booking_requests()
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
  SELECT * INTO mem FROM public.partner_members
  WHERE user_id = uid AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_partner');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(x)::jsonb ORDER BY x.created_at DESC), '[]'::jsonb)
  INTO result
  FROM (
    SELECT
      r.id,
      r.reference,
      CASE
        WHEN r.status = 'confirmed' AND b.id IS NOT NULL
          THEN COALESCE(NULLIF(b.booking_ref, ''), 'RN-' || b.id::text)
        ELSE NULL
      END AS booking_ref,
      r.tour_id,
      COALESCE(NULLIF(t.public_name, ''), t.name) AS tour_title,
      r.tour_date,
      NULLIF(
        COALESCE(NULLIF(b.tour_time, ''), NULLIF(t.departure_time, '')),
        ''
      ) AS departure_time,
      r.adults,
      r.children,
      r.passenger_count,
      r.guest_name,
      r.pickup_location,
      r.unit_net_eur,
      r.total_net_eur,
      r.currency,
      r.status,
      r.booking_id,
      r.created_at,
      r.reviewed_at
    FROM public.partner_booking_requests r
    JOIN public.tours t ON t.id = r.tour_id
    LEFT JOIN public.bookings b
      ON b.id = r.booking_id
     AND r.status = 'confirmed'
    WHERE r.partner_company_id = mem.partner_company_id
  ) x;

  RETURN jsonb_build_object('ok', true, 'company_id', mem.partner_company_id, 'requests', result);
END;
$$;

REVOKE ALL ON FUNCTION public.list_my_partner_booking_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_partner_booking_requests() TO authenticated;

COMMENT ON FUNCTION public.list_my_partner_booking_requests() IS
  'B2B.8.1 partner booking list. Company-scoped; partner net only; no retail/commission/admin notes.';
