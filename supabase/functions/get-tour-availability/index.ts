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
        // September 2025 dates (for Northern Lights Tour - tourId 1)
        {
          id: 1,
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
        },
        // November 2025 dates (for Snowshoe Rental - tourId 2)
        {
          date: '2025-11-01',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-02',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-03',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-04',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-05',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-06',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-07',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-08',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-09',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-10',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-11',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-12',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-13',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-14',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-15',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-16',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-17',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-18',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-19',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-20',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-21',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-22',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-23',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-24',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-25',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-26',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-27',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-28',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-29',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-11-30',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        // December 2025 dates
        {
          date: '2025-12-01',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-02',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-03',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-04',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-05',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-06',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-07',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-08',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-09',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-10',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-11',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-12',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-13',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-14',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-15',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-16',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-17',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-18',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-19',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-20',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-21',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-22',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-23',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-24',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-25',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-26',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-27',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-28',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-29',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-30',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2025-12-31',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        // January 2026 dates
        {
          date: '2026-01-01',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-02',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-03',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-04',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-05',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-06',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-07',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-08',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-09',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-10',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-11',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-12',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-13',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-14',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-15',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-16',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-17',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-18',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-19',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-20',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-21',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-22',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-23',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-24',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-25',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-26',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-27',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-28',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-29',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-30',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-01-31',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        // February 2026 dates
        {
          date: '2026-02-01',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-02',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-03',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-04',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-05',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-06',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-07',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-08',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-09',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-10',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-11',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-12',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-13',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-14',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-15',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-16',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-17',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-18',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-19',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-20',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-21',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-22',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-23',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-24',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-25',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-26',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-27',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-02-28',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        // March 2026 dates
        {
          date: '2026-03-01',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-02',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-03',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-04',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-05',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-06',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-07',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-08',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-09',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-10',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-11',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-12',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-13',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-14',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-15',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-16',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-17',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-18',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-19',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-20',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-21',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-22',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-23',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-24',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-25',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-26',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-27',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-28',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-29',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-30',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        {
          date: '2026-03-31',
          availableSpots: 3,
          price: tourId === 1 ? 179 : 89
        },
        // April 2026 dates (only April 1st as per season end)
        {
          date: '2026-04-01',
          availableSpots: 3,
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
