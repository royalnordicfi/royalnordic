-- Northern Lights Standard Group bus tour.
-- Own product row (id 10), own inventory, recurring season 1 Nov–31 Mar.
-- Unpublished (is_active = false) until a live booking check is completed.
-- Does not insert tour_dates: only dates opened in Admin are bookable.

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS season_start TEXT,
  ADD COLUMN IF NOT EXISTS season_end TEXT,
  ADD COLUMN IF NOT EXISTS departure_time TEXT;

COMMENT ON COLUMN public.tours.season_start IS
  'Recurring season start as MM-DD. Null means no season window.';
COMMENT ON COLUMN public.tours.season_end IS
  'Recurring season end as MM-DD, inclusive. May fall in the following calendar year.';
COMMENT ON COLUMN public.tours.departure_time IS
  'Local departure time HH:MM in Europe/Helsinki.';

-- True when d falls in a recurring MM-DD window. Null season = no restriction.
CREATE OR REPLACE FUNCTION public.tour_date_in_season(d date, season_start text, season_end text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  sm int;
  sd int;
  em int;
  ed int;
  m int;
  day int;
  on_or_after_start boolean;
  on_or_before_end boolean;
  crosses_year boolean;
BEGIN
  IF season_start IS NULL OR season_end IS NULL OR btrim(season_start) = '' OR btrim(season_end) = '' THEN
    RETURN true;
  END IF;

  sm := split_part(season_start, '-', 1)::int;
  sd := split_part(season_start, '-', 2)::int;
  em := split_part(season_end, '-', 1)::int;
  ed := split_part(season_end, '-', 2)::int;
  m := EXTRACT(MONTH FROM d)::int;
  day := EXTRACT(DAY FROM d)::int;

  on_or_after_start := m > sm OR (m = sm AND day >= sd);
  on_or_before_end := m < em OR (m = em AND day <= ed);
  crosses_year := sm > em OR (sm = em AND sd > ed);

  IF crosses_year THEN
    RETURN on_or_after_start OR on_or_before_end;
  END IF;
  RETURN on_or_after_start AND on_or_before_end;
END;
$$;

-- Season-configured tours cannot open dates outside the season or above capacity.
-- Tours with no season (the existing catalogue) are unchanged.
CREATE OR REPLACE FUNCTION public.enforce_tour_date_inventory()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cap integer;
  ss text;
  se text;
BEGIN
  SELECT max_capacity, season_start, season_end
    INTO cap, ss, se
  FROM public.tours
  WHERE id = NEW.tour_id;

  IF ss IS NULL OR se IS NULL OR btrim(ss) = '' OR btrim(se) = '' THEN
    RETURN NEW;
  END IF;

  IF cap IS NOT NULL AND NEW.available_slots > cap THEN
    RAISE EXCEPTION 'Available slots (%) cannot exceed this tour capacity (%)', NEW.available_slots, cap
      USING ERRCODE = '23514';
  END IF;

  IF NOT public.tour_date_in_season(NEW.date, ss, se) THEN
    RAISE EXCEPTION 'Date % is outside this tour operating season (% – %)', NEW.date, ss, se
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_tour_date_inventory ON public.tour_dates;
CREATE TRIGGER enforce_tour_date_inventory
  BEFORE INSERT OR UPDATE OF available_slots, date, tour_id
  ON public.tour_dates
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tour_date_inventory();

-- Standard Group only: lock the date row and reject oversell or another tour's date.
-- Other products keep their existing booking triggers.
CREATE OR REPLACE FUNCTION public.prevent_standard_group_oversell()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  slots integer;
  booked integer;
  date_tour bigint;
  requested integer;
BEGIN
  IF NEW.tour_id <> 10 OR NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  SELECT tour_id, available_slots, total_booked
    INTO date_tour, slots, booked
  FROM public.tour_dates
  WHERE id = NEW.tour_date_id
  FOR UPDATE;

  IF date_tour IS NULL THEN
    RAISE EXCEPTION 'Departure date not found';
  END IF;

  IF date_tour IS DISTINCT FROM NEW.tour_id THEN
    RAISE EXCEPTION 'Departure date does not belong to this tour';
  END IF;

  requested := COALESCE(NEW.adults, 0) + COALESCE(NEW.children, 0);
  IF requested > (COALESCE(slots, 0) - COALESCE(booked, 0)) THEN
    RAISE EXCEPTION 'Not enough seats remaining on this departure';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_standard_group_oversell ON public.bookings;
CREATE TRIGGER prevent_standard_group_oversell
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_standard_group_oversell();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.tours
    WHERE id = 10
      AND name <> 'Northern Lights Standard Group – 100% Guarantee'
  ) THEN
    RAISE EXCEPTION 'Tour id 10 is already used by a different product';
  END IF;
