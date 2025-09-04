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
