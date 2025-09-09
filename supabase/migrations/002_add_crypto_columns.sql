-- Add crypto payment columns to bookings table
-- Run this in your Supabase SQL Editor

-- Add payment_type and crypto_type columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'card';

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS crypto_type TEXT;

-- Update the status constraint to include crypto payment status
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'pending_crypto_payment'));

-- Update the admin_bookings_view to include new columns
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
  b.payment_type,
  b.crypto_type,
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

-- Grant permissions on the updated view
GRANT ALL ON admin_bookings_view TO anon, authenticated;

-- Create index for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_bookings_payment_type ON bookings(payment_type);
CREATE INDEX IF NOT EXISTS idx_bookings_crypto_type ON bookings(crypto_type);

-- Update the get_admin_bookings function to include new columns
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
  payment_type TEXT,
  crypto_type TEXT,
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
    b.payment_type,
    b.crypto_type,
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

-- Final verification
SELECT 'Crypto columns added successfully!' as status;
