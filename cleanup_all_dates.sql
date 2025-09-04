-- COMPREHENSIVE CLEANUP: Remove all dates outside correct seasons
-- This will ensure only the correct season dates remain

-- 1. Clean Northern Lights Tour dates (September 15, 2025 - April 15, 2026)
DELETE FROM tour_dates 
WHERE tour_id = (SELECT id FROM tours WHERE name = 'Northern Lights Tour')
  AND (date < '2025-09-15' OR date > '2026-04-15');

-- 2. Clean Snowshoe Adventure dates (November 1, 2025 - April 1, 2026)
DELETE FROM tour_dates 
WHERE tour_id = (SELECT id FROM tours WHERE name = 'Snowshoe Adventure')
  AND (date < '2025-11-01' OR date > '2026-04-01');

-- 3. Verify Northern Lights dates
SELECT 
  'Northern Lights' as tour_name,
  COUNT(*) as total_dates,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour';

-- 4. Verify Snowshoe dates
SELECT 
  'Snowshoe Adventure' as tour_name,
  COUNT(*) as total_dates,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Snowshoe Adventure';

-- 5. Show first 5 Northern Lights dates
SELECT 
  t.name as tour_name,
  td.date,
  td.available_slots,
  td.total_booked
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour'
ORDER BY td.date
LIMIT 5;

-- 6. Show last 5 Northern Lights dates
SELECT 
  t.name as tour_name,
  td.date,
  td.available_slots,
  td.total_booked
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour'
ORDER BY td.date DESC
LIMIT 5;
