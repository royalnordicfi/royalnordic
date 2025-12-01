-- Add Korouoma Canyon Winter Adventure tour to the database

-- Insert Korouoma Canyon tour
INSERT INTO tours (id, name, description, adult_price, child_price, max_capacity) 
VALUES (
    6, 
    'Korouoma Canyon Winter Adventure', 
    'Hike to magnificent frozen waterfalls and enjoy grilled food in the stunning winter landscape. Experience one of Lapland most beautiful natural wonders with professional guidance',
    116.00, 
    116.00, 
    10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  adult_price = EXCLUDED.adult_price,
  child_price = EXCLUDED.child_price,
  max_capacity = EXCLUDED.max_capacity;

-- Insert Korouoma Canyon dates for November 1, 2025 - April 30, 2026 (winter season only)
DO $$
DECLARE
  korouoma_tour_id BIGINT := 6;
  tour_date DATE := '2025-11-01'::DATE;
  end_date DATE := '2026-04-30'::DATE;
BEGIN
  WHILE tour_date <= end_date LOOP
    INSERT INTO tour_dates (tour_id, date, available_slots) 
    VALUES (korouoma_tour_id, tour_date, 10)
    ON CONFLICT (tour_id, date) DO NOTHING;
    
    tour_date := tour_date + INTERVAL '1 day';
  END LOOP;
END $$;

-- Success message
SELECT 'Korouoma Canyon Winter Adventure tour added successfully!' as status;
SELECT 'Available dates: Nov 1, 2025 - Apr 30, 2026' as season;
SELECT 'Price: €116 per person (same for adults and children)' as pricing;

