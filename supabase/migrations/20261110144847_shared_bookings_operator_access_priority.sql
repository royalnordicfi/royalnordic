-- Shared Bookings: prefer active operator membership over admin allowlist.
-- Provisioned operators (including allowlisted RN emails used for testing) must
-- receive access='supplier' with must_change_password, never be shadowed into
-- access='admin' / access='none'.

CREATE OR REPLACE FUNCTION public.get_shared_bookings_access()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier UUID;
  v_code TEXT;
  v_name TEXT;
  v_must_change BOOLEAN;
  v_operator_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated', 'access', 'none');
  END IF;

  -- Operator row wins. Admins without an operator row still get admin below.
  SELECT o.id, o.supplier_id, s.code, s.display_name, o.must_change_password
  INTO v_operator_id, v_supplier, v_code, v_name, v_must_change
  FROM public.shared_booking_operators o
  JOIN public.shared_suppliers s ON s.id = o.supplier_id
  WHERE o.user_id = auth.uid()
    AND o.is_active = true
    AND s.is_active = true
  LIMIT 1;

  IF v_supplier IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'access', 'supplier',
      'boards', jsonb_build_array('shared_bus'),
      'supplier_id', v_supplier,
      'supplier_code', v_code,
      'supplier_name', v_name,
      'operator_id', v_operator_id,
      'must_change_password', coalesce(v_must_change, false),
      'channels_synced', false
    );
  END IF;

  IF public.is_admin() THEN
    RETURN jsonb_build_object(
      'ok', true,
      'access', 'admin',
      'boards', jsonb_build_array('shared_bus', 'my_tours'),
      'supplier_code', 'royal_nordic',
      'supplier_name', 'Royal Nordic',
      'must_change_password', false,
      'channels_synced', false
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'access', 'none',
    'boards', '[]'::jsonb,
    'must_change_password', false,
    'channels_synced', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_bookings_access() TO authenticated;
