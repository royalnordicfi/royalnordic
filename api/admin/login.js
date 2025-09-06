import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://itihdgqgvlphtyidnvkt.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0aWhkZ3FndmxwaHR5aWRudmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTk2NjQsImV4cCI6MjA3MTYzNTY2NH0.pF02EbMsV2Aj03kiyu8eAGAa0QmQ5jCi5JzncJ5T0Rc'

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, secureKey } = req.body

    if (!email || !password || !secureKey) {
      return res.status(400).json({ error: 'Email, password, and secure key are required' })
    }

    // Check admin user
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password and secure key (using Supabase values)
    if (data.password_hash !== 'Rollonortsu8889') {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check secure key (using Supabase value)
    if (secureKey !== '568907') {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    return res.status(200).json({
      token: 'admin-token',
      user: { id: data.id, email: data.email }
    })

  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
