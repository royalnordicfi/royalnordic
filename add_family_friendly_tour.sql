-- Add Family-Friendly Northern Lights Tour to the database
-- Run this in your Supabase SQL Editor

-- Insert the Family-Friendly Northern Lights Tour
INSERT INTO tours (id, name, description, adult_price, child_price, max_capacity) 
VALUES (8, 'Family-Friendly Northern Lights Tour', 'Perfect for families with children! Shorter duration and kid-friendly activities while hunting the Aurora.', 79.00, 59.00, 16)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  max_capacity = EXCLUDED.max_capacity;

-- Insert Family-Friendly Northern Lights Tour dates for October 16, 2025 - April 15, 2026
DO $$
DECLARE
  family_friendly_id BIGINT := 8;
  tour_date DATE := '2025-10-16'::DATE;
  end_date DATE := '2026-04-15'::DATE;
BEGIN
  WHILE tour_date <= end_date LOOP
    INSERT INTO tour_dates (tour_id, date, available_slots) 
    VALUES (family_friendly_id, tour_date, 16)
    ON CONFLICT (tour_id, date) DO NOTHING;
    
    tour_date := tour_date + INTERVAL '1 day';
  END LOOP;
END $$;
