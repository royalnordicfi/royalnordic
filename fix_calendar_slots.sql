-- Fix corrupted total_booked values in tour_dates table
-- This script recalculates total_booked based on actual confirmed bookings

-- First, let's see the current state
SELECT 
    td.id,
    td.date,
    td.available_slots,
    td.total_booked as current_total_booked,
    COALESCE(SUM(b.adults + b.children), 0) as actual_confirmed_bookings,
    (td.available_slots - COALESCE(SUM(b.adults + b.children), 0)) as actual_remaining_slots
FROM tour_dates td
LEFT JOIN bookings b ON td.id = b.tour_date_id AND b.status = 'confirmed'
GROUP BY td.id, td.date, td.available_slots, td.total_booked
ORDER BY td.date;

-- Now fix the total_booked values
UPDATE tour_dates 
SET total_booked = (
    SELECT COALESCE(SUM(adults + children), 0)
    FROM bookings 
    WHERE tour_date_id = tour_dates.id 
    AND status = 'confirmed'
);

-- Verify the fix
SELECT 
    td.id,
    td.date,
    td.available_slots,
    td.total_booked as fixed_total_booked,
    (td.available_slots - td.total_booked) as remaining_slots
FROM tour_dates td
ORDER BY td.date;

-- Show any remaining issues
SELECT 
    td.id,
    td.date,
    td.available_slots,
    td.total_booked,
    (td.available_slots - td.total_booked) as remaining_slots,
    CASE 
        WHEN (td.available_slots - td.total_booked) < 0 THEN 'OVERBOOKED'
        WHEN (td.available_slots - td.total_booked) > td.available_slots THEN 'NEGATIVE BOOKINGS'
        ELSE 'OK'
    END as status
FROM tour_dates td
WHERE (td.available_slots - td.total_booked) < 0 
   OR (td.available_slots - td.total_booked) > td.available_slots
ORDER BY td.date;
