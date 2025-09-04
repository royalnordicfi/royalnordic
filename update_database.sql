-- Update database to match frontend expectations
-- Run this in Supabase SQL Editor

-- Update Snowshoe Adventure capacity from 6 to 3
UPDATE tours SET max_capacity = 3 WHERE name = 'Snowshoe Adventure';

-- Update Snowshoe Adventure tour_dates available_slots from 6 to 3
UPDATE tour_dates 
SET available_slots = 3 
WHERE tour_id = (SELECT id FROM tours WHERE name = 'Snowshoe Adventure');

-- Add Northern Lights Tour dates for September 15-30, 2025 (if they don't exist)
INSERT INTO tour_dates (tour_id, date, available_slots)
SELECT 
  (SELECT id FROM tours WHERE name = 'Northern Lights Tour'),
  generate_series('2025-09-15'::date, '2025-09-30'::date, '1 day'::interval)::date,
  8
ON CONFLICT (tour_id, date) DO NOTHING;

-- Update Snowshoe Adventure end date to April 1, 2026 (remove dates after April 1)
DELETE FROM tour_dates 
WHERE tour_id = (SELECT id FROM tours WHERE name = 'Snowshoe Adventure')
  AND date > '2026-04-01';

-- Verify the changes
SELECT 
  t.name,
  t.max_capacity,
  COUNT(td.date) as total_dates,
  MIN(td.date) as season_start,
  MAX(td.date) as season_end,
  AVG(td.available_slots) as avg_slots
FROM tours t
LEFT JOIN tour_dates td ON t.id = td.tour_id
WHERE t.name IN ('Northern Lights Tour', 'Snowshoe Adventure')
GROUP BY t.id, t.name, t.max_capacity
ORDER BY t.name;
