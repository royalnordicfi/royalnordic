-- Update all tour capacities to 16 slots per day

-- Update max_capacity for all tours
UPDATE tours SET max_capacity = 16 WHERE id = 1; -- Guaranteed Northern Lights Tour
UPDATE tours SET max_capacity = 16 WHERE id = 3; -- Family-Friendly Northern Lights Tour  
UPDATE tours SET max_capacity = 16 WHERE id = 5; -- Ranua Zoo
UPDATE tours SET max_capacity = 16 WHERE id = 6; -- Korouoma Canyon
UPDATE tours SET max_capacity = 16 WHERE id = 4; -- Ice Fishing (if exists)

-- Update available_slots for all existing tour_dates to 16
UPDATE tour_dates SET available_slots = 16 WHERE tour_id = 1; -- Northern Lights
UPDATE tour_dates SET available_slots = 16 WHERE tour_id = 3; -- Family-Friendly
UPDATE tour_dates SET available_slots = 16 WHERE tour_id = 5; -- Ranua Zoo
UPDATE tour_dates SET available_slots = 16 WHERE tour_id = 6; -- Korouoma
UPDATE tour_dates SET available_slots = 16 WHERE tour_id = 4; -- Ice Fishing

-- Show results
SELECT 
    id,
    name,
    max_capacity,
    adult_price,
    child_price
FROM tours 
ORDER BY id;

SELECT '✅ All tours updated to 16 slots per day!' as status;

