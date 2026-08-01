import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'
import {
  buildAdminBookingAlertEmail,
  buildCustomerConfirmationEmail,
} from '../_shared/bookingEmails.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured')
    }

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Missing stripe-signature header')
    }

    const body = await req.text()
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    console.log('Verified webhook event:', event.id, event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status !== 'paid') {
        console.log('Ignoring unpaid checkout session', session.id, session.payment_status)
        return json({ received: true, ignored: 'not_paid' })
      }

      const metadata = session.metadata || {}
      const tourId = parseInt(String(metadata.tour_id || ''), 10)
      const tourDateId = parseInt(String(metadata.tour_date_id || ''), 10)
      const adults = parseInt(String(metadata.adults || '0'), 10)
      const children = parseInt(String(metadata.children || '0'), 10)
      const customerName = String(metadata.customer_name || '').trim()
      const customerEmail = String(
        metadata.customer_email || session.customer_email || session.customer_details?.email || '',
      ).trim()
      const phone = String(metadata.phone || metadata.customer_phone || '')
      const specialRequests = String(metadata.special_requests || '')
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null

      if (!tourId || !tourDateId || !customerName || !customerEmail || !paymentIntentId) {
        throw new Error('Missing required checkout metadata')
      }

      const totalPrice =
        typeof session.amount_total === 'number'
          ? session.amount_total / 100
          : parseFloat(String(metadata.total_price || '0'))

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Idempotency: same PaymentIntent must not create duplicate bookings.
      const { data: existing, error: existingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()

      if (existingError) {
        console.error('Error checking existing booking:', existingError)
        throw new Error('Failed to check existing booking')
      }

      if (existing?.id) {
        console.log('Booking already exists for payment intent', paymentIntentId, existing.id)
        return json({ success: true, booking_id: existing.id, duplicate: true })
      }

      const { data: dateData, error: dateError } = await supabase
        .from('tour_dates')
        .select('available_slots, total_booked')
        .eq('id', tourDateId)
        .single()

      if (dateError || !dateData) {
        console.error('Error fetching date data:', dateError)
        throw new Error('Date not found')
      }

      const remainingSlots = dateData.available_slots - (dateData.total_booked || 0)
      const requestedSlots = adults + children
      if (requestedSlots > remainingSlots) {
        console.error('Not enough slots available', { remainingSlots, requestedSlots })
        throw new Error(`Only ${remainingSlots} slots available`)
      }

      const insertPayload: Record<string, unknown> = {
        tour_id: tourId,
        tour_date_id: tourDateId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: phone,
        adults,
        children,
        total_price: totalPrice,
        status: 'confirmed',
        special_requests: specialRequests,
        stripe_payment_intent_id: paymentIntentId,
        payment_status: 'paid',
        source: 'direct_website',
      }

      let { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(insertPayload)
        .select('id')
        .single()

      // Older schemas may not have payment_status/source — retry without them.
      if (
        bookingError &&
        (bookingError.message.includes('payment_status') || bookingError.message.includes('source'))
      ) {
        delete insertPayload.payment_status
        delete insertPayload.source
        ;({ data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert(insertPayload)
          .select('id')
          .single())
      }

      if (bookingError || !booking) {
        // Race: another delivery inserted the same PI.
        if (bookingError?.message?.toLowerCase().includes('duplicate')) {
          const { data: raced } = await supabase
            .from('bookings')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .maybeSingle()
          if (raced?.id) {
            return json({ success: true, booking_id: raced.id, duplicate: true })
          }
        }
        console.error('Error creating booking:', bookingError)
        throw new Error(bookingError?.message || 'Failed to create booking')
      }

      const { error: updateError } = await supabase
        .from('tour_dates')
        .update({ total_booked: (dateData.total_booked || 0) + requestedSlots })
        .eq('id', tourDateId)

      if (updateError) {
        console.error('Error updating slots:', updateError)
      }

      const { data: tourData } = await supabase.from('tours').select('name').eq('id', tourId).single()
      const { data: dateDataForEmail } = await supabase
        .from('tour_dates')
        .select('date')
        .eq('id', tourDateId)
        .single()

      if (tourData && dateDataForEmail) {
        const emailData = {
          bookingId: booking.id,
          customerName,
          customerEmail,
          customerPhone: phone,
          tourName: tourData.name,
          tourDate: dateDataForEmail.date,
          adults,
          children,
          totalPrice,
          specialRequests,
          paymentStatus: 'confirmed' as const,
          createdAt: new Date().toISOString(),
        }
        await sendEmailNotification(emailData, 'admin')
        await sendEmailNotification(emailData, 'customer')
      }

      return json({ success: true, booking_id: booking.id })
    }

    return json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

async function sendEmailNotification(
  bookingData: {
    bookingId: number
    customerName: string
    customerEmail: string
    customerPhone?: string
    tourName: string
    tourDate: string
    adults: number
    children: number
    totalPrice: number
    specialRequests?: string
    paymentStatus: 'confirmed'
    createdAt: string
  },
  type: 'admin' | 'customer',
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured, cannot send email')
    return
  }

  try {
    const emailData =
      type === 'admin'
        ? buildAdminBookingAlertEmail(bookingData)
        : buildCustomerConfirmationEmail(bookingData)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })
    if (!response.ok) {
      console.error(`Failed to send ${type} email via Resend:`, await response.text())
    } else {
      console.log(`${type} email sent via Resend`)
    }
  } catch (error) {
    console.error(`Error sending ${type} email:`, error)
  }
}
