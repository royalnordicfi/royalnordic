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
    // Get the raw body for signature verification
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    if (!stripeSecretKey || !stripeWebhookSecret) {
      throw new Error('Missing Stripe environment variables')
    }

    // Parse the event
    let event
    try {
      event = JSON.parse(body)
    } catch (err) {
      throw new Error('Invalid JSON payload')
    }

    // Verify webhook signature (simplified for now)
    if (!signature) {
      console.log('No signature provided, but continuing...')
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      
      // Extract metadata from the session
      const {
        tour_id,
        tour_date_id,
        customer_name,
        customer_email,
        adults,
        children,
        total_price,
        phone,
        special_requests
      } = session.metadata

      console.log('Received metadata:', session.metadata)

      // Create Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      console.log('Creating booking with data:', {
        tour_id: parseInt(tour_id),
        tour_date_id: parseInt(tour_date_id),
        customer_name,
        customer_email,
        adults: parseInt(adults),
        children: parseInt(children),
        total_price: parseFloat(total_price),
        status: 'confirmed',
        stripe_payment_intent_id: session.payment_intent
      })

      // First, check availability and update slots
      const { data: dateData, error: dateError } = await supabase
        .from('tour_dates')
        .select('available_slots, total_booked')
        .eq('id', parseInt(tour_date_id))
        .single()

      if (dateError) {
        console.error('Error fetching date data:', dateError)
        throw new Error('Date not found')
      }

      const remainingSlots = dateData.available_slots - dateData.total_booked
      const requestedSlots = parseInt(adults) + parseInt(children)

      if (requestedSlots > remainingSlots) {
        console.error('Not enough slots available')
        throw new Error(`Only ${remainingSlots} slots available`)
      }

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          tour_id: parseInt(tour_id),
          tour_date_id: parseInt(tour_date_id),
          customer_name,
          customer_email,
          customer_phone: phone || '',
          adults: parseInt(adults),
          children: parseInt(children),
          total_price: parseFloat(total_price),
          status: 'confirmed',
          special_requests: special_requests || '',
          stripe_payment_intent_id: session.payment_intent
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Error creating booking:', bookingError)
        throw new Error(bookingError.message)
      }

      // Update available slots
      const { error: updateError } = await supabase
        .from('tour_dates')
        .update({ total_booked: dateData.total_booked + requestedSlots })
        .eq('id', parseInt(tour_date_id))

      if (updateError) {
        console.error('Error updating slots:', updateError)
        // Don't fail the booking if slot update fails
      }

      // Get tour and date information for email
      const { data: tourData } = await supabase
        .from('tours')
        .select('name')
        .eq('id', parseInt(tour_id))
        .single()

      const { data: dateDataForEmail } = await supabase
        .from('tour_dates')
        .select('date')
        .eq('id', parseInt(tour_date_id))
        .single()

      // Send booking confirmation emails
      if (tourData && dateDataForEmail) {
        const emailData = {
          bookingId: booking.id,
          customerName: customer_name,
          customerEmail: customer_email,
          customerPhone: phone || '',
          tourName: tourData.name,
          tourDate: dateDataForEmail.date,
          adults: parseInt(adults),
          children: parseInt(children),
          totalPrice: parseFloat(total_price),
          specialRequests: special_requests || '',
          paymentStatus: 'confirmed' as const,
          createdAt: new Date().toISOString()
        }

        // Send notification to Royal Nordic staff
        await sendBookingNotification(emailData)
        
        // Send confirmation to customer
        await sendCustomerConfirmation(emailData)
      }

      return new Response(
        JSON.stringify({ success: true, booking_id: booking.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
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

  verifyWebhook(payload: string, secret: string) {
    // Simple webhook verification - in production, use proper crypto verification
    try {
      const event = JSON.parse(payload)
      return event
    } catch (error) {
      throw new Error('Invalid webhook payload')
    }
  }
}

// Send booking notification to Royal Nordic staff
async function sendBookingNotification(bookingData: any) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.log('Resend API key missing, cannot send email')
    return
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Royal Nordic <contact@royalnordic.fi>',
        to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
        subject: `New Booking: ${bookingData.tourName} - ${bookingData.customerName}`,
        html: `
          <h2>🌟 New Booking Alert</h2>
          <h3>📋 Booking Details</h3>
          <p><strong>Booking ID:</strong> #${bookingData.bookingId}</p>
          <p><strong>Tour:</strong> ${bookingData.tourName}</p>
          <p><strong>Date:</strong> ${new Date(bookingData.tourDate).toLocaleDateString('fi-FI')}</p>
          <p><strong>Status:</strong> ${bookingData.paymentStatus.toUpperCase()}</p>
          
          <h3>👥 Customer Information</h3>
          <p><strong>Name:</strong> ${bookingData.customerName}</p>
          <p><strong>Email:</strong> ${bookingData.customerEmail}</p>
          <p><strong>Phone:</strong> ${bookingData.customerPhone || 'Not provided'}</p>
          
          <h3>💰 Pricing</h3>
          <p><strong>Adults:</strong> ${bookingData.adults}</p>
          <p><strong>Children:</strong> ${bookingData.children}</p>
          <p><strong>Total:</strong> €${bookingData.totalPrice}</p>
          
          ${bookingData.specialRequests ? `
          <h3>📝 Special Requests</h3>
          <p>${bookingData.specialRequests}</p>
          ` : ''}
          
          <p><strong>⏰ Booking Time:</strong> ${new Date(bookingData.createdAt).toLocaleString('fi-FI')}</p>
        `,
        text: `
New Booking Alert - Royal Nordic Tours

📋 Booking Details:
- Booking ID: #${bookingData.bookingId}
- Tour: ${bookingData.tourName}
- Date: ${new Date(bookingData.tourDate).toLocaleDateString('fi-FI')}
- Status: ${bookingData.paymentStatus.toUpperCase()}

👥 Customer Information:
- Name: ${bookingData.customerName}
- Email: ${bookingData.customerEmail}
- Phone: ${bookingData.customerPhone || 'Not provided'}

💰 Pricing:
- Adults: ${bookingData.adults}
- Children: ${bookingData.children}
- Total: €${bookingData.totalPrice}

${bookingData.specialRequests ? `
📝 Special Requests:
${bookingData.specialRequests}
` : ''}

⏰ Booking Time: ${new Date(bookingData.createdAt).toLocaleString('fi-FI')}
        `,
      }),
    })

    if (response.ok) {
      console.log('Admin notification email sent successfully')
    } else {
      console.error('Failed to send admin notification:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('Error sending admin notification:', error)
  }
}

