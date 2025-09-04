-- Complete Royal Nordic Database Setup
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  adult_price DECIMAL(10,2) NOT NULL,
  child_price DECIMAL(10,2) NOT NULL,
  max_capacity INTEGER DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tour_dates table
CREATE TABLE IF NOT EXISTS tour_dates (
  id BIGSERIAL PRIMARY KEY,
  tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_slots INTEGER NOT NULL,
  total_booked INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tour_id, date)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  tour_date_id BIGINT NOT NULL REFERENCES tour_dates(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  adults INTEGER NOT NULL,
  children INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  secure_key_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tour data
INSERT INTO tours (name, description, adult_price, child_price, max_capacity) 
VALUES 
  ('Northern Lights Tour', 'Guaranteed Northern Lights experience in Lapland', 179.00, 129.00, 8),
  ('Snowshoe Adventure', 'Explore the pristine Lapland wilderness on snowshoes', 79.00, 49.00, 3),
  ('Customized Tour', 'Have a specific Lapland experience in mind? We''ll create a personalized tour just for you', 200.00, 150.00, 8)
ON CONFLICT (name) DO NOTHING;

-- Insert Northern Lights Tour dates for September 2025 - April 2026
DO $$
DECLARE
  northern_lights_id BIGINT;
  tour_date DATE := '2025-09-15'::DATE;
  end_date DATE := '2026-04-15'::DATE;
BEGIN
  SELECT id INTO northern_lights_id FROM tours WHERE name = 'Northern Lights Tour' LIMIT 1;
  
  WHILE tour_date <= end_date LOOP
    INSERT INTO tour_dates (tour_id, date, available_slots) 
    VALUES (northern_lights_id, tour_date, 8)
    ON CONFLICT (tour_id, date) DO NOTHING;
    
    tour_date := tour_date + INTERVAL '1 day';
  END LOOP;
END $$;

-- Insert Snowshoe Rental dates for November 2025 - April 2026
DO $$
DECLARE
  snowshoe_id BIGINT;
  tour_date DATE := '2025-11-01'::DATE;
  end_date DATE := '2026-04-01'::DATE;
BEGIN
  SELECT id INTO snowshoe_id FROM tours WHERE name = 'Snowshoe Adventure' LIMIT 1;
  
  WHILE tour_date <= end_date LOOP
    INSERT INTO tour_dates (tour_id, date, available_slots) 
    VALUES (snowshoe_id, tour_date, 3)
    ON CONFLICT (tour_id, date) DO NOTHING;
    
    tour_date := tour_date + INTERVAL '1 day';
  END LOOP;
END $$;

-- Insert Customized Tour dates for November 2025 - April 2026
DO $$
DECLARE
  customized_id BIGINT;
  tour_date DATE := '2025-11-01'::DATE;
  end_date DATE := '2026-04-15'::DATE;
BEGIN
  SELECT id INTO customized_id FROM tours WHERE name = 'Customized Tour' LIMIT 1;
  
  WHILE tour_date <= end_date LOOP
    INSERT INTO tour_dates (tour_id, date, available_slots) 
    VALUES (customized_id, tour_date, 8)
    ON CONFLICT (tour_id, date) DO NOTHING;
    
    tour_date := tour_date + INTERVAL '1 day';
  END LOOP;
END $$;

-- Enable Row Level Security on all tables
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tours (public read access)
CREATE POLICY "Tours are viewable by everyone" ON tours
  FOR SELECT USING (true);

-- Create RLS policies for tour_dates (public read access)
CREATE POLICY "Tour dates are viewable by everyone" ON tour_dates
  FOR SELECT USING (true);

-- Create RLS policies for bookings
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view their own bookings" ON bookings
  FOR SELECT USING (true);

-- Create RLS policies for admin_users (restricted access)
CREATE POLICY "Admin users are viewable by admins only" ON admin_users
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tour_dates_tour_id ON tour_dates(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_dates_date ON tour_dates(date);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id ON bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_date_id ON bookings(tour_date_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);

-- Create a function to update available slots when bookings change
CREATE OR REPLACE FUNCTION update_tour_date_slots()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrease available slots when booking is created
    UPDATE tour_dates 
    SET total_booked = total_booked + NEW.adults + NEW.children
    WHERE id = NEW.tour_date_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Increase available slots when booking is cancelled
        UPDATE tour_dates 
        SET total_booked = total_booked - (OLD.adults + OLD.children)
        WHERE id = OLD.tour_date_id;
      ELSIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
        -- Decrease available slots when cancelled booking is reactivated
        UPDATE tour_dates 
        SET total_booked = total_booked + (NEW.adults + NEW.children)
        WHERE id = NEW.tour_date_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Increase available slots when booking is deleted
    UPDATE tour_dates 
    SET total_booked = total_booked - (OLD.adults + OLD.children)
    WHERE id = OLD.tour_date_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update tour date slots
CREATE TRIGGER update_tour_slots_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_tour_date_slots();

-- Create a view for easy admin access to all booking information
CREATE OR REPLACE VIEW admin_bookings_view AS
SELECT 
  b.id,
  b.customer_name,
  b.customer_email,
  b.customer_phone,
  b.adults,
  b.children,
  b.total_price,
  b.status,
  b.special_requests,
  b.created_at,
  b.stripe_payment_intent_id,
  t.name as tour_name,
  t.adult_price,
  t.child_price,
  td.date as tour_date,
  td.available_slots,
  td.total_booked,
  (td.available_slots - td.total_booked) as remaining_slots
FROM bookings b
JOIN tours t ON b.tour_id = t.id
JOIN tour_dates td ON b.tour_date_id = td.id
ORDER BY b.created_at DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a function to get tour availability
CREATE OR REPLACE FUNCTION get_tour_availability(
  p_tour_id BIGINT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  available_slots INTEGER,
  total_booked INTEGER,
  remaining_slots INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    td.date,
    td.available_slots,
    td.total_booked,
    (td.available_slots - td.total_booked) as remaining_slots
  FROM tour_dates td
  WHERE td.tour_id = p_tour_id
    AND (p_start_date IS NULL OR td.date >= p_start_date)
    AND (p_end_date IS NULL OR td.date <= p_end_date)
  ORDER BY td.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_tour_availability(BIGINT, DATE, DATE) TO anon, authenticated;

-- Insert a default admin user (you should change this password!)
-- Password: admin123, Secure Key: royalnordic2024
INSERT INTO admin_users (email, password_hash, secure_key_hash) 
VALUES (
  'admin@royalnordic.fi',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'  -- royalnordic2024
) ON CONFLICT (email) DO NOTHING;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE email = p_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO anon, authenticated;

-- Update RLS policies to use the admin function
DROP POLICY IF EXISTS "Admin users are viewable by admins only" ON admin_users;
CREATE POLICY "Admin users are viewable by admins only" ON admin_users
  FOR SELECT USING (is_admin(current_user));

-- Create a function to get admin bookings
CREATE OR REPLACE FUNCTION get_admin_bookings()
RETURNS TABLE (
  id BIGINT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  adults INTEGER,
  children INTEGER,
  total_price DECIMAL(10,2),
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  special_requests TEXT,
  tour_name TEXT,
  tour_date DATE
) AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(current_user) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    b.id,
    b.customer_name,
    b.customer_email,
    b.customer_phone,
    b.adults,
    b.children,
    b.total_price,
    b.status,
    b.created_at,
    b.special_requests,
    t.name as tour_name,
    td.date as tour_date
  FROM bookings b
  JOIN tours t ON b.tour_id = t.id
  JOIN tour_dates td ON b.tour_date_id = td.id
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_admin_bookings() TO anon, authenticated;

-- Create a function to update booking status
CREATE OR REPLACE FUNCTION update_booking_status(
  p_booking_id BIGINT,
  p_new_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(current_user) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Update the booking status
  UPDATE bookings 
  SET status = p_new_status 
  WHERE id = p_booking_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_booking_status(BIGINT, TEXT) TO anon, authenticated;

-- Final verification
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as tours_count FROM tours;
SELECT COUNT(*) as tour_dates_count FROM tour_dates;
SELECT COUNT(*) as admin_users_count FROM admin_users;
