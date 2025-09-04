-- AGGRESSIVE DATABASE CLEANUP
-- This will FORCE remove all incorrect dates

-- 1. Show what we're about to delete
SELECT 'DELETING Northern Lights dates before Sep 15, 2025:' as action;
SELECT date, available_slots, total_booked 
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour' AND date < '2025-09-15'
ORDER BY date;

SELECT 'DELETING Northern Lights dates after Apr 15, 2026:' as action;
SELECT date, available_slots, total_booked 
FROM tour_dates td
JOIN tours t ON td.tour_id = t.id
WHERE t.name = 'Northern Lights Tour' AND date > '2026-04-15'
ORDER BY date;

-- 2. FORCE DELETE with explicit tour ID
DELETE FROM tour_dates 
WHERE tour_id = 1 AND (date < '2025-09-15' OR date > '2026-04-15');

-- 3. FORCE DELETE Snowshoe dates
DELETE FROM tour_dates 
WHERE tour_id = 2 AND (date < '2025-11-01' OR date > '2026-04-01');

-- 4. Verify the cleanup worked
SELECT 'AFTER CLEANUP - Northern Lights count:' as status;
SELECT COUNT(*) as total_dates FROM tour_dates WHERE tour_id = 1;

SELECT 'AFTER CLEANUP - First 5 Northern Lights dates:' as status;
SELECT date, available_slots, total_booked 
FROM tour_dates 
WHERE tour_id = 1 
ORDER BY date 
LIMIT 5;

SELECT 'AFTER CLEANUP - Last 5 Northern Lights dates:' as status;
SELECT date, available_slots, total_booked 
FROM tour_dates 
WHERE tour_id = 1 
ORDER BY date DESC 
LIMIT 5;

-- 5. Check if September 1st still exists (should be 0)
SELECT 'September 1st, 2025 still exists:' as check;
SELECT COUNT(*) as count FROM tour_dates WHERE tour_id = 1 AND date = '2025-09-01';

-- 6. Check if April 16th still exists (should be 0)
SELECT 'April 16th, 2026 still exists:' as check;
SELECT COUNT(*) as count FROM tour_dates WHERE tour_id = 1 AND date = '2026-04-16';
