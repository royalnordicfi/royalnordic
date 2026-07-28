-- Ranua Zoo (tour id 5): allow up to 16 guests per booking on the website
UPDATE public.tours
SET max_capacity = 16
WHERE id = 5
   OR name = 'Nordic Animals of Ranua Zoo';

-- Raise open date slots that were capped at the old capacity (do not shrink busy days)
UPDATE public.tour_dates
SET available_slots = 16
WHERE tour_id = 5
  AND available_slots < 16
  AND total_booked <= 16;
