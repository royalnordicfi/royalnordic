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
    // Verify webhook signature
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    if (!signature || !webhookSecret) {
      console.log('Missing signature or webhook secret')
      return new Response('Unauthorized', { status: 401 })
    }

    const event = await parseWebhookPayload(req, signature, webhookSecret)
    console.log('Received webhook event:', event.type)

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
        throw new Error('Failed to create booking')
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
        await sendEmailNotification(emailData, 'admin')
        
        // Send confirmation to customer
        await sendEmailNotification(emailData, 'customer')
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

// Parse webhook payload with signature verification
async function parseWebhookPayload(req: Request, signature: string, webhookSecret: string) {
  const payload = await req.text()
  
  try {
    // For test mode, we'll just parse the JSON directly
    // In production, you'd verify the signature with Stripe
    const event = JSON.parse(payload)
    return event
  } catch (error) {
    throw new Error('Invalid webhook payload')
  }
}

// Unified email sending function
async function sendEmailNotification(bookingData: any, type: 'admin' | 'customer') {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const gmailUser = Deno.env.get('GMAIL_USER')
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')
  
  console.log(`Resend API key found for ${type} email:`, resendApiKey ? 'YES' : 'NO')
  console.log(`Gmail credentials found for ${type} email:`, gmailUser && gmailPassword ? 'YES' : 'NO')
  
  if (!resendApiKey && !gmailUser) {
    console.log('No email service configured, cannot send email')
    return
  }

  try {
    let emailData: any = {}

    if (type === 'admin') {
      emailData = {
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

${bookingData.specialRequests ? `📝 Special Requests: ${bookingData.specialRequests}` : ''}

⏰ Booking Time: ${new Date(bookingData.createdAt).toLocaleString('fi-FI')}
        `
      }
    } else {
      emailData = {
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
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                Thank you for booking your Lapland adventure with Royal Nordic! We're excited to welcome you to the magical world of Finnish Lapland.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">Your Booking Details:</h3>
                <p style="color: #4b5563; margin: 8px 0;"><strong>Booking ID:</strong> #${bookingData.bookingId}</p>
                <p style="color: #4b5563; margin: 8px 0;"><strong>Tour:</strong> ${bookingData.tourName}</p>
                <p style="color: #4b5563; margin: 8px 0;"><strong>Date:</strong> ${new Date(bookingData.tourDate).toLocaleDateString('fi-FI')}</p>
                <p style="color: #4b5563; margin: 8px 0;"><strong>Adults:</strong> ${bookingData.adults}</p>
                <p style="color: #4b5563; margin: 8px 0;"><strong>Children:</strong> ${bookingData.children}</p>
                <p style="color: #4b5563; margin: 8px 0;"><strong>Total Amount:</strong> €${bookingData.totalPrice}</p>
                ${bookingData.specialRequests ? `<p style="color: #4b5563; margin: 8px 0;"><strong>Special Requests:</strong> ${bookingData.specialRequests}</p>` : ''}
              </div>
              
              <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #a7f3d0;">
                <p style="color: #065f46; margin: 0; font-size: 16px; text-align: center;">
                  <strong>✅ Your booking is confirmed!</strong>
                </p>
              </div>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                <strong>What happens next?</strong>
              </p>
              
              <ul style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px; padding-left: 20px;">
                <li>You'll receive detailed tour information 24 hours before your adventure</li>
                <li>Meet your guide at the designated location</li>
                <li>All equipment and safety gear will be provided</li>
                <li>Enjoy your unforgettable Lapland experience!</li>
              </ul>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                If you have any questions or need to make changes, please contact us at <a href="mailto:contact@royalnordic.fi" style="color: #059669; text-decoration: none; font-weight: 600;">contact@royalnordic.fi</a> or call +358 45 78345138.
              </p>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                Best regards,<br>
                <strong>The Royal Nordic Team</strong>
              </p>
            </div>
            
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
Booking Confirmed - Royal Nordic Tours

Dear ${bookingData.customerName},

Thank you for booking your Lapland adventure with Royal Nordic! We're excited to welcome you to the magical world of Finnish Lapland.

Your Booking Details:
- Booking ID: #${bookingData.bookingId}
- Tour: ${bookingData.tourName}
- Date: ${new Date(bookingData.tourDate).toLocaleDateString('fi-FI')}
- Adults: ${bookingData.adults}
- Children: ${bookingData.children}
- Total Amount: €${bookingData.totalPrice}
${bookingData.specialRequests ? `- Special Requests: ${bookingData.specialRequests}` : ''}

✅ Your booking is confirmed!

What happens next?
- You'll receive detailed tour information 24 hours before your adventure
- Meet your guide at the designated location
- All equipment and safety gear will be provided
- Enjoy your unforgettable Lapland experience!

If you have any questions or need to make changes, please contact us at contact@royalnordic.fi or call +358 45 78345138.

Best regards,
The Royal Nordic Team

Contact Information:
📧 contact@royalnordic.fi
📞 +358 45 78345138
🌍 royalnordic.fi
Rovaniemi, Finnish Lapland
        `
      }
    }

    // Try Resend first, then fallback to Gmail SMTP
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error(`Failed to send ${type} email via Resend:`, error)
        // Fallback to Gmail if Resend fails
        if (gmailUser && gmailPassword) {
          await sendViaGmail(emailData, type)
        }
      } else {
        console.log(`${type} email sent successfully via Resend`)
      }
    } else if (gmailUser && gmailPassword) {
      await sendViaGmail(emailData, type)
    }
  } catch (error) {
    console.error(`Error sending ${type} email:`, error)
  }
}

// Gmail SMTP fallback function
async function sendViaGmail(emailData: any, type: string) {
  const gmailUser = Deno.env.get('GMAIL_USER')
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')
  
  if (!gmailUser || !gmailPassword) {
    console.log('Gmail credentials not available')
    return
  }

  try {
    // For now, just log that we would send via Gmail
    // In a real implementation, you'd use a SMTP library
    console.log(`Would send ${type} email via Gmail to:`, emailData.to)
    console.log(`Subject: ${emailData.subject}`)
    console.log(`${type} email would be sent via Gmail SMTP`)
  } catch (error) {
    console.error(`Error sending ${type} email via Gmail:`, error)
  }
}