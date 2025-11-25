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

      // Get tour_id and tour_date_id from metadata
      const tourId = parseInt(metadata.tour_id || '0')
      const tourDateId = parseInt(metadata.tour_date_id || '0')
      
      if (!tourId || !tourDateId) {
        throw new Error('Missing tour_id or tour_date_id in metadata')
      }

      // First, check and update tour availability
      const { data: tourDateData, error: tourDateError } = await supabase
        .from('tour_dates')
        .select('available_slots, total_booked')
        .eq('id', tourDateId)
        .single()

      if (tourDateError) {
        console.error('Error fetching tour date:', tourDateError)
        throw new Error('Failed to fetch tour date data')
      }

      const requestedSlots = adults + children
      const availableSlots = tourDateData.available_slots
      const currentBooked = tourDateData.total_booked

      if (currentBooked + requestedSlots > availableSlots) {
        throw new Error('Not enough available slots for this booking')
      }

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          tour_id: tourId,
          tour_date_id: tourDateId,
          customer_name: customerName,
          customer_email: customerEmail,
          adults,
          children,
          total_price: totalPrice,
          status: 'confirmed',
          special_requests: metadata.special_requests || '',
          phone: metadata.phone || ''
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Error creating booking:', bookingError)
        throw new Error('Failed to create booking record')
      }

      // Update tour_dates to reflect the new booking
      const { error: updateError } = await supabase
        .from('tour_dates')
        .update({ total_booked: currentBooked + requestedSlots })
        .eq('id', tourDateId)

      if (updateError) {
        console.error('Error updating tour availability:', updateError)
        // Don't fail the booking if availability update fails
      }

      // Send email notifications using the new email system
      try {
        const emailData = {
          bookingId: booking.id,
          customerName,
          customerEmail,
          customerPhone: metadata.phone || '',
          tourName,
          tourDate,
          adults,
          children,
          totalPrice,
          specialRequests: metadata.special_requests || '',
          paymentStatus: 'confirmed' as const,
          createdAt: new Date().toISOString()
        }

        // Send admin notification
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: 'admin@royalnordic.fi',
            subject: `New Booking Confirmation - ${tourName}`,
            type: 'booking_notification',
            data: emailData
          })
        })

        // Send customer confirmation
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: [customerEmail, 'contact@royalnordic.fi'],
            subject: `Booking Confirmation - ${tourName}`,
            type: 'customer_confirmation',
            data: emailData
          })
        })

        console.log('Email notifications sent successfully')
      } catch (emailError) {
        console.error('Error sending email notifications:', emailError)
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
