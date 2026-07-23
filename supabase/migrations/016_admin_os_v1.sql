-- Royal Nordic Admin OS V1
-- Extends existing bookings/tours; adds guides, vehicles, customers, booking_events.
-- Requires is_admin() from migration 015.
-- Idempotent: safe to re-run after a partial/failed attempt.

-- ---------- TOURS (products) ----------
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS public_name TEXT,
  ADD COLUMN IF NOT EXISTS duration_text TEXT,
  ADD COLUMN IF NOT EXISTS inclusions TEXT,
  ADD COLUMN IF NOT EXISTS operational_notes TEXT,
  ADD COLUMN IF NOT EXISTS platform_availability TEXT,
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2);

UPDATE public.tours SET public_name = name WHERE public_name IS NULL;

-- ---------- GUIDES / VEHICLES ----------
CREATE TABLE IF NOT EXISTS public.guides (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  availability_status TEXT NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available', 'busy', 'off')),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  registration_number TEXT,
  passenger_capacity INTEGER NOT NULL DEFAULT 8 CHECK (passenger_capacity > 0),
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'in_use', 'maintenance')),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- BOOKINGS ops columns ----------
-- Ensure crypto columns exist (migration 002 may never have been applied)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'card';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS crypto_type TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_ref TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'direct_website';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS pickup_location TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS tour_time TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guide_id BIGINT REFERENCES public.guides(id) ON DELETE SET NULL;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS vehicle_id BIGINT REFERENCES public.vehicles(id) ON DELETE SET NULL;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Expand booking status values
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'cancelled', 'pending_crypto_payment', 'completed'
  ));

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN (
    'unpaid', 'paid', 'partial', 'refunded', 'pending_crypto'
  ));

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_source_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_source_check
  CHECK (source IN (
    'direct_website', 'getyourguide', 'airbnb', 'viator', 'manual', 'other'
  ));

UPDATE public.bookings
SET booking_ref = 'RN-' || id::text
WHERE booking_ref IS NULL;

-- Backfill payment_status from booking status (no payment_type dependency)
UPDATE public.bookings
SET payment_status = CASE
  WHEN status = 'confirmed' THEN 'paid'
  WHEN status = 'pending_crypto_payment' THEN 'pending_crypto'
  ELSE payment_status
END
WHERE payment_status = 'unpaid' OR payment_status IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_booking_ref ON public.bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON public.bookings(source);
CREATE INDEX IF NOT EXISTS idx_bookings_guide_id ON public.bookings(guide_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_date_id ON public.bookings(tour_date_id);

-- ---------- CUSTOMERS ----------
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON public.customers (lower(email));

-- ---------- BOOKING EVENTS (timeline / status history) ----------
CREATE TABLE IF NOT EXISTS public.booking_events (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_value TEXT,
  to_value TEXT,
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON public.booking_events(booking_id);

-- ---------- RLS ----------
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guides_admin_all" ON public.guides;
CREATE POLICY "guides_admin_all" ON public.guides
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "vehicles_admin_all" ON public.vehicles;
CREATE POLICY "vehicles_admin_all" ON public.vehicles
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "customers_admin_all" ON public.customers;
CREATE POLICY "customers_admin_all" ON public.customers
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "booking_events_admin_all" ON public.booking_events;
CREATE POLICY "booking_events_admin_all" ON public.booking_events
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed public_name for known tours without inventing new products
UPDATE public.tours SET
  public_name = CASE name
    WHEN 'Northern Lights Tour' THEN 'Guaranteed Northern Lights & Photography Tour'
    WHEN 'Ranua Zoo Tour' THEN 'Ranua Zoo'
    WHEN 'Ice Fishing Tour' THEN 'Ice Fishing'
    ELSE coalesce(public_name, name)
  END,
  duration_text = coalesce(duration_text, CASE name
    WHEN 'Northern Lights Tour' THEN '1–10 hours'
    WHEN 'Snowshoe Adventure' THEN '4 hours'
    WHEN 'Ice Fishing Tour' THEN '3–4 hours'
    WHEN 'Ranua Zoo Tour' THEN 'Full day'
    WHEN 'Korouoma Canyon Tour' THEN '7 hours'
    ELSE NULL
  END)
WHERE true;
