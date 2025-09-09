-- Add test tour for live payment testing
-- This tour will be removed in production

INSERT INTO tours (name, description, adult_price, child_price, max_capacity) 
VALUES 
  ('TEST TOUR - Live Payment Testing', 'This is a test tour for live payment testing. Price: 10 cents. Will be removed in production.', 0.10, 0.10, 10)
ON CONFLICT (name) DO NOTHING;

-- Add some test dates for the test tour
DO $$
DECLARE
    test_tour_id BIGINT;
    tour_date DATE;
BEGIN
    -- Get the test tour ID
    SELECT id INTO test_tour_id FROM tours WHERE name = 'TEST TOUR - Live Payment Testing';
    
    -- Add test dates for the next 30 days
    tour_date := CURRENT_DATE;
    
    FOR i IN 1..30 LOOP
        INSERT INTO tour_dates (tour_id, date, available_slots, total_booked)
        VALUES (test_tour_id, tour_date, 10, 0)
        ON CONFLICT (tour_id, date) DO NOTHING;
        
        tour_date := tour_date + INTERVAL '1 day';
    END LOOP;
END $$;
