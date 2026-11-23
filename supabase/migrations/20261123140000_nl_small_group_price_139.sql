-- Small Group Northern Lights (tour id 1): catalogue sale €179/€159 → €139/€119.
-- Does not modify historical bookings; checkout charges live tours.adult_price / child_price.

UPDATE public.tours
SET
  adult_price = 139.00,
  child_price = 119.00,
  reference_price = 179.00,
  sale_enabled = true,
  sale_label = 'Special offer',
  seo_description = 'Book a small-group Northern Lights & photography tour from Rovaniemi from €139: hotel pickup, expert guides, free professional photos, and a 100% camera-capture aurora guarantee. Free cancellation 24h.',
  cms_updated_at = now()
WHERE id = 1;
