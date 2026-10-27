-- Standard Group NL: include warm drink and snacks; exclude meals (not "food and drinks").
UPDATE public.tours
SET
  included_items = '[
    {"id":"i1","text":"Bus transportation","sort":0},
    {"id":"i2","text":"English-speaking guide","sort":1},
    {"id":"i3","text":"Professional aurora photography","sort":2},
    {"id":"i5","text":"Warm drink and snacks","sort":3},
    {"id":"i4","text":"Applicable Northern Lights guarantee","sort":4}
  ]'::jsonb,
  excluded_items = '[
    {"id":"e1","text":"Hotel pickup and drop-off","sort":0},
    {"id":"e2","text":"Thermal clothing","sort":1},
    {"id":"e3","text":"Meals","sort":2}
  ]'::jsonb,
  what_to_bring = 'Bring your own thermal layers, windproof outerwear, warm boots, hat, and gloves. Thermal clothing is not included. A warm drink and snacks are provided on the tour; meals are not.',
  faq = '[
    {"id":"f1","question":"Is this a small-group tour with hotel pickup?","answer":"No. This is a large-group bus tour for up to 50 guests. You meet the bus at Ruokasenkatu 3, 96100 Rovaniemi. Hotel pickup and drop-off are not included.","sort":0},
    {"id":"f2","question":"What time does the tour depart?","answer":"The bus departs at 20:00 from Ruokasenkatu 3. The tour lasts about 5 hours, depending on weather and viewing conditions.","sort":1},
    {"id":"f3","question":"When can I book?","answer":"The season is 1 November through 31 March. Dates outside that season are closed. Inside the season, only dates opened for this departure can be booked.","sort":2},
    {"id":"f4","question":"What if we do not see the Northern Lights?","answer":"If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund or can reschedule to another available day, subject to our Terms & Conditions. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.","sort":3},
    {"id":"f5","question":"What is the cancellation policy?","answer":"Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.","sort":4},
    {"id":"f6","question":"Are thermal clothes or meals included?","answer":"Thermal clothing and meals are not included. A warm drink and snacks are provided on the tour. Bus transportation, an English-speaking guide, and professional aurora photography are included.","sort":5}
  ]'::jsonb
WHERE id = 10;
