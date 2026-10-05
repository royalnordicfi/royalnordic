-- Rovaniemi ⇄ Saariselkä private transfer — €649 / vehicle / one way
-- pricing_model: per_vehicle means passenger count must NOT multiply the price.

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS pricing_model text NOT NULL DEFAULT 'per_person';

ALTER TABLE public.tours
  DROP CONSTRAINT IF EXISTS tours_pricing_model_check;

ALTER TABLE public.tours
  ADD CONSTRAINT tours_pricing_model_check
  CHECK (pricing_model IN ('per_person', 'per_vehicle'));

COMMENT ON COLUMN public.tours.pricing_model IS
  'per_person = adults×adult_price + children×child_price; per_vehicle = charge adult_price once for the vehicle';

SELECT setval(
  pg_get_serial_sequence('public.tours', 'id'),
  (SELECT COALESCE(MAX(id), 1) FROM public.tours)
);

INSERT INTO public.tours (
  id,
  name,
  public_name,
  description,
  adult_price,
  child_price,
  max_capacity,
  is_active,
  pricing_model,
  duration_text,
  group_size_text,
  meeting_point,
  tagline,
  card_description,
  full_description,
  badge,
  highlights,
  included_items,
  excluded_items,
  pickup_info,
  know_before,
  what_to_bring,
  cancellation_info,
  seo_title,
  seo_description
) VALUES (
  9,
  'Rovaniemi Saariselkä Private Transfer',
  'Rovaniemi ⇄ Saariselkä Private Transfer',
  'Private door-to-door transfer between Rovaniemi and Saariselkä. €649 per vehicle, one way, up to 8 passengers.',
  649.00,
  649.00,
  8,
  true,
  'per_vehicle',
  'About 3–3.5 hours',
  'Up to 8 passengers / vehicle',
  'Rovaniemi or Saariselkä (as booked)',
  'Private door-to-door transfer between Rovaniemi and Saariselkä.',
  '€649 per vehicle, one way — airport, hotel or accommodation pickup.',
  'Private vehicle with professional driver between Rovaniemi and Saariselkä. Price is per vehicle for one way, not per passenger. Capacity up to 8 guests subject to luggage. Tell us direction, pickup time, flight number and luggage needs when you book.',
  'PER VEHICLE',
  '[
    {"id":"h1","text":"€649 flat rate per vehicle, one way","sort":0},
    {"id":"h2","text":"Door-to-door: airport, hotel or accommodation","sort":1},
    {"id":"h3","text":"Up to 8 passengers depending on luggage","sort":2}
  ]'::jsonb,
  '[
    {"id":"i1","text":"Private vehicle and professional driver","sort":0},
    {"id":"i2","text":"One-way transfer Rovaniemi ⇄ Saariselkä","sort":1},
    {"id":"i3","text":"Pickup from airport, hotel or accommodation","sort":2},
    {"id":"i4","text":"Direct route — no shared shuttle stops","sort":3}
  ]'::jsonb,
  '[
    {"id":"e1","text":"Meals and personal expenses","sort":0},
    {"id":"e2","text":"Return journey (book separately if needed)","sort":1}
  ]'::jsonb,
  'We collect you from the address or terminal you provide. Confirm flight number for airport pickups.',
  'Travel time is typically 3–3.5 hours depending on conditions. Price does not change with passenger count within capacity.',
  'Warm layers for boarding in winter. Note oversized luggage or sports equipment when booking.',
  'Free cancellation up to 24 hours before departure.',
  'Rovaniemi Saariselkä Private Transfer | Royal Nordic',
  'Book a private Rovaniemi–Saariselkä transfer from €649 per vehicle one way. Airport and hotel pickup across Finnish Lapland.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public_name = EXCLUDED.public_name,
  description = EXCLUDED.description,
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  max_capacity = EXCLUDED.max_capacity,
  is_active = true,
  pricing_model = EXCLUDED.pricing_model,
  duration_text = EXCLUDED.duration_text,
  group_size_text = EXCLUDED.group_size_text,
  meeting_point = EXCLUDED.meeting_point,
  tagline = EXCLUDED.tagline,
  card_description = EXCLUDED.card_description,
  full_description = EXCLUDED.full_description,
  badge = EXCLUDED.badge,
  highlights = EXCLUDED.highlights,
  included_items = EXCLUDED.included_items,
  excluded_items = EXCLUDED.excluded_items,
  pickup_info = EXCLUDED.pickup_info,
  know_before = EXCLUDED.know_before,
  what_to_bring = EXCLUDED.what_to_bring,
  cancellation_info = EXCLUDED.cancellation_info,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  cms_updated_at = now();

-- Seed availability for the next 180 days
DO $$
DECLARE
  d DATE := CURRENT_DATE;
BEGIN
  FOR i IN 0..179 LOOP
    -- available_slots = vehicles available that day (each booking consumes 1)
    INSERT INTO public.tour_dates (tour_id, date, available_slots, total_booked)
    VALUES (9, d + i, 2, 0)
    ON CONFLICT (tour_id, date) DO UPDATE
      SET available_slots = GREATEST(public.tour_dates.available_slots, 2);
  END LOOP;
END $$;

SELECT setval(
  pg_get_serial_sequence('public.tours', 'id'),
  (SELECT COALESCE(MAX(id), 1) FROM public.tours)
);
