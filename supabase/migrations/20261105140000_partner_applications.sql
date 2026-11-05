-- B2B.2: Partner applications, companies, memberships.
-- Public cannot self-assign partner_status. Approval is admin + service role only.

CREATE TABLE IF NOT EXISTS public.partner_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_id TEXT,
  country TEXT NOT NULL,
  business_type TEXT NOT NULL
    CHECK (business_type IN ('dmc', 'travel_agency', 'hotel', 'concierge', 'other')),
  website TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  business_id TEXT NOT NULL,
  country TEXT NOT NULL,
  business_type TEXT NOT NULL
    CHECK (business_type IN ('dmc', 'travel_agency', 'hotel', 'concierge', 'other')),
  contact_name TEXT NOT NULL,
  business_email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined')),
  applicant_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  partner_company_id UUID REFERENCES public.partner_companies (id) ON DELETE SET NULL,
  admin_note TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  invitation_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT partner_applications_email_format
    CHECK (business_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_applications_pending_email_uidx
  ON public.partner_applications (lower(business_email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS partner_applications_status_created_idx
  ON public.partner_applications (status, created_at DESC);

CREATE INDEX IF NOT EXISTS partner_applications_applicant_idx
  ON public.partner_applications (applicant_user_id);

CREATE TABLE IF NOT EXISTS public.partner_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  partner_company_id UUID NOT NULL REFERENCES public.partner_companies (id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.partner_applications (id) ON DELETE SET NULL,
  member_role TEXT NOT NULL DEFAULT 'owner'
    CHECK (member_role IN ('owner', 'member')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT partner_members_user_active_uidx UNIQUE (user_id, partner_company_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_members_one_active_company_uidx
  ON public.partner_members (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS partner_members_company_idx
  ON public.partner_members (partner_company_id)
  WHERE status = 'active';

ALTER TABLE public.partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_members ENABLE ROW LEVEL SECURITY;

-- Companies: members see own company; admins see all
DROP POLICY IF EXISTS partner_companies_admin_all ON public.partner_companies;
CREATE POLICY partner_companies_admin_all
  ON public.partner_companies FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS partner_companies_member_select ON public.partner_companies;
CREATE POLICY partner_companies_member_select
  ON public.partner_companies FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_members m
      WHERE m.partner_company_id = partner_companies.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Applications: applicant can read own rows; admins all; no public insert via table (RPC only)
DROP POLICY IF EXISTS partner_applications_admin_all ON public.partner_applications;
CREATE POLICY partner_applications_admin_all
  ON public.partner_applications FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS partner_applications_applicant_select ON public.partner_applications;
CREATE POLICY partner_applications_applicant_select
  ON public.partner_applications FOR SELECT TO authenticated
  USING (
    applicant_user_id = auth.uid()
    OR lower(business_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Members: own membership rows; admins all
DROP POLICY IF EXISTS partner_members_admin_all ON public.partner_members;
CREATE POLICY partner_members_admin_all
  ON public.partner_members FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS partner_members_self_select ON public.partner_members;
CREATE POLICY partner_members_self_select
  ON public.partner_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Server-side access check (DB truth, not JWT alone).
CREATE OR REPLACE FUNCTION public.get_my_partner_access()
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
  app public.partner_applications%ROWTYPE;
  email TEXT := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'access', 'none', 'authenticated', false);
  END IF;

  SELECT * INTO mem
  FROM public.partner_members
  WHERE user_id = uid AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    SELECT * INTO co FROM public.partner_companies WHERE id = mem.partner_company_id;
    RETURN jsonb_build_object(
      'ok', true,
      'access', 'approved',
      'authenticated', true,
      'company_id', mem.partner_company_id,
      'company_name', co.name,
      'member_role', mem.member_role,
      'member_id', mem.id
    );
  END IF;

  SELECT * INTO app
  FROM public.partner_applications
  WHERE status = 'pending'
    AND (
      applicant_user_id = uid
      OR lower(business_email) = email
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'access', 'pending',
      'authenticated', true,
      'application_id', app.id,
      'company_name', app.company_name,
      'submitted_at', app.created_at
    );
  END IF;

  SELECT * INTO app
  FROM public.partner_applications
  WHERE status = 'declined'
    AND (
      applicant_user_id = uid
      OR lower(business_email) = email
    )
  ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'access', 'declined',
      'authenticated', true,
      'application_id', app.id,
      'company_name', app.company_name,
      'reviewed_at', app.reviewed_at
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'access', 'none', 'authenticated', true);
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_partner_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_partner_access() TO authenticated;

-- Public/authenticated application submit — never accepts status/role fields.
CREATE OR REPLACE FUNCTION public.submit_partner_application(
  p_company_name TEXT,
  p_business_id TEXT,
  p_country TEXT,
  p_business_type TEXT,
  p_contact_name TEXT,
  p_business_email TEXT,
  p_description TEXT,
  p_website TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  btype TEXT;
  existing UUID;
  new_id UUID;
  uid UUID := auth.uid();
BEGIN
  v_email := lower(trim(coalesce(p_business_email, '')));
  btype := lower(trim(coalesce(p_business_type, '')));

  IF length(trim(coalesce(p_company_name, ''))) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'company_name_required');
  END IF;
  IF length(trim(coalesce(p_business_id, ''))) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'business_id_required');
  END IF;
  IF length(trim(coalesce(p_country, ''))) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'country_required');
  END IF;
  IF btype NOT IN ('dmc', 'travel_agency', 'hotel', 'concierge', 'other') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'business_type_invalid');
  END IF;
  IF length(trim(coalesce(p_contact_name, ''))) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'contact_name_required');
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email_invalid');
  END IF;
  IF length(trim(coalesce(p_description, ''))) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'description_required');
  END IF;
  IF p_website IS NOT NULL AND length(trim(p_website)) > 0
     AND trim(p_website) !~* '^https?://'
  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'website_invalid');
  END IF;

  SELECT id INTO existing
  FROM public.partner_applications
  WHERE status = 'pending' AND lower(business_email) = v_email
  LIMIT 1;

  IF existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'duplicate_pending',
      'application_id', existing
    );
  END IF;

  -- Block re-apply while already an active partner on this email/user
  IF EXISTS (
    SELECT 1 FROM public.partner_members m
    JOIN auth.users u ON u.id = m.user_id
    WHERE m.status = 'active'
      AND (
        m.user_id = uid
        OR lower(u.email) = v_email
      )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_partner');
  END IF;

  INSERT INTO public.partner_applications (
    company_name, business_id, country, business_type,
    contact_name, business_email, phone, website, description,
    status, applicant_user_id
  ) VALUES (
    trim(p_company_name),
    trim(p_business_id),
    trim(p_country),
    btype,
    trim(p_contact_name),
    v_email,
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_website, '')), ''),
    trim(p_description),
    'pending',
    uid
  )
  RETURNING id INTO new_id;

  RETURN jsonb_build_object(
    'ok', true,
    'application_id', new_id,
    'status', 'pending'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_partner_application(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_partner_application(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

COMMENT ON TABLE public.partner_applications IS
  'B2B partner applications. Status changes only via admin edge functions.';
COMMENT ON TABLE public.partner_members IS
  'Active partner membership is the DB source of truth for partner access.';
