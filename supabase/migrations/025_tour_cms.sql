-- Tour CMS: commercial content + sale pricing owned by Admin (not code).
-- Preserves tour IDs, bookings, and adult_price as the charged bookable price.

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS card_description TEXT,
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS included_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS excluded_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS what_to_expect TEXT,
  ADD COLUMN IF NOT EXISTS important_info TEXT,
  ADD COLUMN IF NOT EXISTS know_before TEXT,
  ADD COLUMN IF NOT EXISTS what_to_bring TEXT,
  ADD COLUMN IF NOT EXISTS pickup_info TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_info TEXT,
  ADD COLUMN IF NOT EXISTS guarantee_info TEXT,
  ADD COLUMN IF NOT EXISTS reference_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS sale_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_label TEXT,
  ADD COLUMN IF NOT EXISTS sale_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sale_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS badge TEXT,
  ADD COLUMN IF NOT EXISTS group_size_text TEXT,
  ADD COLUMN IF NOT EXISTS meeting_point TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_image TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cms_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.tours.adult_price IS 'Current bookable adult price (EUR). Checkout always uses this.';
COMMENT ON COLUMN public.tours.reference_price IS 'Optional was/original price for sale display only. Never charged.';
COMMENT ON COLUMN public.tours.sale_enabled IS 'When true (and within optional dates), public UI may show reference_price struck through.';

-- Public read already exists on tours. Ensure storage bucket for tour media.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tour-media',
  'tour-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "tour_media_public_read" ON storage.objects;
CREATE POLICY "tour_media_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'tour-media');

DROP POLICY IF EXISTS "tour_media_admin_insert" ON storage.objects;
CREATE POLICY "tour_media_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tour-media' AND public.is_admin());

DROP POLICY IF EXISTS "tour_media_admin_update" ON storage.objects;
CREATE POLICY "tour_media_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tour-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'tour-media' AND public.is_admin());

DROP POLICY IF EXISTS "tour_media_admin_delete" ON storage.objects;
CREATE POLICY "tour_media_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tour-media' AND public.is_admin());

