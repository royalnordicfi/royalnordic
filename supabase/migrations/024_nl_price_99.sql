-- Guaranteed Northern Lights special offer: €99 adult (was €129)
UPDATE public.tours
SET adult_price = 99,
    child_price = 99
WHERE id = 1
   OR name IN ('Northern Lights Tour', 'Guaranteed Northern Lights Tour');
