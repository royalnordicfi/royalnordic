-- Private Santa Claus Experience (id 12)
-- Flat group price €1,169 (reference €1,299). Max 6 guests. Exclusive per-vehicle inventory.
-- Absolute operating season: 2026-11-15 – 2027-03-31 (Europe/Helsinki calendar dates).
-- season_start/season_end left NULL — do NOT use recurring MM-DD Northern Lights seasons.

CREATE OR REPLACE FUNCTION public.prevent_private_santa_oversell()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  remaining integer;
  date_tour_id integer;
BEGIN
  IF NEW.tour_id <> 12 OR NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  IF NEW.tour_date_id IS NULL THEN
    RAISE EXCEPTION 'Private Santa Claus bookings require a departure date'
      USING ERRCODE = '23514';
  END IF;

  SELECT tour_id, available_slots - COALESCE(total_booked, 0)
    INTO date_tour_id, remaining
  FROM public.tour_dates
  WHERE id = NEW.tour_date_id
  FOR UPDATE;

  IF date_tour_id IS NULL OR date_tour_id <> 12 THEN
    RAISE EXCEPTION 'Departure date does not belong to the Private Santa Claus Experience'
      USING ERRCODE = '23514';
  END IF;

  IF remaining < 1 THEN
    RAISE EXCEPTION 'This private Santa departure is already reserved'
      USING ERRCODE = '23514';
  END IF;

  IF COALESCE(NEW.adults, 0) + COALESCE(NEW.children, 0) < 1
     OR COALESCE(NEW.adults, 0) + COALESCE(NEW.children, 0) > 6 THEN
    RAISE EXCEPTION 'Private Santa Claus Experience accepts 1–6 guests'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_private_santa_oversell ON public.bookings;
CREATE TRIGGER prevent_private_santa_oversell
  BEFORE INSERT OR UPDATE OF tour_id, tour_date_id, adults, children, status
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_private_santa_oversell();

-- Reject opening inventory outside the absolute Santa season.
CREATE OR REPLACE FUNCTION public.enforce_private_santa_date_window()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tour_id <> 12 THEN
    RETURN NEW;
  END IF;
  IF NEW.date < DATE '2026-11-15' OR NEW.date > DATE '2027-03-31' THEN
    RAISE EXCEPTION 'Private Santa Claus Experience dates must be between 2026-11-15 and 2027-03-31'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_private_santa_date_window ON public.tour_dates;
