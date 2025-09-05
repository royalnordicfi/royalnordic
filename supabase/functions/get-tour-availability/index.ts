import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tourId } = await req.json()

    if (!tourId) {
      return new Response(
        JSON.stringify({ error: 'Tour ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get tour information
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .single()

    if (tourError || !tour) {
      return new Response(
        JSON.stringify({ error: 'Tour not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Get tour dates with availability
    // Use a more lenient date filter to avoid timezone issues
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    
    const { data: tourDates, error: datesError } = await supabase
      .from('tour_dates')
      .select('*')
      .eq('tour_id', tourId)
      .gte('date', todayString) // Only future dates
      .order('date', { ascending: true })

    if (datesError) {
      console.error('Error fetching tour dates:', datesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tour dates' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Format the response
    const availability = {
      tourId: tourId,
      tourName: tour.name,
      adultPrice: tour.adult_price,
      childPrice: tour.child_price,
      maxCapacity: tour.max_capacity,
      availableDates: tourDates.map(date => ({
        id: date.id,
        date: date.date,
        availableSpots: date.available_slots - (date.total_booked || 0),
        totalSlots: date.available_slots,
        bookedSlots: date.total_booked || 0,
        price: tour.adult_price
      }))
    }

    return new Response(
      JSON.stringify(availability),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
