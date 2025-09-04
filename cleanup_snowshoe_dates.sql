-- Clean up Snowshoe Adventure dates - remove dates outside the correct season
-- This will remove any dates before November 1, 2025 and after April 1, 2026

-- First, let's see what dates currently exist for Snowshoe Adventure
SELECT 
  t.name as tour_name,
  td.date,
  td.available_slots,
  td.total_booked
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Snowshoe Adventure'
  AND (td.date < '2025-11-01' OR td.date > '2026-04-01')
ORDER BY td.date;

-- Delete any Snowshoe Adventure dates outside the correct season
DELETE FROM tour_dates 
WHERE tour_id = (SELECT id FROM tours WHERE name = 'Snowshoe Adventure')
  AND (date < '2025-11-01' OR date > '2026-04-01');

-- Verify the cleanup - show remaining dates
SELECT 
  t.name as tour_name,
  td.date,
  td.available_slots,
  td.total_booked
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Snowshoe Adventure'
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
WHERE t.name = 'Snowshoe Adventure'
ORDER BY td.date DESC
LIMIT 10;
