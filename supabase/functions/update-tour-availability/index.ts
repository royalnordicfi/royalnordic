import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  PRIVATE_SANTA_SEASON_FIRST,
  PRIVATE_SANTA_SEASON_LAST,
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
    const { tourId, date, availableSlots } = await req.json()

    if (!tourId || !date || availableSlots === undefined) {
      return new Response(
        JSON.stringify({ error: 'Tour ID, date, and available slots are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const standardGroup = isStandardGroupTour(Number(tourId))
    let seasonStart: string | null = standardGroup ? STANDARD_GROUP_SEASON_START : null
    let seasonEnd: string | null = standardGroup ? STANDARD_GROUP_SEASON_END : null
    let maxCapacity: number | null = null
    const tourLookup = await supabase
      .from('tours')
      .select('max_capacity, season_start, season_end')
      .eq('id', tourId)
      .maybeSingle()
    if (tourLookup.error && /column|schema cache/i.test(tourLookup.error.message || '')) {
      const basic = await supabase.from('tours').select('max_capacity').eq('id', tourId).maybeSingle()
      if (basic.data?.max_capacity != null) maxCapacity = Number(basic.data.max_capacity)
    } else if (tourLookup.data) {
      if (tourLookup.data.max_capacity != null) maxCapacity = Number(tourLookup.data.max_capacity)
      if (tourLookup.data.season_start) seasonStart = tourLookup.data.season_start
      if (tourLookup.data.season_end) seasonEnd = tourLookup.data.season_end
    }
    const dateIso = String(date).slice(0, 10)
    if (seasonStart && seasonEnd && !isDateInTourSeason(dateIso, seasonStart, seasonEnd)) {
      return new Response(
        JSON.stringify({ error: 'That date is outside this tour’s operating season' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }
    if (
      isPrivateSantaTour(Number(tourId)) &&
      !isDateInAbsoluteTourWindow(dateIso, PRIVATE_SANTA_SEASON_FIRST, PRIVATE_SANTA_SEASON_LAST)
    ) {
      return new Response(
        JSON.stringify({
          error: 'Private Santa Claus Experience is only available 15 Nov 2026 – 31 Mar 2027',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }
    if (standardGroup && maxCapacity != null && Number(availableSlots) > maxCapacity) {
      return new Response(
        JSON.stringify({ error: `Capacity cannot exceed ${maxCapacity} guests on this departure` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // Check if date already exists
    const { data: existingDate, error: checkError } = await supabase
      .from('tour_dates')
      .select('id, total_booked')
      .eq('tour_id', tourId)
      .eq('date', date)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing date:', checkError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing date' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (existingDate) {
      // Check if we're trying to set slots less than already booked
      if (availableSlots < existingDate.total_booked) {
        return new Response(
          JSON.stringify({ error: `Cannot set available slots to ${availableSlots} when ${existingDate.total_booked} are already booked` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Update existing date
      const { error: updateError } = await supabase
        .from('tour_dates')
        .update({ 
          available_slots: availableSlots
        })
        .eq('id', existingDate.id)

      if (updateError) {
        console.error('Error updating date:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update availability' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    } else {
      // Create new date
      const { error: insertError } = await supabase
        .from('tour_dates')
        .insert([{
          tour_id: tourId,
          date: date,
          available_slots: availableSlots,
          total_booked: 0
        }])

      if (insertError) {
        console.error('Error inserting date:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create availability' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Availability updated successfully' }),
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
