import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://itihdgqgvlphtyidnvkt.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0aWhkZ3FndmxwaHR5aWRudmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTk2NjQsImV4cCI6MjA3MTYzNTY2NH0.pF02EbMsV2Aj03kiyu8eAGAa0QmQ5jCi5JzncJ5T0Rc'

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const { status } = req.body

    if (!id || !status) {
      return res.status(400).json({ error: 'Booking ID and status are required' })
    }

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Update booking status
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking status:', error)
      return res.status(500).json({ error: 'Failed to update booking status' })
    }

    return res.status(200).json({ success: true, booking: data })

  } catch (error) {
    console.error('Status update error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
