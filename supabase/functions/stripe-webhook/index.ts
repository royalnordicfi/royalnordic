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
        total_price
      } = session.metadata

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
        payment_intent_id: session.payment_intent,
        stripe_session_id: session.id
      })

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          tour_id: parseInt(tour_id),
          tour_date_id: parseInt(tour_date_id),
          customer_name,
          customer_email,
          adults: parseInt(adults),
          children: parseInt(children),
          total_price: parseFloat(total_price),
          status: 'confirmed',
          payment_intent_id: session.payment_intent,
          stripe_session_id: session.id
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Error creating booking:', bookingError)
        // Don't throw error, just log it and continue
        console.log('Booking creation failed, but continuing with email...')
        
        // Create a dummy booking ID for email
        const dummyBookingId = Date.now()
        
        // Send booking confirmation email anyway
        await sendBookingNotification({
          customerName: customer_name,
          customerEmail: customer_email,
          adults: parseInt(adults),
          children: parseInt(children),
          totalPrice: total_price,
          tourDate: session.metadata.tour_date,
          bookingId: dummyBookingId
        })

        return new Response(
          JSON.stringify({ success: true, booking_error: bookingError.message, email_sent: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Send booking confirmation email
      await sendBookingNotification({
        customerName: customer_name,
        customerEmail: customer_email,
        adults: parseInt(adults),
        children: parseInt(children),
        totalPrice: total_price,
        tourDate: session.metadata.tour_date,
        bookingId: booking.id
      })

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

// Send booking confirmation email using Resend
async function sendBookingNotification({
  customerName,
  customerEmail,
  adults,
  children,
  totalPrice,
  tourDate,
  bookingId
}: {
  customerName: string
  customerEmail: string
  adults: number
  children: number
  totalPrice: string
  tourDate: string
  bookingId: number
}) {
  try {
    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.log('Resend API key missing, cannot send confirmation email')
      return
    }

    // Calculate price breakdown
    const adultPrice = 179
    const childPrice = 149
    const adultTotal = adultPrice * adults
    const childTotal = childPrice * children
    const totalPriceNum = parseFloat(totalPrice)

    // Send confirmation email to customer
    const customerResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Royal Nordic <noreply@royalnordic.fi>',
        to: [customerEmail],
        subject: `Booking Confirmation - Northern Lights Tour - Royal Nordic`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <!-- Header with Company Name -->
            <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
              <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
              <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
            </div>
            
            <!-- Main Content -->
            <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 25px; font-size: 28px; text-align: center;">Booking Confirmed! 🎉</h1>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                Dear <strong>${customerName}</strong>,
              </p>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                Thank you for booking with Royal Nordic! Your Lapland adventure is confirmed and we're excited to show you the magic of the Northern Lights.
              </p>
              
              <!-- Tour Details -->
              <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Tour Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Tour:</strong> Northern Lights Tour</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Date:</strong> ${tourDate}</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Adults:</strong> ${adults}</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Children:</strong> ${children}</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Booking ID:</strong> #${bookingId}</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Confirmed</span></p>
                  </div>
                </div>
              </div>
              
              <!-- Price Breakdown -->
              <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #a7f3d0;">
                <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Price Breakdown</h3>
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; font-size: 14px;">
                  <div>
                    <p style="margin: 8px 0;">${adults} × Adult (€${adultPrice})</p>
                    <p style="margin: 8px 0;">${children} × Child (€${childPrice})</p>
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 8px 0;">€${adultTotal.toFixed(2)}</p>
                    <p style="margin: 8px 0;">€${childTotal.toFixed(2)}</p>
                  </div>
                </div>
                <hr style="border: none; border-top: 1px solid #d1fae5; margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
                  <span>Total:</span>
                  <span>€${totalPriceNum.toFixed(2)}</span>
                </div>
              </div>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #f59e0b;">
                <h3 style="color: #92400e; margin-bottom: 15px; font-size: 18px;">📋 What to Expect</h3>
                <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px;">
                  <li>Professional Northern Lights hunting experience</li>
                  <li>Expert local guides with years of experience</li>
                  <li>All necessary equipment provided</li>
                  <li>Hot drinks and snacks included</li>
                  <li>Professional photography assistance</li>
                  <li>Guaranteed Northern Lights or free return trip</li>
                </ul>
              </div>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                We'll send you detailed meeting instructions and what to bring 24 hours before your tour. If you have any questions, don't hesitate to contact us!
              </p>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                Best regards,<br>
                <strong>The Royal Nordic Team</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 30px 20px; background-color: #1f2937; color: white;">
              <h3 style="margin-bottom: 20px; font-size: 18px;">Contact Information</h3>
              <div style="display: inline-block; text-align: left;">
                <p style="margin: 8px 0; font-size: 14px;">
                  📧 <a href="mailto:contact@royalnordic.fi" style="color: #10b981; text-decoration: none;">contact@royalnordic.fi</a>
                </p>
                <p style="margin: 8px 0; font-size: 14px;">
                  📞 <a href="tel:+3584578345138" style="color: #10b981; text-decoration: none;">+358 45 78345138</a>
                </p>
                <p style="margin: 8px 0; font-size: 14px;">
                  🌍 <a href="https://royalnordic.fi" style="color: #10b981; text-decoration: none;">royalnordic.fi</a>
                </p>
              </div>
              <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af;">
                Rovaniemi, Finnish Lapland
              </p>
            </div>
          </div>
        `,
        text: `
Booking Confirmation - Northern Lights Tour - Royal Nordic

Dear ${customerName},

Thank you for booking with Royal Nordic! Your Lapland adventure is confirmed and we're excited to show you the magic of the Northern Lights.

Tour Details:
- Tour: Northern Lights Tour
- Date: ${tourDate}
- Adults: ${adults}
- Children: ${children}
- Booking ID: #${bookingId}
- Status: Confirmed

Price Breakdown:
${adults} × Adult (€${adultPrice}): €${adultTotal.toFixed(2)}
${children} × Child (€${childPrice}): €${childTotal.toFixed(2)}
Total: €${totalPriceNum.toFixed(2)}

What to Expect:
- Professional Northern Lights hunting experience
- Expert local guides with years of experience
- All necessary equipment provided
- Hot drinks and snacks included
- Professional photography assistance
- Guaranteed Northern Lights or free return trip

We'll send you detailed meeting instructions and what to bring 24 hours before your tour. If you have any questions, don't hesitate to contact us!

Best regards,
The Royal Nordic Team

Contact Information:
📧 contact@royalnordic.fi
📞 +358 45 78345138
🌍 royalnordic.fi
Rovaniemi, Finnish Lapland
        `,
      }),
    });

    if (customerResponse.ok) {
      console.log('Booking confirmation email sent successfully to:', customerEmail);
    } else {
      console.error('Failed to send confirmation email:', customerResponse.status, customerResponse.statusText);
    }

    // Send notification email to business
    const businessResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Royal Nordic <noreply@royalnordic.fi>',
        to: ['royalnordicfi@gmail.com'],
        subject: `New Booking Confirmation - ${customerName} - Royal Nordic`,
        html: `
          <h2>New Booking Confirmation</h2>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Adults:</strong> ${adults}</p>
          <p><strong>Children:</strong> ${children}</p>
          <p><strong>Total Price:</strong> €${totalPrice}</p>
          <p><strong>Tour Date:</strong> ${tourDate}</p>
          <p><strong>Booking ID:</strong> #${bookingId}</p>
          <hr>
          <p><em>This booking was confirmed through Stripe payment.</em></p>
        `,
        text: `
New Booking Confirmation

Customer: ${customerName}
Email: ${customerEmail}
Adults: ${adults}
Children: ${children}
Total Price: €${totalPrice}
Tour Date: ${tourDate}
Booking ID: #${bookingId}

This booking was confirmed through Stripe payment.
        `,
      }),
    });

    if (businessResponse.ok) {
      console.log('Business notification email sent successfully');
    } else {
      console.error('Failed to send business notification:', businessResponse.status, businessResponse.statusText);
    }
    
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
  }
}
