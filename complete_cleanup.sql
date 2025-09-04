-- COMPLETE DATABASE CLEANUP
-- This will remove ALL dates outside the correct seasons and ensure clean data

-- 1. Show current state before cleanup
SELECT 'BEFORE CLEANUP - Northern Lights dates:' as status;
SELECT 
  t.name as tour_name,
  COUNT(*) as total_dates,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour'
GROUP BY t.name;

SELECT 'BEFORE CLEANUP - Snowshoe dates:' as status;
SELECT 
  t.name as tour_name,
  COUNT(*) as total_dates,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Snowshoe Adventure'
GROUP BY t.name;

-- 2. Delete ALL Northern Lights dates outside September 15, 2025 - April 15, 2026
DELETE FROM tour_dates 
WHERE tour_id = (SELECT id FROM tours WHERE name = 'Northern Lights Tour')
  AND (date < '2025-09-15' OR date > '2026-04-15');

-- 3. Delete ALL Snowshoe dates outside November 1, 2025 - April 1, 2026
DELETE FROM tour_dates 
WHERE tour_id = (SELECT id FROM tours WHERE name = 'Snowshoe Adventure')
  AND (date < '2025-11-01' OR date > '2026-04-01');

-- 4. Show state after cleanup
SELECT 'AFTER CLEANUP - Northern Lights dates:' as status;
SELECT 
  t.name as tour_name,
  COUNT(*) as total_dates,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour'
GROUP BY t.name;

SELECT 'AFTER CLEANUP - Snowshoe dates:' as status;
SELECT 
  t.name as tour_name,
  COUNT(*) as total_dates,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Snowshoe Adventure'
GROUP BY t.name;

-- 5. Show first 3 and last 3 Northern Lights dates
SELECT 'Northern Lights - First 3 dates:' as status;
SELECT date, available_slots, total_booked 
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour'
ORDER BY date
LIMIT 3;

SELECT 'Northern Lights - Last 3 dates:' as status;
SELECT date, available_slots, total_booked 
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour'
ORDER BY date DESC
LIMIT 3;
