-- Add Nordic Animals of Ranua Zoo tour to the database
-- Run this in your Supabase SQL Editor

-- Insert Nordic Animals of Ranua Zoo tour
INSERT INTO tours (id, name, description, adult_price, child_price, max_capacity) 
VALUES (5, 'Nordic Animals of Ranua Zoo', 'Discover the incredible wildlife of Finland at Ranua Zoo, home to bears, wolves, lynx, and many other Nordic animals', 99.00, 79.00, 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  max_capacity = EXCLUDED.max_capacity;

-- Insert Nordic Animals of Ranua Zoo dates for September 25, 2025 - June 30, 2026
DO $$
DECLARE
  ranua_zoo_id BIGINT := 5;
  tour_date DATE := '2025-09-25'::DATE;
  end_date DATE := '2026-06-30'::DATE;
BEGIN
  WHILE tour_date <= end_date LOOP
    INSERT INTO tour_dates (tour_id, date, available_slots) 
    VALUES (ranua_zoo_id, tour_date, 8)
    ON CONFLICT (tour_id, date) DO NOTHING;
    
    tour_date := tour_date + INTERVAL '1 day';
  END LOOP;
END $$;
