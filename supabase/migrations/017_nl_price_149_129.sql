-- Guaranteed Northern Lights direct prices (tour id 1)
UPDATE public.tours
SET adult_price = 149,
    child_price = 129
WHERE id = 1
   OR name = 'Northern Lights Tour';
