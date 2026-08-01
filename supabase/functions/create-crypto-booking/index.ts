import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { formatTourDateForDisplay } from '../_shared/tourDate.ts'
import {
  buildCryptoBookingEmail,
  displayTourName,
} from '../_shared/bookingEmails.ts'

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
      subtotal,
      discount,
      discount_code,
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

    // Server-side promo validation (must match src/config/winterPromotion.ts)
    const PROMO_ENABLED = true
    const PROMO_CODE = 'WINTER20'
    const PROMO_PERCENT = 20
    if (subtotal != null) {
      const sub = Number(subtotal)
      const claimedDiscount = Number(discount || 0)
      const code = String(discount_code || '').trim().toUpperCase()
      const charged = Number(total_price)
      const expectedDiscount =
        PROMO_ENABLED && code === PROMO_CODE
          ? Math.round(sub * (PROMO_PERCENT / 100) * 100) / 100
          : 0
      const expectedTotal = Math.round((sub - expectedDiscount) * 100) / 100
      if (Math.abs(claimedDiscount - expectedDiscount) > 0.02) {
        throw new Error('Invalid discount code or discount amount')
      }
      if (Math.abs(charged - expectedTotal) > 0.02) {
        throw new Error('Payment amount does not match pricing rules')
      }
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
        subject: `New Crypto Booking: ${displayTourName(bookingData.tourName)} - ${bookingData.customerName}`,
        html: `
          <h2>🪙 New Crypto Booking Alert</h2>
          <h3>📋 Booking Details</h3>
          <p><strong>Booking ID:</strong> #${bookingData.bookingId}</p>
          <p><strong>Tour:</strong> ${displayTourName(bookingData.tourName)}</p>
          <p><strong>Date:</strong> ${formatTourDateForDisplay(bookingData.tourDate, 'fi-FI', 'short')}</p>
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
- Date: ${formatTourDateForDisplay(bookingData.tourDate, 'fi-FI', 'short')}
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
      const customerMail = buildCryptoBookingEmail({
        bookingId: bookingData.bookingId,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        tourName: bookingData.tourName,
        tourDate: bookingData.tourDate,
        adults: bookingData.adults,
        children: bookingData.children,
        totalPrice: bookingData.totalPrice,
        specialRequests: bookingData.specialRequests,
        cryptoType: bookingData.cryptoType,
      })
      emailData = {
        from: customerMail.from,
        to: customerMail.to,
        subject: customerMail.subject,
        html: customerMail.html,
        text: customerMail.text,
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
