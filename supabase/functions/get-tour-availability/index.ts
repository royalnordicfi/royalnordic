import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  PRIVATE_SANTA_SEASON_FIRST,
  PRIVATE_SANTA_SEASON_LAST,
  PRIVATE_SANTA_TOUR_ID,
  STANDARD_GROUP_SEASON_END,
  STANDARD_GROUP_SEASON_START,
  isDateInAbsoluteTourWindow,
  isDateInTourSeason,
  isPrivateSantaTour,
  isStandardGroupTour,
} from '../_shared/tourBookingRules.ts'

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
    const tourIdNum = Number(tourId)
    const seasonStart = tour.season_start || (isStandardGroupTour(tourIdNum, tour.name) ? STANDARD_GROUP_SEASON_START : null)
    const seasonEnd = tour.season_end || (isStandardGroupTour(tourIdNum, tour.name) ? STANDARD_GROUP_SEASON_END : null)
    const absoluteFrom = isPrivateSantaTour(tourIdNum, tour.name) ? PRIVATE_SANTA_SEASON_FIRST : null
    const absoluteTo = isPrivateSantaTour(tourIdNum, tour.name) ? PRIVATE_SANTA_SEASON_LAST : null
    const bookableDates = (tourDates || []).filter((date) => {
      const iso = String(date.date).slice(0, 10)
      if (!isDateInTourSeason(iso, seasonStart, seasonEnd)) return false
      if (tourIdNum === PRIVATE_SANTA_TOUR_ID || absoluteFrom || absoluteTo) {
        return isDateInAbsoluteTourWindow(iso, absoluteFrom, absoluteTo)
      }
      return true
    })

    const availability = {
      tourId: tourId,
      tourName: tour.name,
      adultPrice: tour.adult_price,
      childPrice: tour.child_price,
      maxCapacity: tour.max_capacity,
      availableDates: bookableDates.map(date => ({
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
