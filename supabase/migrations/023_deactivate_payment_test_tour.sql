-- Remove Payment Test €1 from public booking / admin active catalog
UPDATE public.tours
SET is_active = false
WHERE name = 'Payment Test €1' OR id = 9;
