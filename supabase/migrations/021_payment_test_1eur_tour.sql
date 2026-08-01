-- Internal €1 live payment test product (not marketed on homepage)
-- Ensure identity stays ahead of manually inserted tour ids.
SELECT setval(
  pg_get_serial_sequence('public.tours', 'id'),
  (SELECT COALESCE(MAX(id), 1) FROM public.tours)
);

INSERT INTO public.tours (name, public_name, description, adult_price, child_price, max_capacity, is_active)
VALUES (
  'Payment Test €1',
  'Payment Test €1',
  'Internal live payment test product. €1 adult / €1 child. Not for public marketing.',
  1.00,
  1.00,
  8,
  true
)
ON CONFLICT (name) DO UPDATE SET
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  max_capacity = EXCLUDED.max_capacity,
  is_active = true,
  public_name = EXCLUDED.public_name,
  description = EXCLUDED.description;

DO $$
DECLARE
  test_tour_id BIGINT;
  d DATE := CURRENT_DATE;
BEGIN
  SELECT id INTO test_tour_id FROM public.tours WHERE name = 'Payment Test €1';
  IF test_tour_id IS NULL THEN
    RAISE EXCEPTION 'Payment Test €1 tour not found';
  END IF;

  FOR i IN 0..89 LOOP
    INSERT INTO public.tour_dates (tour_id, date, available_slots, total_booked)
    VALUES (test_tour_id, d + i, 8, 0)
    ON CONFLICT (tour_id, date) DO UPDATE
      SET available_slots = GREATEST(public.tour_dates.available_slots, 8);
  END LOOP;
END $$;
