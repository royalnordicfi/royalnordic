-- Comprehensive RLS fix for admin panel
-- The admin panel uses anon key with frontend authentication
-- We need to allow full CRUD operations for admin functionality

-- ============================================
-- BOOKINGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow anon select bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon update bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon delete bookings" ON bookings;

CREATE POLICY "Allow anon select bookings" ON bookings
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anon insert bookings" ON bookings
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anon update bookings" ON bookings
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon delete bookings" ON bookings
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- MANUAL_BOOKINGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow anon select manual_bookings" ON manual_bookings;
DROP POLICY IF EXISTS "Allow anon insert manual_bookings" ON manual_bookings;
DROP POLICY IF EXISTS "Allow anon update manual_bookings" ON manual_bookings;
DROP POLICY IF EXISTS "Allow anon delete manual_bookings" ON manual_bookings;

CREATE POLICY "Allow anon select manual_bookings" ON manual_bookings
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anon insert manual_bookings" ON manual_bookings
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anon update manual_bookings" ON manual_bookings
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon delete manual_bookings" ON manual_bookings
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- TRANSPORTATION_REQUESTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow anon select transportation_requests" ON transportation_requests;
DROP POLICY IF EXISTS "Allow anon insert transportation_requests" ON transportation_requests;
DROP POLICY IF EXISTS "Allow anon update transportation_requests" ON transportation_requests;
DROP POLICY IF EXISTS "Allow anon delete transportation_requests" ON transportation_requests;

CREATE POLICY "Allow anon select transportation_requests" ON transportation_requests
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anon insert transportation_requests" ON transportation_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anon update transportation_requests" ON transportation_requests
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon delete transportation_requests" ON transportation_requests
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- TOUR_DATES TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow anon select tour_dates" ON tour_dates;
DROP POLICY IF EXISTS "Allow anon insert tour_dates" ON tour_dates;
DROP POLICY IF EXISTS "Allow anon update tour_dates" ON tour_dates;
DROP POLICY IF EXISTS "Allow anon delete tour_dates" ON tour_dates;

CREATE POLICY "Allow anon select tour_dates" ON tour_dates
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anon insert tour_dates" ON tour_dates
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anon update tour_dates" ON tour_dates
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon delete tour_dates" ON tour_dates
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- ============================================
-- TOURS TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow anon select tours" ON tours;
DROP POLICY IF EXISTS "Allow anon insert tours" ON tours;
DROP POLICY IF EXISTS "Allow anon update tours" ON tours;
DROP POLICY IF EXISTS "Allow anon delete tours" ON tours;

CREATE POLICY "Allow anon select tours" ON tours
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anon insert tours" ON tours
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anon update tours" ON tours
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon delete tours" ON tours
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- Verify RLS is enabled on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'Comprehensive admin RLS policies applied successfully!' as status;
SELECT 'All tables now allow full CRUD for anon/authenticated users' as note;
SELECT 'Admin panel should now be able to delete bookings' as result;

