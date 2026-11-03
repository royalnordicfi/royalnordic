import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]+$/

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const sessionId = String(body.session_id || body.sessionId || '').trim()
    if (!SESSION_RE.test(sessionId)) {
      return new Response(JSON.stringify({ error: 'Invalid session_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY not configured')

    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${stripeSecretKey}` },
    })
    if (!stripeRes.ok) {
      const errText = await stripeRes.text()
      console.error('stripe session lookup failed', stripeRes.status, errText.slice(0, 300))
      return new Response(JSON.stringify({ error: 'Checkout session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const session = await stripeRes.json()
    if (session.payment_status !== 'paid' || session.status !== 'complete') {
      return new Response(
        JSON.stringify({
          ok: false,
          pending: true,
          payment_status: session.payment_status,
          status: session.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        'id, booking_ref, status, payment_status, customer_name, customer_email, adults, children, total_price, tour_id, tour_date_id, special_requests',
      )
      .eq('stripe_checkout_session_id', sessionId)
      .maybeSingle()

    if (bookingError) {
      console.error('booking lookup', bookingError)
      throw new Error('Unable to load booking')
    }

    if (!booking) {
      // Webhook may still be writing the row — client should retry briefly.
      return new Response(
        JSON.stringify({
          ok: false,
          pending: true,
          payment_status: 'paid',
          status: 'complete',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let tourName: string | null = null
    let tourDateIso: string | null = null
    if (booking.tour_id) {
      const { data: tour } = await supabase
        .from('tours')
        .select('name, public_name')
        .eq('id', booking.tour_id)
        .maybeSingle()
      tourName = (tour?.public_name || tour?.name || null) as string | null
    }
    if (booking.tour_date_id) {
      const { data: td } = await supabase
        .from('tour_dates')
        .select('date')
        .eq('id', booking.tour_date_id)
        .maybeSingle()
      tourDateIso = td?.date ? String(td.date) : null
    }

    const meta = session.metadata || {}
    return new Response(
      JSON.stringify({
        ok: true,
        pending: false,
        booking: {
          booking_ref: booking.booking_ref,
          status: booking.status,
          payment_status: booking.payment_status,
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          adults: booking.adults,
          children: booking.children,
          total_price: booking.total_price,
          tour_name: tourName || meta.tour_name || 'experience',
          tour_date_iso: tourDateIso || meta.tour_date_iso || null,
          tour_date: tourDateIso || meta.tour_date_iso || null,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('get-checkout-confirmation', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