END $$;

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
  10,
  'Northern Lights Standard Group – 100% Guarantee',
  'Northern Lights Standard Group – 100% Guarantee',
  'Large-group Northern Lights bus tour from Ruokasenkatu 3 in Rovaniemi. €60 per adult. Hotel pickup is not included.',
  60.00,
  60.00,
  50,
  false,
  'About 5 hours',
  'Large group · max 50',
  'Ruokasenkatu 3, 96100 Rovaniemi, Finland',
  'Affordable large-group bus tour from Rovaniemi, with professional aurora photography and our Northern Lights guarantee.',
  'Large shared bus tour for up to 50 guests. Departs Ruokasenkatu 3 at 20:00. Hotel pickup is not included.',
  'Experience the magical Northern Lights on our affordable Standard Group bus tour from Rovaniemi. Travel comfortably into the Lappish wilderness with an experienced English-speaking guide as we search for clear skies and the best possible conditions to witness the Aurora Borealis. This is a large-group bus experience with up to 50 guests. Professional Northern Lights photography is included, along with our Northern Lights guarantee.',
  'BUS TOUR',
  '[
    {"id":"h1","text":"Large group bus tour for up to 50 guests","sort":0},
    {"id":"h2","text":"Departs Ruokasenkatu 3 at 20:00","sort":1},
    {"id":"h3","text":"Professional Northern Lights photography included","sort":2},
    {"id":"h4","text":"English-speaking guide","sort":3},
    {"id":"h5","text":"Northern Lights guarantee — see Terms","sort":4}
  ]'::jsonb,
  '[
    {"id":"i1","text":"Bus transportation","sort":0},
    {"id":"i2","text":"English-speaking guide","sort":1},
    {"id":"i3","text":"Professional aurora photography","sort":2},
    {"id":"i4","text":"Applicable Northern Lights guarantee","sort":3}
  ]'::jsonb,
  '[
    {"id":"e1","text":"Hotel pickup and drop-off","sort":0},
    {"id":"e2","text":"Thermal clothing","sort":1},
    {"id":"e3","text":"Food and drinks","sort":2}
  ]'::jsonb,
  'Meet at Ruokasenkatu 3 in central Rovaniemi at 20:00. The bus takes the group into the Lappish wilderness to search for clear skies. The evening lasts about 5 hours, depending on weather and viewing conditions, and returns to the same meeting point.',
  'LARGE GROUP BUS TOUR · MAXIMUM 50 GUESTS · MEETING POINT DEPARTURE. This is not a small-group tour and hotel pickup is not included.',
  'The season is 1 November – 31 March. Only dates opened in the calendar can be booked. Dress in your own warm layers; thermal clothing is not provided. Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
  'Bring your own thermal layers, windproof outerwear, warm boots, hat, and gloves. Thermal clothing is not included.',
  'Hotel pickup and drop-off are not included. Meet the group at Ruokasenkatu 3, 96100 Rovaniemi, Finland. Departure is at 20:00.',
  'Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
  'If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund or can reschedule to another available day, subject to our Terms & Conditions. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.',
  '11-01',
  '03-31',
  '20:00',
  'Northern Lights Standard Group Bus Tour Rovaniemi | Royal Nordic',
  'Large-group Northern Lights bus tour from Rovaniemi, from €60 per person. Departs Ruokasenkatu 3 at 20:00, 1 November–31 March. Up to 50 guests. Hotel pickup is not included.',
  '/nortti5.jpg',
  '/nortti5.jpg',
  '[
    {"id":"g1","url":"/nortti5.jpg","alt":"Northern Lights over a snowy forest in Finnish Lapland","sort":0,"is_hero":true},
    {"id":"g2","url":"/nortti1.jpg","alt":"Aurora Borealis on a winter night near Rovaniemi","sort":1,"is_hero":false},
    {"id":"g3","url":"/nortti3.jpg","alt":"Green aurora above the Lappish wilderness","sort":2,"is_hero":false},
    {"id":"g4","url":"/lights7.jpg","alt":"Northern Lights above snowy Lapland trees","sort":3,"is_hero":false}
  ]'::jsonb,
  '[
    {"id":"f1","question":"Is this a small-group tour with hotel pickup?","answer":"No. This is a large-group bus tour for up to 50 guests. You meet the bus at Ruokasenkatu 3, 96100 Rovaniemi. Hotel pickup and drop-off are not included.","sort":0},
    {"id":"f2","question":"What time does the tour depart?","answer":"The bus departs at 20:00 from Ruokasenkatu 3. The tour lasts about 5 hours, depending on weather and viewing conditions.","sort":1},
    {"id":"f3","question":"When can I book?","answer":"The season is 1 November through 31 March. Dates outside that season are closed. Inside the season, only dates opened for this departure can be booked.","sort":2},
    {"id":"f4","question":"What if we do not see the Northern Lights?","answer":"If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund or can reschedule to another available day, subject to our Terms & Conditions. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.","sort":3},
    {"id":"f5","question":"What is the cancellation policy?","answer":"Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.","sort":4},
    {"id":"f6","question":"Are thermal clothes, food, or drinks included?","answer":"No. Bring your own thermal clothing and anything you want to eat or drink. Bus transportation, an English-speaking guide, and professional aurora photography are included.","sort":5}
  ]'::jsonb,
  'Unpublished until booking is verified. Open individual dates in Availability — do not open every day, and do not open dates outside 1 November–31 March. Capacity is 50 guests per departure and is not shared with other Northern Lights products. Hotel pickup is not included.',
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
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  seo_image = EXCLUDED.seo_image,
  hero_image_url = EXCLUDED.hero_image_url,
  gallery = EXCLUDED.gallery,
  faq = EXCLUDED.faq,
  operational_notes = EXCLUDED.operational_notes,
  sale_enabled = EXCLUDED.sale_enabled,
  reference_price = EXCLUDED.reference_price,
  cms_updated_at = NOW();
  -- is_active is intentionally not overwritten, so a later publish is kept.

SELECT setval(
  pg_get_serial_sequence('public.tours', 'id'),
  (SELECT COALESCE(MAX(id), 1) FROM public.tours)
);