-- Seed Guaranteed Northern Lights (tour id 1) commercial CMS from current product truth.
-- adult_price remains the charged price (€ reference_price is display-only when sale_enabled.
UPDATE public.tours
SET
  adult_price = 99,
  child_price = 99,
  reference_price = 129,
  sale_enabled = true,
  sale_label = 'Special offer',
  public_name = COALESCE(NULLIF(public_name, ''), 'Guaranteed Northern Lights Tour'),
  tagline = 'See the Aurora or get your money back.',
  card_description = 'See the Aurora or get your money back. Hotel pickup and free professional photos included.',
  full_description = 'Hunt the Aurora Borealis from Rovaniemi with local guides who read live solar and weather data, then drive as far as needed for clearer skies — including across borders when conditions call for it. Hotel pickup, a warm vehicle, hot drinks, and professional photos of you with the Northern Lights are included.',
  duration_text = '2–10 h (~6h)',
  group_size_text = 'Max 8 / vehicle',
  badge = '100% GUARANTEE',
  meeting_point = 'Hotel pickup and drop-off in the Rovaniemi area',
  pickup_info = 'We offer hotel pickup and drop-off in the Rovaniemi area. Exact pickup time is confirmed after booking — please be ready 10–30 minutes before the standard 18:30 pickup window.',
  what_to_bring = 'Dress in warm layers: thermal base, insulating mid-layer, windproof outerwear, warm boots, hat, and gloves. Tell us about snack allergies when you book.',
  know_before = 'Auroras often look more colourful in photos than with the naked eye. Our guarantee is based on what our professional cameras capture during your tour. Extreme weather or unsafe roads may lead to cancel or reschedule per our Terms. Free cancellation up to 24 hours before departure.',
  cancellation_info = 'Free cancellation up to 24 hours before departure. Late cancellations within 24 hours are non-refundable.',
  guarantee_info = 'If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.',
  important_info = 'Children welcome (ages 0–17 child pricing). The evening can be long and cold outdoors — warm clothing and stamina matter.',
  what_to_expect = 'Standard pickup from 18:30. We chase clearer skies using live forecasts, stop for photos and warm drinks, then return you to your hotel — usually between midnight and early morning depending on distance.',
  seo_title = 'Guaranteed Northern Lights Tour Rovaniemi | Royal Nordic',
  seo_description = 'Book a guaranteed Northern Lights tour from Rovaniemi from €99: small-group aurora hunt, hotel pickup, expert guides, and free professional photos of you with the aurora. See the Aurora or get your money back. Free cancellation 24h.',
  seo_image = '/nortti1.jpg',
  hero_image_url = '/nortti1.jpg',
  highlights = '[
    {"id":"h1","text":"100% Aurora Guarantee","sort":0},
    {"id":"h2","text":"Free Professional Photos","sort":1},
    {"id":"h3","text":"Hotel Pickup & Drop-off","sort":2},
    {"id":"h4","text":"Expert Local Guides","sort":3},
    {"id":"h5","text":"Flexible 2–10 Hour Aurora Hunt","sort":4}
  ]'::jsonb,
  included_items = '[
    {"id":"i1","text":"100% Aurora Guarantee — full refund if not captured on our cameras (see Terms)","sort":0},
    {"id":"i2","text":"Free professional photos of you with the Northern Lights","sort":1},
    {"id":"i3","text":"Small group — max 8 people per vehicle","sort":2},
    {"id":"i4","text":"Hotel pickup and drop-off in the Rovaniemi area","sort":3},
    {"id":"i5","text":"Flexible 2–10 hour hunt based on live aurora forecasts","sort":4},
    {"id":"i6","text":"English & Finnish speaking local guides","sort":5},
    {"id":"i7","text":"Warm drinks and snacks","sort":6}
  ]'::jsonb,
  excluded_items = '[
    {"id":"e1","text":"Clothing and personal equipment (bring warm Arctic layers)","sort":0}
  ]'::jsonb,
  gallery = '[
    {"id":"g1","url":"/nortti1.jpg","alt":"Guests watching the Northern Lights on a Royal Nordic tour","sort":0,"is_hero":true},
    {"id":"g2","url":"/nortti3.jpg","alt":"Aurora display over Finnish Lapland wilderness","sort":1,"is_hero":false},
    {"id":"g3","url":"/nortti5.jpg","alt":"Green aurora ribbons above snowy forest near Rovaniemi","sort":2,"is_hero":false},
    {"id":"g4","url":"/lights7.jpg","alt":"Northern Lights over snowy Lapland forest","sort":3,"is_hero":false},
    {"id":"g5","url":"/lights8.jpg","alt":"Aurora Borealis reflecting above Arctic landscape","sort":4,"is_hero":false},
    {"id":"g6","url":"/nortti9.jpg","alt":"Clear winter night during an aurora hunt","sort":5,"is_hero":false}
  ]'::jsonb,
  faq = '[
    {"id":"f1","question":"What happens if we don’t see the Northern Lights?","answer":"If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.","sort":0},
    {"id":"f2","question":"How does the Aurora guarantee work?","answer":"If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.","sort":1},
    {"id":"f3","question":"Are professional photos included?","answer":"Yes — free. Your guide takes professional photos of you with the Northern Lights during the tour. This is not photography advice; we photograph you beneath the aurora.","sort":2},
    {"id":"f4","question":"How long does the tour take?","answer":"Duration is flexible based on aurora forecasts — typically around six hours, and between about 2 and 10 hours when we travel farther for clearer skies.","sort":3},
    {"id":"f5","question":"Is hotel pickup included?","answer":"Yes. We offer hotel pickup and drop-off in the Rovaniemi area. Exact pickup time is confirmed after booking — please be ready 10–30 minutes before the standard 18:30 pickup window.","sort":4},
    {"id":"f6","question":"What should I wear?","answer":"Dress in warm Arctic layers: thermal base, insulating mid-layer, windproof outerwear, warm boots, hat, and gloves.","sort":5}
  ]'::jsonb,
  cms_updated_at = NOW()
WHERE id = 1
   OR name IN ('Northern Lights Tour', 'Guaranteed Northern Lights Tour');
