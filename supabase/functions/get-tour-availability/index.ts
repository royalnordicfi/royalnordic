import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // Mock availability data for now
    // In production, this would fetch from your database
    const availability = {
      tourId: tourId,
      availableDates: [
        {
          date: '2025-09-15',
          availableSpots: 8,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-09-16',
          availableSpots: 6,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-09-17',
          availableSpots: 10,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-09-18',
          availableSpots: 4,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-09-19',
          availableSpots: 8,
          price: tourId === 1 ? 179 : 89
        }
      ]
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
