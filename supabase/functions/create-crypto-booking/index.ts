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
    const {
      tour_id,
      tour_date_id,
      customer_name,
      customer_email,
      customer_phone,
      adults,
      children,
      total_price,
      tour_name,
      tour_date,
      crypto_type,
      special_requests,
      payment_type
    } = await req.json()

    // Validate required fields
    if (!tour_id || !tour_date_id || !customer_name || !customer_email || !adults || !total_price) {
      throw new Error('Missing required fields')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, check availability and update slots
    const { data: dateData, error: dateError } = await supabase
      .from('tour_dates')
      .select('available_slots, total_booked')
      .eq('id', tour_date_id)
      .single()

    if (dateError) {
      console.error('Error fetching date data:', dateError)
      throw new Error('Date not found')
    }

    const remainingSlots = dateData.available_slots - dateData.total_booked
    const requestedSlots = adults + children

    if (requestedSlots > remainingSlots) {
      console.error('Not enough slots available')
      throw new Error(`Only ${remainingSlots} slots available`)
    }

    // Create booking record with crypto payment type
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tour_id: tour_id,
        tour_date_id: tour_date_id,
        customer_name: customer_name,
        customer_email: customer_email,
        customer_phone: customer_phone || '',
        adults: adults,
        children: children,
        total_price: total_price,
        status: 'pending_crypto_payment', // Special status for crypto bookings
        special_requests: special_requests || '',
        payment_type: 'crypto',
        crypto_type: crypto_type
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
      .eq('id', tour_date_id)

    if (updateError) {
      console.error('Error updating slots:', updateError)
      // Don't fail the booking if slot update fails
    }

    // Send crypto-specific email notifications
    const emailData = {
      bookingId: booking.id,
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone || '',
      tourName: tour_name,
      tourDate: tour_date,
      adults: adults,
      children: children,
      totalPrice: total_price,
      specialRequests: special_requests || '',
      cryptoType: crypto_type,
      paymentStatus: 'pending_crypto_payment' as const,
      createdAt: new Date().toISOString()
    }

    // Send notification to Royal Nordic staff
    await sendEmailNotification(emailData, 'admin')
    
    // Send confirmation to customer
    await sendEmailNotification(emailData, 'customer')

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking_id: booking.id,
        message: 'Crypto booking created successfully. You will receive payment instructions via email.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Crypto booking error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// Unified email sending function for crypto bookings
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
        subject: `New Crypto Booking: ${bookingData.tourName} - ${bookingData.customerName}`,
        html: `
          <h2>🪙 New Crypto Booking Alert</h2>
          <h3>📋 Booking Details</h3>
          <p><strong>Booking ID:</strong> #${bookingData.bookingId}</p>
          <p><strong>Tour:</strong> ${bookingData.tourName}</p>
          <p><strong>Date:</strong> ${new Date(bookingData.tourDate).toLocaleDateString('fi-FI')}</p>
          <p><strong>Status:</strong> ${bookingData.paymentStatus.toUpperCase()}</p>
          <p><strong>Payment Type:</strong> <span style="color: #059669; font-weight: bold;">CRYPTOCURRENCY</span></p>
          <p><strong>Crypto Type:</strong> ${bookingData.cryptoType.toUpperCase()}</p>
          
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
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">⚠️ Action Required</h3>
            <p style="color: #92400e; margin-bottom: 0;">
              <strong>This is a crypto payment booking!</strong> You need to contact the customer to provide wallet address and payment instructions for ${bookingData.cryptoType.toUpperCase()}.
            </p>
          </div>
          
          <p><strong>⏰ Booking Time:</strong> ${new Date(bookingData.createdAt).toLocaleString('fi-FI')}</p>
        `,
        text: `
New Crypto Booking Alert - Royal Nordic Tours

📋 Booking Details:
- Booking ID: #${bookingData.bookingId}
- Tour: ${bookingData.tourName}
- Date: ${new Date(bookingData.tourDate).toLocaleDateString('fi-FI')}
- Status: ${bookingData.paymentStatus.toUpperCase()}
- Payment Type: CRYPTOCURRENCY
- Crypto Type: ${bookingData.cryptoType.toUpperCase()}

👥 Customer Information:
- Name: ${bookingData.customerName}
- Email: ${bookingData.customerEmail}
- Phone: ${bookingData.customerPhone || 'Not provided'}

💰 Pricing:
- Adults: ${bookingData.adults}
- Children: ${bookingData.children}
- Total: €${bookingData.totalPrice}

${bookingData.specialRequests ? `📝 Special Requests: ${bookingData.specialRequests}` : ''}

⚠️ ACTION REQUIRED:
This is a crypto payment booking! You need to contact the customer to provide wallet address and payment instructions for ${bookingData.cryptoType.toUpperCase()}.

⏰ Booking Time: ${new Date(bookingData.createdAt).toLocaleString('fi-FI')}
        `
      }
    } else {
      emailData = {
        from: 'Royal Nordic <contact@royalnordic.fi>',
        to: [bookingData.customerEmail],
        subject: `Crypto Booking Confirmed: ${bookingData.tourName} - Royal Nordic`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
              <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
              <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
            </div>
            
            <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 25px; font-size: 28px; text-align: center;">Crypto Booking Confirmed! 🪙</h1>
              
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
                <p style="color: #4b5563; margin: 8px 0;"><strong>Payment Method:</strong> <span style="color: #059669; font-weight: bold;">${bookingData.cryptoType.toUpperCase()}</span></p>
                ${bookingData.specialRequests ? `<p style="color: #4b5563; margin: 8px 0;"><strong>Special Requests:</strong> ${bookingData.specialRequests}</p>` : ''}
              </div>
              
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">🪙 Crypto Payment Instructions</h3>
                <p style="color: #92400e; margin-bottom: 10px;">
                  <strong>You will soon receive a separate email with:</strong>
                </p>
                <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                  <li>Wallet address for ${bookingData.cryptoType.toUpperCase()}</li>
                  <li>Exact amount to send</li>
                  <li>Payment confirmation instructions</li>
                </ul>
                <p style="color: #92400e; margin-top: 15px; margin-bottom: 0;">
                  <strong>Please wait for our payment instructions before sending any crypto payments.</strong>
                </p>
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
                <li>You'll receive crypto payment instructions within 24 hours</li>
                <li>Complete your crypto payment as instructed</li>
                <li>You'll receive detailed tour information 24 hours before your adventure</li>
                <li>Meet your guide at the designated location</li>
                ${bookingData.tourName.includes('Snowshoe') ? '<li>All equipment and safety gear will be provided</li>' : ''}
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
Crypto Booking Confirmed - Royal Nordic Tours

Dear ${bookingData.customerName},

Thank you for booking your Lapland adventure with Royal Nordic! We're excited to welcome you to the magical world of Finnish Lapland.

Your Booking Details:
- Booking ID: #${bookingData.bookingId}
- Tour: ${bookingData.tourName}
- Date: ${new Date(bookingData.tourDate).toLocaleDateString('fi-FI')}
- Adults: ${bookingData.adults}
- Children: ${bookingData.children}
- Total Amount: €${bookingData.totalPrice}
- Payment Method: ${bookingData.cryptoType.toUpperCase()}
${bookingData.specialRequests ? `- Special Requests: ${bookingData.specialRequests}` : ''}

🪙 CRYPTO PAYMENT INSTRUCTIONS:
You will soon receive a separate email with:
- Wallet address for ${bookingData.cryptoType.toUpperCase()}
- Exact amount to send
- Payment confirmation instructions

Please wait for our payment instructions before sending any crypto payments.

✅ Your booking is confirmed!

What happens next?
- You'll receive crypto payment instructions within 24 hours
- Complete your crypto payment as instructed
- You'll receive detailed tour information 24 hours before your adventure
- Meet your guide at the designated location
${bookingData.tourName.includes('Snowshoe') ? '- All equipment and safety gear will be provided' : ''}
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
