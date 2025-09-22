-- Add Ice Fishing Experience tour to the database
-- Run this in your Supabase SQL Editor

-- Insert Ice Fishing Experience tour
INSERT INTO tours (id, name, description, adult_price, child_price, max_capacity) 
VALUES (4, 'Ice Fishing Experience', 'Experience traditional Lapland ice fishing on pristine frozen lakes with expert guidance', 119.00, 99.00, 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  max_capacity = EXCLUDED.max_capacity;

-- Insert Ice Fishing Experience dates for December 15, 2025 - March 15, 2026
DO $$
DECLARE
  ice_fishing_id BIGINT := 4;
  tour_date DATE := '2025-12-15'::DATE;
  end_date DATE := '2026-03-15'::DATE;
BEGIN
  WHILE tour_date <= end_date LOOP
    INSERT INTO tour_dates (tour_id, date, available_slots) 
    VALUES (ice_fishing_id, tour_date, 8)
    ON CONFLICT (tour_id, date) DO NOTHING;
    
    tour_date := tour_date + INTERVAL '1 day';
  END LOOP;
END $$;
