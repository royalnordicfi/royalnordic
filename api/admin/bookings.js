import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://itihdgqgvlphtyidnvkt.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0aWhkZ3FndmxwaHR5aWRudmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTk2NjQsImV4cCI6MjA3MTYzNTY2NH0.pF02EbMsV2Aj03kiyu8eAGAa0QmQ5jCi5JzncJ5T0Rc'

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get all bookings with tour and date information
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_name,
        customer_email,
        customer_phone,
        adults,
        children,
        total_price,
        status,
        created_at,
        special_requests,
        tours!inner(name),
        tour_dates!inner(date)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return res.status(500).json({ error: 'Failed to fetch bookings' })
    }

    // Transform the data to match the expected format
    const transformedBookings = data.map(booking => ({
      id: booking.id,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      adults: booking.adults,
      children: booking.children,
      total_price: booking.total_price,
      status: booking.status,
      created_at: booking.created_at,
      special_requests: booking.special_requests,
      tour_name: booking.tours.name,
      tour_date: booking.tour_dates.date
    }))

    return res.status(200).json(transformedBookings)

  } catch (error) {
    console.error('Bookings error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
