-- Clean up Northern Lights Tour dates - remove dates outside the correct season
-- This will remove any dates before September 15, 2025 and after April 15, 2026

-- First, let's see what dates currently exist for Northern Lights Tour
SELECT 
  t.name as tour_name,
  td.date,
  td.available_slots,
  td.total_booked
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour'
  AND (td.date < '2025-09-15' OR td.date > '2026-04-15')
ORDER BY td.date;

-- Delete any Northern Lights Tour dates outside the correct season
DELETE FROM tour_dates 
WHERE tour_id = (SELECT id FROM tours WHERE name = 'Northern Lights Tour')
  AND (date < '2025-09-15' OR date > '2026-04-15');

-- Verify the cleanup - show remaining dates
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

-- Also check the last few dates
SELECT 
  t.name as tour_name,
  td.date,
  td.available_slots,
  td.total_booked
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour'
ORDER BY td.date DESC
LIMIT 10;
