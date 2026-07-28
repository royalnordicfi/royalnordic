-- Korouoma Canyon (tour id 6): allow up to 16 guests per booking on the website
-- Display copy remains "max 8 people per vehicle" (groups may use more than one vehicle)
UPDATE public.tours
SET max_capacity = 16
WHERE id = 6
   OR name = 'Korouoma Canyon Winter Adventure';

-- Raise open date slots that were capped at the old capacity (do not shrink busy days)
UPDATE public.tour_dates
SET available_slots = 16
WHERE tour_id = 6
  AND available_slots < 16
  AND total_booked <= 16;
