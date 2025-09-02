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
    // Verify webhook signature (you should implement this for production)
    const body = await req.text()
    const signature = req.headers.get('x-cc-webhook-signature')
    
    // For now, we'll trust the webhook (implement signature verification later)
    const webhookData = JSON.parse(body)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different webhook events
    if (webhookData.type === 'charge:confirmed') {
      const charge = webhookData.data
      
      // Extract metadata from the charge
      const metadata = charge.metadata
      const tourName = metadata.tour_name
      const tourDate = metadata.tour_date
      const customerName = metadata.customer_name
      const customerEmail = metadata.customer_email
      const adults = parseInt(metadata.adults || '0')
      const children = parseInt(metadata.children || '0')
      const totalPrice = parseFloat(metadata.total_price || '0')

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          tour_name: tourName,
          tour_date: tourDate,
          customer_name: customerName,
          customer_email: customerEmail,
          adults,
          children,
          total_amount: totalPrice,
          payment_method: 'crypto',
          payment_status: 'confirmed',
          crypto_charge_id: charge.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Error creating booking:', bookingError)
        throw new Error('Failed to create booking record')
      }

      // Send email notification
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-tour-booking-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: customerName,
            email: customerEmail,
            phone: metadata.phone || '',
            tourName,
            tourDate,
            adultCount: adults,
            childCount: children,
            totalAmount: totalPrice,
            specialRequests: metadata.special_requests || '',
            paymentMethod: 'Crypto'
          })
        })
      } catch (emailError) {
        console.error('Error sending email notification:', emailError)
        // Don't fail the webhook if email fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment confirmed and booking created',
          booking_id: booking.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Handle other webhook events
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook received',
        event_type: webhookData.type
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
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
