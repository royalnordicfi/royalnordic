-- Secure admin access for admin.royalnordic.fi
-- Admin = Supabase Auth user with app_metadata.role = 'admin'
--        OR email listed in admin_allowlist.

CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.admin_allowlist (email)
VALUES
  ('admin@royalnordic.fi'),
  ('contact@royalnordic.fi'),
  ('mirov.vesterinen@gmail.com')
ON CONFLICT (email) DO NOTHING;

ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read own allowlist row" ON public.admin_allowlist;
CREATE POLICY "Admins can read own allowlist row"
  ON public.admin_allowlist
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR EXISTS (
      SELECT 1
      FROM public.admin_allowlist a
      WHERE a.is_active = true
        AND lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- BOOKINGS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow anon insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow anon update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow anon delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow admin update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow admin delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_public_insert" ON public.bookings;
DROP POLICY IF EXISTS "bookings_admin_select" ON public.bookings;
DROP POLICY IF EXISTS "bookings_admin_update" ON public.bookings;
DROP POLICY IF EXISTS "bookings_admin_delete" ON public.bookings;

CREATE POLICY "bookings_public_insert"
  ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "bookings_admin_select"
  ON public.bookings FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "bookings_admin_update"
  ON public.bookings FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "bookings_admin_delete"
  ON public.bookings FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.create_public_booking(
  p_tour_id bigint,
  p_tour_date_id bigint,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_adults integer,
  p_children integer,
  p_total_price numeric,
  p_stripe_payment_intent_id text,
  p_special_requests text DEFAULT NULL
)
RETURNS TABLE (id bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available integer;
  v_booked integer;
  v_requested integer;
  v_id bigint;
BEGIN
  SELECT available_slots, total_booked
    INTO v_available, v_booked
  FROM tour_dates
  WHERE tour_dates.id = p_tour_date_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Date not found';
  END IF;

  v_requested := coalesce(p_adults, 0) + coalesce(p_children, 0);
  IF v_requested > (v_available - v_booked) THEN
    RAISE EXCEPTION 'Only % slots available', (v_available - v_booked);
  END IF;

  INSERT INTO bookings (
    tour_id, tour_date_id, customer_name, customer_email, customer_phone,
    adults, children, total_price, stripe_payment_intent_id, status, special_requests
  ) VALUES (
    p_tour_id, p_tour_date_id, p_customer_name, p_customer_email, p_customer_phone,
    p_adults, p_children, p_total_price, p_stripe_payment_intent_id, 'confirmed', p_special_requests
  )
  RETURNING bookings.id INTO v_id;

  RETURN QUERY SELECT v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_booking(
  bigint, bigint, text, text, text, integer, integer, numeric, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_booking(
  bigint, bigint, text, text, text, integer, integer, numeric, text, text
) TO anon, authenticated;

-- TOUR_DATES
ALTER TABLE public.tour_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select tour_dates" ON public.tour_dates;
DROP POLICY IF EXISTS "Allow anon insert tour_dates" ON public.tour_dates;
DROP POLICY IF EXISTS "Allow anon update tour_dates" ON public.tour_dates;
DROP POLICY IF EXISTS "Allow anon delete tour_dates" ON public.tour_dates;
DROP POLICY IF EXISTS "Allow read tour_dates" ON public.tour_dates;
DROP POLICY IF EXISTS "Allow admin update tour_dates" ON public.tour_dates;
DROP POLICY IF EXISTS "Tour dates are viewable by everyone" ON public.tour_dates;
DROP POLICY IF EXISTS "tour_dates_public_select" ON public.tour_dates;
DROP POLICY IF EXISTS "tour_dates_admin_insert" ON public.tour_dates;
DROP POLICY IF EXISTS "tour_dates_admin_update" ON public.tour_dates;
DROP POLICY IF EXISTS "tour_dates_admin_delete" ON public.tour_dates;

CREATE POLICY "tour_dates_public_select"
  ON public.tour_dates FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "tour_dates_admin_insert"
  ON public.tour_dates FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "tour_dates_admin_update"
  ON public.tour_dates FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "tour_dates_admin_delete"
  ON public.tour_dates FOR DELETE TO authenticated USING (public.is_admin());

-- TOURS
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select tours" ON public.tours;
DROP POLICY IF EXISTS "Allow anon insert tours" ON public.tours;
DROP POLICY IF EXISTS "Allow anon update tours" ON public.tours;
DROP POLICY IF EXISTS "Allow anon delete tours" ON public.tours;
DROP POLICY IF EXISTS "Allow read tours" ON public.tours;
DROP POLICY IF EXISTS "Allow admin update tours" ON public.tours;
DROP POLICY IF EXISTS "Tours are viewable by everyone" ON public.tours;
DROP POLICY IF EXISTS "tours_public_select" ON public.tours;
DROP POLICY IF EXISTS "tours_admin_insert" ON public.tours;
DROP POLICY IF EXISTS "tours_admin_update" ON public.tours;
DROP POLICY IF EXISTS "tours_admin_delete" ON public.tours;

CREATE POLICY "tours_public_select"
  ON public.tours FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "tours_admin_insert"
  ON public.tours FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "tours_admin_update"
  ON public.tours FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "tours_admin_delete"
  ON public.tours FOR DELETE TO authenticated USING (public.is_admin());

-- Lock legacy admin_users password table
DO $$
BEGIN
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Allow read admin_users" ON public.admin_users';
    EXECUTE 'DROP POLICY IF EXISTS "Admin users are viewable by admins only" ON public.admin_users';
    EXECUTE 'DROP POLICY IF EXISTS "admin_users_admin_select" ON public.admin_users';
    EXECUTE $p$
      CREATE POLICY "admin_users_admin_select"
        ON public.admin_users FOR SELECT TO authenticated USING (public.is_admin())
    $p$;
  END IF;
END $$;
