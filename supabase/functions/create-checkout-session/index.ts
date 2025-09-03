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
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    // Parse request body
    const { amount, currency, tour_name, tour_date, metadata } = await req.json()

    // Validate required fields
    if (!amount || !currency || !tour_name || !tour_date) {
      throw new Error('Missing required fields')
    }

    // Create Stripe Checkout Session
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    const session = await stripe.createCheckoutSession({
      payment_method_types: ['card', 'sepa_debit', 'pay_by_bank'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: tour_name,
              description: `Tour on ${tour_date}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://royalnordic.fi/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://royalnordic.fi/payment-cancelled`,
      metadata: metadata,
      customer_email: metadata.customer_email,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// Stripe class for Deno
class Stripe {
  private secretKey: string
  private baseURL = 'https://api.stripe.com/v1'

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  async createCheckoutSession(params: any) {
    const response = await fetch(`${this.baseURL}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': params.payment_method_types.join(','),
        'line_items[0][price_data][currency]': params.line_items[0].price_data.currency,
        'line_items[0][price_data][product_data][name]': params.line_items[0].price_data.product_data.name,
        'line_items[0][price_data][product_data][description]': params.line_items[0].price_data.product_data.description,
        'line_items[0][price_data][unit_amount]': params.line_items[0].price_data.unit_amount.toString(),
        'line_items[0][quantity]': params.line_items[0].quantity.toString(),
        'mode': params.mode,
        'success_url': params.success_url,
        'cancel_url': params.cancel_url,
        'customer_email': params.customer_email,
        'billing_address_collection': params.billing_address_collection,
        'phone_number_collection[enabled]': params.phone_number_collection.enabled.toString(),
        ...Object.fromEntries(
          Object.entries(params.metadata).map(([key, value]) => [`metadata[${key}]`, value as string])
        ),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Stripe API error: ${error}`)
    }

    return response.json()
  }
}
