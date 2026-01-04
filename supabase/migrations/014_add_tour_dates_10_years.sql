-- Add tour dates for all tours for the next 10+ years (2025-2035)
-- This migration ensures all tours have dates available in the database
-- Run this in your Supabase SQL Editor

-- Tour 1: Guaranteed Northern Lights Tour (Sep 15 - Apr 15, repeating yearly)
DO $$
DECLARE
  v_tour_id BIGINT := 1;
  start_year INTEGER := 2025;
  end_year INTEGER := 2035;
  current_year INTEGER;
  tour_date DATE;
  season_start_month INTEGER := 9;  -- September
  season_start_day INTEGER := 15;
  season_end_month INTEGER := 4;    -- April
  season_end_day INTEGER := 15;
BEGIN
  FOR current_year IN start_year..end_year LOOP
    -- Season starts Sep 15 of current year, ends Apr 15 of next year
    tour_date := make_date(current_year, season_start_month, season_start_day);
    WHILE tour_date <= make_date(current_year + 1, season_end_month, season_end_day) LOOP
      INSERT INTO tour_dates (tour_id, date, available_slots) 
      VALUES (v_tour_id, tour_date, 16)
      ON CONFLICT (tour_id, date) DO NOTHING;
      
      tour_date := tour_date + INTERVAL '1 day';
    END LOOP;
  END LOOP;
END $$;

-- Tour 2: Snowshoe Adventure (Nov 1 - Apr 1, repeating yearly)
DO $$
DECLARE
  v_tour_id BIGINT := 2;
  start_year INTEGER := 2025;
  end_year INTEGER := 2035;
  current_year INTEGER;
  tour_date DATE;
  season_start_month INTEGER := 11;  -- November
  season_start_day INTEGER := 1;
  season_end_month INTEGER := 4;     -- April
  season_end_day INTEGER := 1;
BEGIN
  FOR current_year IN start_year..end_year LOOP
    -- Season starts Nov 1 of current year, ends Apr 1 of next year
    tour_date := make_date(current_year, season_start_month, season_start_day);
    WHILE tour_date <= make_date(current_year + 1, season_end_month, season_end_day) LOOP
      INSERT INTO tour_dates (tour_id, date, available_slots) 
      VALUES (v_tour_id, tour_date, 3)
      ON CONFLICT (tour_id, date) DO NOTHING;
      
      tour_date := tour_date + INTERVAL '1 day';
    END LOOP;
  END LOOP;
END $$;

-- Tour 4: Ice Fishing Experience (Dec 15 - Mar 15, repeating yearly)
DO $$
DECLARE
  v_tour_id BIGINT := 4;
  start_year INTEGER := 2025;
  end_year INTEGER := 2035;
  current_year INTEGER;
  tour_date DATE;
  season_start_month INTEGER := 12;  -- December
  season_start_day INTEGER := 15;
  season_end_month INTEGER := 3;     -- March
  season_end_day INTEGER := 15;
BEGIN
  FOR current_year IN start_year..end_year LOOP
    -- Season starts Dec 15 of current year, ends Mar 15 of next year
    tour_date := make_date(current_year, season_start_month, season_start_day);
    WHILE tour_date <= make_date(current_year + 1, season_end_month, season_end_day) LOOP
      INSERT INTO tour_dates (tour_id, date, available_slots) 
      VALUES (v_tour_id, tour_date, 16)
      ON CONFLICT (tour_id, date) DO NOTHING;
      
      tour_date := tour_date + INTERVAL '1 day';
    END LOOP;
  END LOOP;
END $$;

-- Tour 5: Ranua Zoo (Open all year, repeating yearly)
DO $$
DECLARE
  v_tour_id BIGINT := 5;
  start_year INTEGER := 2025;
  end_year INTEGER := 2035;
  current_year INTEGER;
  tour_date DATE;
  year_start DATE;
  year_end DATE;
BEGIN
  FOR current_year IN start_year..end_year LOOP
    -- Ranua Zoo is open all year
    year_start := make_date(current_year, 1, 1);
    year_end := make_date(current_year, 12, 31);
    tour_date := year_start;
    
    WHILE tour_date <= year_end LOOP
      INSERT INTO tour_dates (tour_id, date, available_slots) 
      VALUES (v_tour_id, tour_date, 16)
      ON CONFLICT (tour_id, date) DO NOTHING;
      
      tour_date := tour_date + INTERVAL '1 day';
    END LOOP;
  END LOOP;
END $$;

-- Tour 6: Korouoma Canyon Winter Adventure (Open all year, repeating yearly)
DO $$
DECLARE
  v_tour_id BIGINT := 6;
  start_year INTEGER := 2025;
  end_year INTEGER := 2035;
  current_year INTEGER;
  tour_date DATE;
  year_start DATE;
  year_end DATE;
BEGIN
  FOR current_year IN start_year..end_year LOOP
    -- Korouoma is open all year
    year_start := make_date(current_year, 1, 1);
    year_end := make_date(current_year, 12, 31);
    tour_date := year_start;
    
    WHILE tour_date <= year_end LOOP
      INSERT INTO tour_dates (tour_id, date, available_slots) 
      VALUES (v_tour_id, tour_date, 16)
      ON CONFLICT (tour_id, date) DO NOTHING;
      
      tour_date := tour_date + INTERVAL '1 day';
    END LOOP;
  END LOOP;
END $$;

-- Tour 8: Family-Friendly Northern Lights Tour (Sep 15 - Apr 15, repeating yearly)
DO $$
DECLARE
  v_tour_id BIGINT := 8;
  start_year INTEGER := 2025;
  end_year INTEGER := 2035;
  current_year INTEGER;
  tour_date DATE;
  season_start_month INTEGER := 9;   -- September
  season_start_day INTEGER := 15;
  season_end_month INTEGER := 4;     -- April
  season_end_day INTEGER := 15;
BEGIN
  FOR current_year IN start_year..end_year LOOP
    -- Season starts Sep 15 of current year, ends Apr 15 of next year
    tour_date := make_date(current_year, season_start_month, season_start_day);
    WHILE tour_date <= make_date(current_year + 1, season_end_month, season_end_day) LOOP
      INSERT INTO tour_dates (tour_id, date, available_slots) 
      VALUES (v_tour_id, tour_date, 16)
      ON CONFLICT (tour_id, date) DO NOTHING;
      
      tour_date := tour_date + INTERVAL '1 day';
    END LOOP;
  END LOOP;
END $$;

-- Success message
SELECT 'Tour dates added successfully for 2025-2035!' as status;
SELECT 'Tour 1: Guaranteed Northern Lights (Sep 15 - Apr 15)' as tour1;
SELECT 'Tour 2: Snowshoe Adventure (Nov 1 - Apr 1)' as tour2;
SELECT 'Tour 4: Ice Fishing (Dec 15 - Mar 15)' as tour4;
SELECT 'Tour 5: Ranua Zoo (All year)' as tour5;
SELECT 'Tour 6: Korouoma Canyon (All year)' as tour6;
SELECT 'Tour 8: Family-Friendly Northern Lights (Sep 15 - Apr 15)' as tour8;

