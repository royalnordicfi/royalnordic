-- B2B.4: Partner company profile fields + contact-update RPC.
-- Legal identity (name, business_id, country, business_type) remains admin-controlled.

ALTER TABLE public.partner_companies
  ADD COLUMN IF NOT EXISTS vat_id TEXT,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Backfill contact fields from linked applications where empty.
UPDATE public.partner_companies c
SET
  contact_name = COALESCE(c.contact_name, a.contact_name),
  contact_email = COALESCE(c.contact_email, a.business_email),
  contact_phone = COALESCE(c.contact_phone, a.phone),
  updated_at = NOW()
FROM public.partner_applications a
WHERE a.partner_company_id = c.id
  AND a.status = 'approved'
  AND (
    c.contact_name IS NULL
    OR c.contact_email IS NULL
    OR c.contact_phone IS NULL
  );

CREATE OR REPLACE FUNCTION public.is_active_partner_member(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.partner_members m
    WHERE m.partner_company_id = p_company_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_partner_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_partner_member(UUID) TO authenticated;

-- Members may UPDATE only via RPC below (no broad UPDATE policy on identity columns).
-- Keep SELECT for own company; admins retain FOR ALL.

CREATE OR REPLACE FUNCTION public.update_my_partner_company_contact(
  p_contact_name TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_address_line1 TEXT DEFAULT NULL,
  p_address_line2 TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_vat_id TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  mem public.partner_members%ROWTYPE;
  co public.partner_companies%ROWTYPE;
  v_email TEXT;
  v_website TEXT;
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

  SELECT * INTO co FROM public.partner_companies WHERE id = mem.partner_company_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'company_not_found');
  END IF;

  v_email := CASE
    WHEN p_contact_email IS NULL THEN co.contact_email
    ELSE lower(trim(p_contact_email))
  END;

  IF v_email IS NOT NULL AND length(v_email) > 0
     AND v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email_invalid');
  END IF;

  v_website := CASE
    WHEN p_website IS NULL THEN co.website
    WHEN length(trim(p_website)) = 0 THEN NULL
    ELSE trim(p_website)
  END;
  IF v_website IS NOT NULL AND v_website !~* '^https?://' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'website_invalid');
  END IF;

  UPDATE public.partner_companies
  SET
    contact_name = CASE
      WHEN p_contact_name IS NULL THEN contact_name
      ELSE nullif(trim(p_contact_name), '')
    END,
    contact_email = nullif(v_email, ''),
    contact_phone = CASE
      WHEN p_contact_phone IS NULL THEN contact_phone
      ELSE nullif(trim(p_contact_phone), '')
    END,
    address_line1 = CASE
      WHEN p_address_line1 IS NULL THEN address_line1
      ELSE nullif(trim(p_address_line1), '')
    END,
    address_line2 = CASE
      WHEN p_address_line2 IS NULL THEN address_line2
      ELSE nullif(trim(p_address_line2), '')
    END,
    city = CASE
      WHEN p_city IS NULL THEN city
      ELSE nullif(trim(p_city), '')
    END,
    postal_code = CASE
      WHEN p_postal_code IS NULL THEN postal_code
      ELSE nullif(trim(p_postal_code), '')
    END,
    vat_id = CASE
      WHEN p_vat_id IS NULL THEN vat_id
      ELSE nullif(trim(p_vat_id), '')
    END,
    website = v_website,
    updated_at = NOW()
  WHERE id = mem.partner_company_id
  RETURNING * INTO co;

  RETURN jsonb_build_object(
    'ok', true,
    'company', jsonb_build_object(
      'id', co.id,
      'name', co.name,
      'business_id', co.business_id,
      'vat_id', co.vat_id,
      'country', co.country,
      'business_type', co.business_type,
      'website', co.website,
      'address_line1', co.address_line1,
      'address_line2', co.address_line2,
      'city', co.city,
      'postal_code', co.postal_code,
      'contact_name', co.contact_name,
      'contact_email', co.contact_email,
      'contact_phone', co.contact_phone,
      'updated_at', co.updated_at
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_partner_company_contact(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_partner_company_contact(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_partner_company()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  mem public.partner_members%ROWTYPE;
  co public.partner_companies%ROWTYPE;
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
    RETURN jsonb_build_object('ok', false, 'error', 'not_partner', 'access', 'none');
  END IF;

  SELECT * INTO co FROM public.partner_companies WHERE id = mem.partner_company_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'company_not_found');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'access', 'approved',
    'member_role', mem.member_role,
    'member_status', mem.status,
    'member_id', mem.id,
    'company', jsonb_build_object(
      'id', co.id,
      'name', co.name,
      'business_id', co.business_id,
      'vat_id', co.vat_id,
      'country', co.country,
      'business_type', co.business_type,
      'website', co.website,
      'description', co.description,
      'address_line1', co.address_line1,
      'address_line2', co.address_line2,
      'city', co.city,
      'postal_code', co.postal_code,
      'contact_name', co.contact_name,
      'contact_email', co.contact_email,
      'contact_phone', co.contact_phone,
      'created_at', co.created_at,
      'updated_at', co.updated_at
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_partner_company() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_partner_company() TO authenticated;

COMMENT ON FUNCTION public.update_my_partner_company_contact IS
  'B2B.4: Active partners may update contact/address/vat/website only — not legal company identity.';
