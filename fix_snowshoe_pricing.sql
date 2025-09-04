-- Fix Snowshoe Adventure pricing
-- Run this in Supabase SQL Editor

-- Update Snowshoe Adventure pricing to €79 adult, €49 child
UPDATE tours 
SET adult_price = 79.00, child_price = 49.00 
WHERE name = 'Snowshoe Adventure';

-- Verify the changes
SELECT 
  name,
  adult_price,
  child_price,
  max_capacity
FROM tours 
WHERE name = 'Snowshoe Adventure';
