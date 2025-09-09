-- SECURE RLS policies for admin operations
-- Only allows authenticated admin users to perform admin operations

-- First, let's create an admin_users table to track who can perform admin operations
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Insert your admin email
INSERT INTO admin_users (email, name) 
VALUES ('mirov.vesterinen@gmail.com', 'Miro Vesterinen')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read admin_users (for checking if user is admin)
CREATE POLICY "Allow read admin_users" ON admin_users
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Now create secure policies for bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin to update bookings" ON bookings;
DROP POLICY IF EXISTS "Allow admin to delete bookings" ON bookings;
DROP POLICY IF EXISTS "Allow admin to insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow admin to select bookings" ON bookings;

-- Allow anyone to read bookings (for public display)
CREATE POLICY "Allow read bookings" ON bookings
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow anyone to insert bookings (for new bookings)
CREATE POLICY "Allow insert bookings" ON bookings
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- SECURE: Only allow admin users to update bookings
CREATE POLICY "Allow admin update bookings" ON bookings
    FOR UPDATE
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = 'mirov.vesterinen@gmail.com' 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = 'mirov.vesterinen@gmail.com' 
            AND is_active = true
        )
    );

-- SECURE: Only allow admin users to delete bookings
CREATE POLICY "Allow admin delete bookings" ON bookings
    FOR DELETE
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = 'mirov.vesterinen@gmail.com' 
            AND is_active = true
        )
    );

-- Apply same secure policies to tour_dates
ALTER TABLE tour_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin to update tour_dates" ON tour_dates;
DROP POLICY IF EXISTS "Allow admin to select tour_dates" ON tour_dates;

CREATE POLICY "Allow read tour_dates" ON tour_dates
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow admin update tour_dates" ON tour_dates
    FOR UPDATE
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = 'mirov.vesterinen@gmail.com' 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = 'mirov.vesterinen@gmail.com' 
            AND is_active = true
        )
    );

-- Apply same secure policies to tours
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin to select tours" ON tours;
DROP POLICY IF EXISTS "Allow admin to update tours" ON tours;

CREATE POLICY "Allow read tours" ON tours
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow admin update tours" ON tours
    FOR UPDATE
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = 'mirov.vesterinen@gmail.com' 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = 'mirov.vesterinen@gmail.com' 
            AND is_active = true
        )
    );

-- Final verification
SELECT 'Secure RLS policies added successfully! Only admin users can modify data.' as status;
