-- Update Northern Lights Tour capacity to 100
-- Run this in your Supabase SQL Editor

-- Update the tour max_capacity
UPDATE tours 
SET max_capacity = 100 
WHERE id = 1 AND name = 'Northern Lights Tour';

-- Update all tour_dates available_slots to 100 for Northern Lights Tour
UPDATE tour_dates 
SET available_slots = 100 
WHERE tour_id = 1;

-- Verify the update
SELECT id, name, max_capacity FROM tours WHERE id = 1;
SELECT COUNT(*) as updated_dates FROM tour_dates WHERE tour_id = 1 AND available_slots = 100;


