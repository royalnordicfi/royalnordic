-- Private Northern Lights Tour (id 11): exclusive per-group booking at €1,349.
-- Season 1 Nov – 15 Apr. One exclusive allocation per departure (available_slots = 1).
-- Pricing model per_vehicle = flat group price (not multiplied by guest count).

CREATE OR REPLACE FUNCTION public.prevent_private_nl_oversell()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  remaining integer;
  date_tour_id integer;
BEGIN
  IF NEW.tour_id <> 11 OR NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  IF NEW.tour_date_id IS NULL THEN
    RAISE EXCEPTION 'Private Northern Lights bookings require a departure date'
      USING ERRCODE = '23514';
  END IF;

  SELECT tour_id, available_slots - COALESCE(total_booked, 0)
    INTO date_tour_id, remaining
  FROM public.tour_dates
  WHERE id = NEW.tour_date_id
  FOR UPDATE;

  IF date_tour_id IS NULL OR date_tour_id <> 11 THEN
    RAISE EXCEPTION 'Departure date does not belong to the Private Northern Lights tour'
      USING ERRCODE = '23514';
  END IF;

  -- Each private booking consumes the exclusive allocation (1 slot).
  IF remaining < 1 THEN
    RAISE EXCEPTION 'This private departure is already reserved'
      USING ERRCODE = '23514';
  END IF;

  IF COALESCE(NEW.adults, 0) + COALESCE(NEW.children, 0) < 1
     OR COALESCE(NEW.adults, 0) + COALESCE(NEW.children, 0) > 8 THEN
    RAISE EXCEPTION 'Private Northern Lights tours accept 1–8 guests'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_private_nl_oversell ON public.bookings;
CREATE TRIGGER prevent_private_nl_oversell
  BEFORE INSERT OR UPDATE OF tour_id, tour_date_id, adults, children, status
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_private_nl_oversell();

