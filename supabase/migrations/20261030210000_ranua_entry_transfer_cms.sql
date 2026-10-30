-- Ranua Wildlife Park: customer-facing identity as entry ticket + round-trip transfer.
-- Self-guided park visit. Prices and capacity unchanged. Historical bookings preserved.

UPDATE tours
SET
  public_name = 'Ranua Wildlife Park – Entry Ticket & Round-Trip Transfer',
  description = 'Round-trip transportation from Rovaniemi with Ranua Wildlife Park admission included. Independent park visit — no guided tour.',
  tagline = 'Discover the Arctic wildlife of Ranua Wildlife Park at your own pace. Enjoy comfortable round-trip transportation from Rovaniemi with your entrance ticket included. Explore the park independently, without a guided tour.',
  card_description = 'Round-trip transfer from Rovaniemi with park admission included. Explore independently — no guided tour.',
  full_description = 'Round-trip transportation from Rovaniemi to Ranua Wildlife Park with park admission included. Meet polar bears and 50+ Arctic and northern species on forest trails — lynx, wolves, moose, reindeer, arctic foxes, and more. You explore the park independently at your own pace. Your driver provides transportation, not a guided tour inside the park.',
  duration_text = '~5 hours',
  group_size_text = 'Max 16',
  meeting_point = 'Rovaniemi',
  pickup_info = 'Round-trip transportation from the supported Rovaniemi area is included. Enter your hotel or pickup address at checkout. Exact pickup and return meeting details are confirmed before departure.',
  what_to_bring = 'Warm winter clothing and comfortable walking shoes. A camera or smartphone is recommended. Clothing rental is not included.',
  know_before = 'This is a self-guided park visit. Your driver provides transportation, not a guided tour inside the park. Entrance tickets are included. Explore at your own pace within the scheduled visit window. Return departure time and meeting location are communicated to guests before the return drive.',
  important_info = 'Meals and drinks are not included. Cafés and restaurants are available at the park.',
  cancellation_info = 'Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
  seo_title = 'Ranua Wildlife Park – Entry Ticket & Transfer | Royal Nordic',
  seo_description = 'Round-trip transfer from Rovaniemi with Ranua Wildlife Park admission included. Self-guided park visit — no guided tour. About 5 hours. Free cancellation 24h.',
  highlights = '[
    {"id":"rh1","text":"Round-trip transportation from Rovaniemi","sort":0},
    {"id":"rh2","text":"Wildlife park admission included","sort":1},
    {"id":"rh3","text":"Independent park visit — no guided tour","sort":2},
    {"id":"rh4","text":"Time to explore polar bears and 50+ Arctic species at your own pace","sort":3}
  ]'::jsonb,
  included_items = '[
    {"id":"ri1","text":"Round-trip transportation from Rovaniemi","sort":0},
    {"id":"ri2","text":"Ranua Wildlife Park admission ticket","sort":1},
    {"id":"ri3","text":"Professional driver","sort":2},
    {"id":"ri4","text":"Time to explore the park independently","sort":3},
    {"id":"ri5","text":"Return transportation to Rovaniemi","sort":4}
  ]'::jsonb,
  excluded_items = '[
    {"id":"rx1","text":"Guided wildlife park tour","sort":0},
    {"id":"rx2","text":"Meals and drinks","sort":1},
    {"id":"rx3","text":"Personal expenses","sort":2},
    {"id":"rx4","text":"Winter clothing rental","sort":3}
  ]'::jsonb,
  faq = '[
    {"id":"rf1","question":"Is this a guided tour of the park?","answer":"No. This is a self-guided park visit. Royal Nordic provides round-trip transportation and your entrance ticket. You explore Ranua Wildlife Park independently. The driver is not a park guide.","sort":0},
    {"id":"rf2","question":"Are entrance tickets included?","answer":"Yes. Ranua Wildlife Park admission is always included in this product. There is no transfer-only option on royalnordic.fi.","sort":1},
    {"id":"rf3","question":"How long is the experience?","answer":"About 5 hours in total, including transfers and time to explore the park. Exact pickup and return times are confirmed after booking.","sort":2},
    {"id":"rf4","question":"Is hotel pickup included?","answer":"Round-trip transportation from the Rovaniemi area is included. Enter your hotel or pickup address at checkout. Exact pickup time is confirmed before departure.","sort":3},
    {"id":"rf5","question":"Is it good for families?","answer":"Yes. Child pricing applies for ages 0–17. The park has walking paths suited to a relaxed, independent visit.","sort":4},
    {"id":"rf6","question":"What should we wear?","answer":"Warm winter clothing and comfortable walking shoes are recommended. Clothing rental is not included.","sort":5},
    {"id":"rf7","question":"What is the cancellation policy?","answer":"Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.","sort":6}
  ]'::jsonb,
  cms_updated_at = now()
WHERE id = 5;
