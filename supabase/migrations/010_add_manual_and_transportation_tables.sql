-- Add manual bookings and transportation requests tables

-- Manual bookings table captures admin-created reservations (phone/email confirmations)
CREATE TABLE IF NOT EXISTS manual_bookings (
    id BIGSERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    tour_name TEXT NOT NULL,
    tour_date DATE,
    pickup_time TEXT,
    pickup_place TEXT,
    adults INTEGER DEFAULT 0,
    children INTEGER DEFAULT 0,
    total_price DECIMAL(10,2) DEFAULT 0,
    special_requests TEXT,
    status TEXT DEFAULT 'confirmed',
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transportation requests submitted from the public site
CREATE TABLE IF NOT EXISTS transportation_requests (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service_type TEXT NOT NULL,
    destination TEXT,
    pickup_details TEXT,
    preferred_date DATE,
    preferred_time TEXT,
    group_size TEXT,
    additional_info TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE manual_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportation_requests ENABLE ROW LEVEL SECURITY;

-- Allow anon users (website + admin panel) to insert manual bookings (handled via admin panel)
CREATE POLICY IF NOT EXISTS "Allow anon insert manual bookings"
    ON manual_bookings FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow admin panel (anon key) to read/update/delete manual bookings
CREATE POLICY IF NOT EXISTS "Allow anon manage manual bookings"
    ON manual_bookings FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow anon update manual bookings"
    ON manual_bookings FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anon delete manual bookings"
    ON manual_bookings FOR DELETE
    TO anon, authenticated
    USING (true);

-- Allow transportation requests from public site (anon insert)
CREATE POLICY IF NOT EXISTS "Allow anon insert transportation requests"
    ON transportation_requests FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow admin panel to read/update/delete transportation requests
CREATE POLICY IF NOT EXISTS "Allow anon manage transportation requests"
    ON transportation_requests FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow anon update transportation requests"
    ON transportation_requests FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anon delete transportation requests"
    ON transportation_requests FOR DELETE
    TO anon, authenticated
    USING (true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_manual_bookings_date ON manual_bookings(tour_date);
CREATE INDEX IF NOT EXISTS idx_manual_bookings_status ON manual_bookings(status);
CREATE INDEX IF NOT EXISTS idx_transportation_requests_status ON transportation_requests(status);