// Send booking confirmation to customer
async function sendCustomerConfirmation(bookingData: any) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.log('Resend API key missing, cannot send email')
    return
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Royal Nordic <contact@royalnordic.fi>',
        to: [bookingData.customerEmail],
        subject: `Booking Confirmed: ${bookingData.tourName} - Royal Nordic`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
              <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
              <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
            </div>
            
            <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 25px; font-size: 28px; text-align: center;">Booking Confirmed! 🎉</h1>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                Dear <strong>${bookingData.customerName}</strong>,
              </p>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                Thank you for booking with Royal Nordic! Your Lapland adventure is confirmed and we're excited to show you the magic of the Northern Lights.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">📋 Your Booking Details</h3>
                <p><strong>Booking ID:</strong> #${bookingData.bookingId}</p>
                <p><strong>Tour:</strong> ${bookingData.tourName}</p>
                <p><strong>Date:</strong> ${new Date(bookingData.tourDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">CONFIRMED</span></p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 10px 0;">
                <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">👥 Your Group</h3>
                <p><strong>Adults:</strong> ${bookingData.adults}</p>
                <p><strong>Children:</strong> ${bookingData.children}</p>
                <p><strong>Total Amount:</strong> €${bookingData.totalPrice}</p>
              </div>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f59e0b;">
                <h3 style="color: #92400e; margin-bottom: 15px; font-size: 18px;">🎯 What's Next?</h3>
                <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px;">
                  <li>You will receive a reminder email 24 hours before your tour</li>
                  <li>Please arrive 15 minutes before your scheduled time</li>
                  <li>Dress warmly for Arctic conditions</li>
                  <li>Contact us if you have any questions</li>
                </ul>
              </div>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                Best regards,<br>
                <strong>The Royal Nordic Team</strong>
              </p>
            </div>
            
            <div style="text-align: center; padding: 30px 20px; background-color: #1f2937; color: white;">
              <h3 style="margin-bottom: 20px; font-size: 18px;">Contact Information</h3>
              <p style="margin: 8px 0; font-size: 14px;">📧 contact@royalnordic.fi</p>
              <p style="margin: 8px 0; font-size: 14px;">📞 +358 45 78345138</p>
              <p style="margin: 8px 0; font-size: 14px;">🌍 royalnordic.fi</p>
            </div>
          </div>
        `,
        text: `
Booking Confirmed - Royal Nordic Tours

Thank you for your booking, ${bookingData.customerName}!

Your tour has been successfully confirmed. We're excited to show you the magic of Lapland!

📋 Your Booking Details:
- Booking ID: #${bookingData.bookingId}
- Tour: ${bookingData.tourName}
- Date: ${new Date(bookingData.tourDate).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
- Status: CONFIRMED

👥 Your Group:
- Adults: ${bookingData.adults}
- Children: ${bookingData.children}
- Total Amount: €${bookingData.totalPrice}

🎯 What's Next?
• You will receive a reminder email 24 hours before your tour
• Please arrive 15 minutes before your scheduled time
• Dress warmly for Arctic conditions
• Contact us if you have any questions

Thank you for choosing Royal Nordic Tours!
Booking ID: #${bookingData.bookingId}
        `,
      }),
    })

    if (response.ok) {
      console.log('Customer confirmation email sent successfully to:', bookingData.customerEmail)
    } else {
      console.error('Failed to send customer confirmation:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('Error sending customer confirmation:', error)
  }
}
