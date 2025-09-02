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
    const { amount, currency, tour_name, tour_date, metadata } = await req.json()

    // Validate required fields
    if (!amount || !tour_name || !tour_date) {
      throw new Error('Missing required fields: amount, tour_name, tour_date')
    }

    // Create Coinbase Commerce checkout
    const checkoutData = {
      name: tour_name,
      description: `Booking for ${tour_name} on ${tour_date}`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toString(),
        currency: 'EUR'
      },
      metadata: {
        tour_name,
        tour_date,
        ...metadata
      },
      redirect_url: `${Deno.env.get('SITE_URL') || 'https://royalnordic.fi'}/payment-success`,
      cancel_url: `${Deno.env.get('SITE_URL') || 'https://royalnordic.fi'}/tours`,
      hosted_url: true
    }

    // Make request to Coinbase Commerce API
    const response = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': Deno.env.get('COINBASE_COMMERCE_API_KEY') || '',
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(checkoutData)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Coinbase Commerce API error: ${errorData}`)
    }

    const chargeData = await response.json()

    return new Response(
      JSON.stringify({
        success: true,
        hosted_url: chargeData.data.hosted_url,
        charge_id: chargeData.data.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