INSERT INTO public.tours (
  id,
  name,
  public_name,
  description,
  adult_price,
  child_price,
  max_capacity,
  is_active,
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
  what_to_expect,
  important_info,
  know_before,
  what_to_bring,
  pickup_info,
  cancellation_info,
  guarantee_info,
  season_start,
  season_end,
  departure_time,
  pricing_model,
  seo_title,
  seo_description,
  seo_image,
  hero_image_url,
  gallery,
  faq,
  operational_notes,
  sale_enabled,
  reference_price
) VALUES (
  11,
  'Private Northern Lights Tour – 100% Guarantee',
  'Private Northern Lights Tour – 100% Guarantee',
  'Exclusive private Northern Lights tour from Rovaniemi for your group of up to eight guests. €1,349 per private group. Hotel pickup and drop-off included.',
  1349.00,
  1349.00,
  8,
  true,
  'About 5 hours',
  'Private · max 8',
  NULL,
  'Experience the Northern Lights exclusively with your own private group, professional guide, comfortable transportation and unforgettable aurora photography.',
  'Exclusive private aurora tour for up to eight guests. Hotel pickup, English-speaking guide, and professional photography. €1,349 per private group.',
  'Discover the magic of the Northern Lights on an exclusive private adventure through the breathtaking wilderness of Finnish Lapland. This experience is reserved entirely for you and your group of up to eight guests, offering a more personal and comfortable way to explore the Arctic night. Your English-speaking guide will take you away from city lights and search for clearer skies, choosing the most promising viewing locations according to weather and aurora conditions. Unlike tours following fixed sightseeing routes, our Northern Lights experiences prioritize finding suitable skies. The Northern Lights are a natural phenomenon, and clear skies are essential for the best viewing opportunities. Professional Northern Lights photography is included, allowing you to enjoy the experience while your guide captures memorable photographs. Hotel pickup and drop-off in the supported Rovaniemi pickup area are included. Our Northern Lights guarantee applies according to the published terms and conditions.',
  'PRIVATE TOUR',
  '[
    {"id":"h1","text":"Exclusive private tour for your group of up to eight guests","sort":0},
    {"id":"h2","text":"Comfortable private transportation with hotel pickup and drop-off","sort":1},
    {"id":"h3","text":"Experienced English-speaking Northern Lights guide","sort":2},
    {"id":"h4","text":"Flexible route based on weather and sky conditions","sort":3},
    {"id":"h5","text":"Professional Northern Lights photography included","sort":4},
    {"id":"h6","text":"Northern Lights guarantee according to our terms","sort":5}
  ]'::jsonb,
  '[
    {"id":"i1","text":"Exclusive private transportation","sort":0},
    {"id":"i2","text":"Hotel pickup and drop-off within the supported pickup area","sort":1},
    {"id":"i3","text":"English-speaking guide","sort":2},
    {"id":"i4","text":"Northern Lights search","sort":3},
    {"id":"i5","text":"Professional aurora photography","sort":4},
    {"id":"i6","text":"Applicable Northern Lights guarantee","sort":5}
  ]'::jsonb,
  '[
    {"id":"e1","text":"Thermal clothing","sort":0},
    {"id":"e2","text":"Food and drinks","sort":1},
    {"id":"e3","text":"Personal purchases","sort":2}
  ]'::jsonb,
  'Pickup from your accommodation in the supported Rovaniemi area begins ahead of the 18:30 departure. Your guide searches for clearer skies in the Lapland wilderness. Professional aurora photographs are included. The evening lasts about five hours depending on conditions, then returns you to your accommodation.',
  'PRIVATE TOUR · MAXIMUM 8 GUESTS · HOTEL PICKUP INCLUDED. This departure is reserved exclusively for your group.',
  'The season is 1 November through 15 April. Only dates opened in the calendar can be booked. Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
  'Dress in warm layers: thermal base, insulating mid-layer, windproof outerwear, warm boots, hat, and gloves. Thermal clothing is not provided.',
  'Hotel pickup and drop-off are included within the supported Rovaniemi pickup area. Enter your accommodation address at checkout. Exact pickup time is confirmed after booking and may be earlier than the 18:30 tour departure.',
  'Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
  'If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund or can reschedule to another available day, subject to our Terms & Conditions. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.',
  '11-01',
  '04-15',
  '18:30',
  'per_vehicle',
  'Private Northern Lights Tour Rovaniemi | Royal Nordic',
  'Book an exclusive private Northern Lights tour in Rovaniemi for up to eight guests. Hotel pickup, professional photography and Northern Lights guarantee included. €1,349 per private group.',
  '/nordicci7.jpg',
  '/nordicci7.jpg',
  '[
    {"id":"g1","url":"/nordicci7.jpg","alt":"Private Northern Lights experience under the aurora in Finnish Lapland","sort":0,"is_hero":true},
    {"id":"g2","url":"/nortti10.jpg","alt":"Aurora Borealis over Arctic wilderness near Rovaniemi","sort":1,"is_hero":false},
    {"id":"g3","url":"/nortti8.jpg","alt":"Green northern lights above snowy Lapland forest","sort":2,"is_hero":false},
    {"id":"g4","url":"/lights8.jpg","alt":"Aurora reflecting above the Arctic landscape","sort":3,"is_hero":false},
    {"id":"g5","url":"/nortti7.jpg","alt":"Clear winter night during a private aurora hunt","sort":4,"is_hero":false}
  ]'::jsonb,
  '[
    {"id":"f1","question":"Is this a shared group tour?","answer":"No. This departure is reserved exclusively for your private group of up to eight guests. Other customers are not added to your booking.","sort":0},
    {"id":"f2","question":"How does pricing work?","answer":"The price is €1,349 for the entire private group, whether you book for one guest or eight. The price is not multiplied by the number of participants.","sort":1},
    {"id":"f3","question":"Is hotel pickup included?","answer":"Yes. Hotel pickup and drop-off within the supported Rovaniemi pickup area are included. Enter your accommodation at checkout. Exact pickup time is confirmed after booking.","sort":2},
    {"id":"f4","question":"What time does the tour depart?","answer":"The tour is scheduled for 18:30. Pickup from your accommodation may begin earlier so the group can leave on time.","sort":3},
    {"id":"f5","question":"When can I book?","answer":"The season is 1 November through 15 April. Dates outside that season are closed. Inside the season, only dates opened for this private departure can be booked.","sort":4},
    {"id":"f6","question":"What if we do not see the Northern Lights?","answer":"If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund or can reschedule to another available day, subject to our Terms & Conditions. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.","sort":5},
    {"id":"f7","question":"What is the cancellation policy?","answer":"Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.","sort":6}
  ]'::jsonb,
  'PRIVATE TOUR — exclusive one allocation per night. Do not open more than one slot per date. Capacity is 8 guests informational; inventory is 1 exclusive booking. Hotel pickup required at checkout.',
  false,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public_name = EXCLUDED.public_name,
  description = EXCLUDED.description,
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  max_capacity = EXCLUDED.max_capacity,
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
  what_to_expect = EXCLUDED.what_to_expect,
  important_info = EXCLUDED.important_info,
  know_before = EXCLUDED.know_before,
  what_to_bring = EXCLUDED.what_to_bring,
  pickup_info = EXCLUDED.pickup_info,
  cancellation_info = EXCLUDED.cancellation_info,
  guarantee_info = EXCLUDED.guarantee_info,
  season_start = EXCLUDED.season_start,
  season_end = EXCLUDED.season_end,
  departure_time = EXCLUDED.departure_time,
  pricing_model = EXCLUDED.pricing_model,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  seo_image = EXCLUDED.seo_image,
  hero_image_url = EXCLUDED.hero_image_url,
  gallery = EXCLUDED.gallery,
  faq = EXCLUDED.faq,
  operational_notes = EXCLUDED.operational_notes,
  sale_enabled = EXCLUDED.sale_enabled,
  reference_price = EXCLUDED.reference_price,
  is_active = true;

SELECT setval(
  pg_get_serial_sequence('public.tours', 'id'),
  GREATEST((SELECT MAX(id) FROM public.tours), 11)
);

-- Exclusive inventory: one private booking per night for 2026–27 season.
INSERT INTO public.tour_dates (tour_id, date, available_slots, total_booked)
SELECT
  11,
  d::date,
  1,
  0
FROM generate_series(DATE '2026-11-01', DATE '2027-04-15', INTERVAL '1 day') AS d
ON CONFLICT (tour_id, date) DO UPDATE
SET available_slots = GREATEST(public.tour_dates.available_slots, 1);