CREATE TRIGGER enforce_private_santa_date_window
  BEFORE INSERT OR UPDATE OF tour_id, date
  ON public.tour_dates
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_private_santa_date_window();

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
  reference_price,
  sale_label
) VALUES (
  12,
  'Private Santa Claus Experience',
  'Private Santa Claus Experience in Rovaniemi',
  'Exclusive private meeting with Santa Claus in Rovaniemi for your group of up to six guests. €1,169 per private group. Private transfers and festive treats included.',
  1169.00,
  1169.00,
  6,
  true,
  'Approximately 1.5 hours',
  'Private · max 6',
  'Rovaniemi',
  'Experience the magic of Christmas with an exclusive private visit to Santa Claus in Rovaniemi. Enjoy a cozy festive atmosphere, personal time with Santa, Christmas treats, and comfortable private transportation for your group.',
  'Exclusive private meeting with Santa Claus in Rovaniemi, including private transportation and festive treats.',
  'Make your visit to Lapland truly unforgettable with an exclusive Private Santa Claus Experience in Rovaniemi.

Your magical Christmas journey begins with comfortable private transportation from your accommodation. Travel to a cozy and traditional Christmas setting, where Santa Claus is waiting to welcome you and your loved ones.

Unlike busy public Santa attractions, this experience is reserved exclusively for your group, allowing you to enjoy a more personal and memorable meeting with Santa.

Spend quality time together, share your Christmas wishes, enjoy warm drinks and festive treats, and capture your own photographs and videos of this special moment.

After your visit, your private driver will take you comfortably back to your accommodation in Rovaniemi.

Perfect for families, couples and anyone looking for an unforgettable Christmas experience in Lapland.',
  'PRIVATE',
  '[
    {"id":"sh1","text":"Enjoy an exclusive private meeting with Santa Claus in Rovaniemi.","sort":0},
    {"id":"sh2","text":"Experience Christmas magic in a cozy, traditional setting.","sort":1},
    {"id":"sh3","text":"Spend personal time with Santa away from crowded tourist areas.","sort":2},
    {"id":"sh4","text":"Enjoy warm drinks and delicious Christmas treats.","sort":3},
    {"id":"sh5","text":"Capture memorable photographs and videos with Santa.","sort":4},
    {"id":"sh6","text":"Travel comfortably with private round-trip transportation.","sort":5}
  ]'::jsonb,
  '[
    {"id":"si1","text":"Exclusive private Santa Claus meeting","sort":0},
    {"id":"si2","text":"Private round-trip transportation","sort":1},
    {"id":"si3","text":"Accommodation pickup and return in Rovaniemi","sort":2},
    {"id":"si4","text":"Personal time with Santa Claus","sort":3},
    {"id":"si5","text":"Warm drinks and Christmas treats","sort":4},
    {"id":"si6","text":"Opportunity to take personal photos and videos","sort":5}
  ]'::jsonb,
  '[
    {"id":"sx1","text":"Personal purchases and souvenirs","sort":0},
    {"id":"sx2","text":"Additional meals and drinks","sort":1},
    {"id":"sx3","text":"Professional photography services","sort":2},
    {"id":"sx4","text":"Optional gratuities","sort":3}
  ]'::jsonb,
  'Private pickup, exclusive Santa meeting, festive treats, and return transfer. About 1.5 hours in total.',
  'The Santa meeting takes place indoors in a cozy Christmas setting. Guests may take their own photographs and videos. Warm drinks and Christmas treats are included. Suitable for families, couples and private groups.',
  'This is a private experience for a maximum of six participants. Only your booked group participates in the Santa meeting. Free cancellation up to 24 hours before departure.',
  'Warm winter clothing, camera or smartphone, and Christmas wishes for Santa.',
  'Private accommodation pickup and return within the supported Rovaniemi pickup area. Exact pickup time is confirmed before the experience. Guests should be ready at their confirmed pickup location.',
  'Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
  null,
  null,
  null,
  null,
  'per_vehicle',
  'Private Santa Claus Experience in Rovaniemi | Royal Nordic',
  'Meet Santa Claus on an exclusive private Christmas experience in Rovaniemi. Private transfers, festive treats and personal time with Santa for up to six guests.',
  '/santaclaus1.jpg',
  '/santaclaus1.jpg',
  '[
    {"id":"sg1","url":"/santaclaus1.jpg","alt":"Private Santa Claus meeting in Rovaniemi","sort":0,"is_hero":true},
    {"id":"sg2","url":"/santaclaus2.jpg","alt":"Festive Santa Claus Christmas scene","sort":1},
    {"id":"sg3","url":"/santaclaus3.jpg","alt":"Cozy Christmas fireplace setting","sort":2},
    {"id":"sg4","url":"/santaclaus4.jpg","alt":"Santa Claus seated indoors for a private visit","sort":3},
    {"id":"sg5","url":"/santaclaus5.jpg","alt":"Christmas details during the Santa experience","sort":4},
    {"id":"sg6","url":"/santaclaus6.jpg","alt":"Festive Santa Claus atmosphere in Lapland","sort":5}
  ]'::jsonb,
  '[
    {"id":"sf1","question":"Is this a shared group experience?","answer":"No. This experience is reserved exclusively for your private group of up to six participants. Other customers are not added to your booking.","sort":0},
    {"id":"sf2","question":"How does pricing work?","answer":"The price is €1,169 for the entire private group, whether you book for one guest or six. The price is not multiplied by the number of participants.","sort":1},
    {"id":"sf3","question":"Is hotel pickup included?","answer":"Yes. Private accommodation pickup and return within the supported Rovaniemi area are included. Enter your hotel or pickup address at checkout. Exact pickup time is confirmed before the experience.","sort":2},
    {"id":"sf4","question":"How long is the experience?","answer":"Approximately 1.5 hours in total, including private transportation and your exclusive Santa Claus meeting.","sort":3},
    {"id":"sf5","question":"When can I book?","answer":"This experience operates from 15 November 2026 through 31 March 2027. Dates outside that window cannot be booked.","sort":4},
    {"id":"sf6","question":"What is the cancellation policy?","answer":"Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.","sort":5}
  ]'::jsonb,
  'Absolute season 2026-11-15 to 2027-03-31. Per-group €1169. Exclusive inventory (available_slots=1). Pickup time confirmed operationally — do not invent fixed clock times.',
  true,
  1299.00,
  'Season offer'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public_name = EXCLUDED.public_name,
  description = EXCLUDED.description,
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  max_capacity = EXCLUDED.max_capacity,
  is_active = EXCLUDED.is_active,
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
  season_start = NULL,
  season_end = NULL,
  departure_time = NULL,
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
  sale_label = EXCLUDED.sale_label,
  cms_updated_at = now();

-- Seed exclusive daily inventory for the absolute season only.
INSERT INTO public.tour_dates (tour_id, date, available_slots, total_booked)
SELECT 12, d::date, 1, 0
FROM generate_series(DATE '2026-11-15', DATE '2027-03-31', INTERVAL '1 day') AS d
ON CONFLICT (tour_id, date) DO UPDATE
SET available_slots = GREATEST(public.tour_dates.available_slots, 1);

SELECT setval(
  pg_get_serial_sequence('public.tours', 'id'),
  GREATEST((SELECT MAX(id) FROM public.tours), 12)
);
