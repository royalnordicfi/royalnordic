/**
 * Admin-only: create a Stripe Checkout Session for an existing unpaid booking.
 * Confirmed only after checkout.session.completed webhook (payment_status=paid).
 * TEST-mode safe — uses STRIPE_SECRET_KEY from project secrets.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'
import { buildPaymentRequestEmail } from '../_shared/bookingEmails.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_ORIGIN = (Deno.env.get('SITE_URL') || 'https://royalnordic.fi').replace(/\/$/, '')
const ADMIN_ORIGIN = (Deno.env.get('ADMIN_SITE_URL') || 'https://admin.royalnordic.fi').replace(
  /\/$/,
  '',
)
const LINK_TTL_HOURS = 48

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY not configured')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin')
    if (adminError || !isAdmin) {
      return json({ error: 'Admin access required' }, 403)
    }

    const adminClient = createClient(supabaseUrl, serviceKey)

    const body = await req.json()
    const bookingId = parseInt(String(body.booking_id || ''), 10)
    if (!bookingId) throw new Error('booking_id is required')
    const sendEmail = body.send_email === true

    const { data: booking, error: bookingError } = await adminClient
      .from('bookings')
      .select(
        `id, booking_ref, customer_name, customer_email, customer_phone, adults, children, total_price,
         status, payment_status, deleted_at, tour_id, tour_date_id, tour_time, pickup_location,
         tours ( name, public_name, pricing_model ),
         tour_dates ( date )`,
      )
      .eq('id', bookingId)
      .maybeSingle()

    if (bookingError || !booking) throw new Error('Booking not found')
    if (booking.deleted_at) throw new Error('Cannot charge a deleted booking')
    if (booking.status === 'cancelled') throw new Error('Cannot charge a cancelled booking')
    if (booking.payment_status === 'paid') throw new Error('Booking is already paid')

    const amount = Math.round(Number(booking.total_price) * 100) / 100
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Booking total must be greater than zero for a payment link')
    }

    const tourName =
      (booking.tours as { public_name?: string; name?: string } | null)?.public_name ||
      (booking.tours as { name?: string } | null)?.name ||
      'Royal Nordic booking'
    const tourDate = String((booking.tour_dates as { date?: string } | null)?.date || '').slice(0, 10)
    const pricingModel =
      (booking.tours as { pricing_model?: string } | null)?.pricing_model === 'per_vehicle'
        ? 'per_vehicle'
        : 'per_person'

    const expiresAt = new Date(Date.now() + LINK_TTL_HOURS * 60 * 60 * 1000)
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'klarna', 'bancontact', 'eps'],
      customer_email: booking.customer_email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: tourName,
              description: `Booking ${booking.booking_ref || `RN-${booking.id}`} · ${tourDate}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${SITE_ORIGIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ADMIN_ORIGIN}/bookings/${booking.id}`,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      metadata: {
        existing_booking_id: String(booking.id),
        tour_id: String(booking.tour_id),
        tour_date_id: String(booking.tour_date_id),
        tour_date_iso: tourDate,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        adults: String(booking.adults),
        children: String(booking.children),
        total_price: String(amount),
        subtotal: String(amount),
        discount: '0',
        pricing_model: pricingModel,
        payment_type: 'admin_payment_link',
        ...(booking.tour_time ? { tour_time: String(booking.tour_time) } : {}),
        ...(booking.pickup_location ? { pickup_location: String(booking.pickup_location) } : {}),
      },
    })

    if (!session.url) throw new Error('Stripe did not return a checkout URL')

    const { error: updateError } = await adminClient
      .from('bookings')
      .update({
        payment_link_url: session.url,
        payment_link_expires_at: expiresAt.toISOString(),
        stripe_checkout_session_id: session.id,
        payment_status: 'unpaid',
        status: booking.status === 'confirmed' ? 'pending' : booking.status,
        payment_type: 'admin_payment_link',
      })
      .eq('id', booking.id)

    if (updateError) {
      console.warn('Could not persist payment link columns:', updateError.message)
    }

    await adminClient.from('booking_events').insert([
      {
        booking_id: booking.id,
        event_type: 'payment_link_created',
        from_value: null,
        to_value: session.id,
        note: `Payment link created by ${user.email || 'admin'} · expires ${expiresAt.toISOString()}`,
        created_by: user.email || 'admin',
      },
    ])

    let emailSent = false
    let emailError: string | null = null

    if (sendEmail) {
      try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (!resendApiKey) throw new Error('RESEND_API_KEY not configured')

        const mail = buildPaymentRequestEmail({
          bookingId: booking.id,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          customerPhone: booking.customer_phone || undefined,
          tourName,
          tourDate,
          adults: booking.adults,
          children: booking.children,
          totalPrice: amount,
          departureTime: booking.tour_time || undefined,
          meetingPoint: booking.pickup_location || undefined,
          paymentUrl: session.url,
          expiresAt: expiresAt.toLocaleString('en-GB', {
            timeZone: 'Europe/Helsinki',
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        })

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: mail.from,
            to: mail.to,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
          }),
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(errText || `Resend ${response.status}`)
        }

        emailSent = true
        await adminClient.from('booking_events').insert([
          {
            booking_id: booking.id,
            event_type: 'payment_request_email_sent',
            from_value: null,
            to_value: booking.customer_email,
            note: 'Payment request email sent to customer',
            created_by: user.email || 'admin',
          },
        ])
        await adminClient.from('booking_emails').insert([
          {
            booking_id: booking.id,
            to_email: booking.customer_email,
            status: 'sent',
            error_message: null,
          },
        ]).then(() => undefined).catch(() => undefined)
      } catch (e) {
        emailError = e instanceof Error ? e.message : 'Email send failed'
        console.error('Payment request email failed:', emailError)
      }
    }

    return json({
      success: true,
      booking_id: booking.id,
      url: session.url,
      session_id: session.id,
      expires_at: expiresAt.toISOString(),
      livemode: session.livemode === true,
      email_sent: emailSent,
      email_error: emailError,
    })
  } catch (error) {
    console.error('create-admin-payment-link error:', error)
    return json(
      { error: error instanceof Error ? error.message : 'Failed to create payment link' },
      400,
    )
  }
})
