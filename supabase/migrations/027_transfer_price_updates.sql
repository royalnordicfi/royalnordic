-- Update Saariselkä private transfer (tour id 9) to €849 / vehicle / one way.
-- Does not modify historical bookings; checkout reads live tours.adult_price.

UPDATE public.tours
SET
  adult_price = 849.00,
  child_price = 849.00,
  tagline = 'Private door-to-door transfer between Rovaniemi and Saariselkä. €849 per vehicle, one way, up to 8 passengers subject to luggage.',
  card_description = '€849 per vehicle, one way — airport, hotel or accommodation pickup.',
  description = 'Private vehicle with professional driver between Rovaniemi and Saariselkä. Price is per vehicle for one way, not per passenger. Capacity up to 8 guests subject to luggage. Tell us direction, pickup time, flight number and luggage needs when you book.',
  highlights = '[
    {"id":"h1","text":"€849 flat rate per vehicle, one way","sort":0},
    {"id":"h2","text":"Door-to-door: airport, hotel or accommodation","sort":1},
    {"id":"h3","text":"Up to 8 passengers depending on luggage","sort":2}
  ]'::jsonb,
  seo_description = 'Book a private Rovaniemi–Saariselkä transfer from €849 per vehicle one way. Airport and hotel pickup across Finnish Lapland.',
  updated_at = NOW()
WHERE id = 9;
