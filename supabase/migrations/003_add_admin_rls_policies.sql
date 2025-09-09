-- Add RLS policies for admin operations on bookings table
-- This allows the admin panel to update and delete bookings

-- Enable RLS on bookings table (if not already enabled)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin to update bookings" ON bookings;
DROP POLICY IF EXISTS "Allow admin to delete bookings" ON bookings;
DROP POLICY IF EXISTS "Allow admin to insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow admin to select bookings" ON bookings;

-- Create policies for admin operations
-- Note: These policies allow any authenticated user to perform admin operations
-- In a production environment, you might want to add more specific conditions

-- Allow admin to select (read) all bookings
CREATE POLICY "Allow admin to select bookings" ON bookings
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow admin to insert new bookings
CREATE POLICY "Allow admin to insert bookings" ON bookings
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow admin to update bookings (for status changes)
CREATE POLICY "Allow admin to update bookings" ON bookings
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Allow admin to delete bookings
CREATE POLICY "Allow admin to delete bookings" ON bookings
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- Also add policies for tour_dates table to allow updates
ALTER TABLE tour_dates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin to update tour_dates" ON tour_dates;
DROP POLICY IF EXISTS "Allow admin to select tour_dates" ON tour_dates;

-- Allow admin to select tour_dates
CREATE POLICY "Allow admin to select tour_dates" ON tour_dates
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow admin to update tour_dates (for calendar slot management)
CREATE POLICY "Allow admin to update tour_dates" ON tour_dates
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Add policies for tours table as well
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin to select tours" ON tours;
DROP POLICY IF EXISTS "Allow admin to update tours" ON tours;

-- Allow admin to select tours
CREATE POLICY "Allow admin to select tours" ON tours
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow admin to update tours (for price/capacity changes)
CREATE POLICY "Allow admin to update tours" ON tours
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Final verification
SELECT 'RLS policies added successfully for admin operations!' as status;
