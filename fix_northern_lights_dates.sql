-- Fix Northern Lights Tour dates - remove dates before September 15, 2025
-- This will clean up any old data that might have September 1-14 dates

-- First, let's see what dates currently exist for Northern Lights Tour
SELECT 
  t.name as tour_name,
  td.date,
  td.available_slots,
  td.total_booked
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour'
  AND td.date < '2025-09-15'
ORDER BY td.date;

-- Delete any Northern Lights Tour dates before September 15, 2025
DELETE FROM tour_dates 
WHERE tour_id = (SELECT id FROM tours WHERE name = 'Northern Lights Tour')
  AND date < '2025-09-15';

-- Verify the fix - show remaining dates
SELECT 
  t.name as tour_name,
  td.date,
  td.available_slots,
  td.total_booked
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour'
ORDER BY td.date
LIMIT 10;
