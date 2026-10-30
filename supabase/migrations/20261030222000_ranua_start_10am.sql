-- Ranua Wildlife Park: published start time 10:00.
-- Exact hotel pickup time is confirmed after booking (not a fixed door-to-door clock).

UPDATE public.tours
SET
  departure_time = '10:00',
  duration_text = 'About 5 hours · Starts 10:00',
  pickup_info = 'Round-trip transportation from the supported Rovaniemi area is included. Enter your hotel or pickup address at checkout. The experience starts at 10:00; exact pickup time is sent after booking.',
  know_before = 'This is a self-guided park visit. Your driver provides transportation, not a guided tour inside the park. Entrance tickets are included. The experience starts at 10:00; exact pickup time is sent after booking. Explore at your own pace within the scheduled visit window. Return departure time and meeting location are communicated to guests before the return drive.',
  seo_description = 'Round-trip transfer from Rovaniemi with Ranua Wildlife Park admission included. Self-guided park visit — no guided tour. Starts 10:00. About 5 hours. Free cancellation 24h.',
  faq = '[
    {"id":"rf1","question":"Is this a guided tour of the park?","answer":"No. This is a self-guided park visit. Royal Nordic provides round-trip transportation and your entrance ticket. You explore Ranua Wildlife Park independently. The driver is not a park guide.","sort":0},
    {"id":"rf2","question":"Are entrance tickets included?","answer":"Yes. Ranua Wildlife Park admission is always included in this product. There is no transfer-only option on royalnordic.fi.","sort":1},
    {"id":"rf3","question":"What time does the experience start?","answer":"The experience starts at 10:00. Exact hotel pickup time is sent after booking — please be ready at your confirmed pickup location.","sort":2},
    {"id":"rf4","question":"How long is the experience?","answer":"About 5 hours in total, including transfers and time to explore the park. Start time is 10:00; exact pickup time is confirmed after booking.","sort":3},
    {"id":"rf5","question":"Is hotel pickup included?","answer":"Round-trip transportation from the Rovaniemi area is included. Enter your hotel or pickup address at checkout. Exact pickup time is sent after booking.","sort":4},
    {"id":"rf6","question":"Is it good for families?","answer":"Yes. Child pricing applies for ages 0–17. The park has walking paths suited to a relaxed, independent visit.","sort":5},
    {"id":"rf7","question":"What should we wear?","answer":"Warm winter clothing and comfortable walking shoes are recommended. Clothing rental is not included.","sort":6},
    {"id":"rf8","question":"What is the cancellation policy?","answer":"Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.","sort":7}
  ]'::jsonb,
  cms_updated_at = now()
WHERE id = 5;
