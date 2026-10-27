-- Open Standard Group operating dates for the 2026–27 season (admin-equivalent inventory).
-- Season window remains enforced by tours.season_* and booking rules; admins can still close nights.

UPDATE public.tours
SET is_active = true
WHERE id = 10
  AND name = 'Northern Lights Standard Group – 100% Guarantee';

INSERT INTO public.tour_dates (tour_id, date, available_slots, total_booked)
SELECT
  10,
  d::date,
  50,
  0
FROM generate_series(DATE '2026-11-01', DATE '2027-03-31', INTERVAL '1 day') AS d
ON CONFLICT (tour_id, date) DO NOTHING;
