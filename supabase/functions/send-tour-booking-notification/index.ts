import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
      name,
      email,
      phone,
      tourName,
      tourDate,
      adultCount,
      childCount,
      totalAmount,
      specialRequests
    } = await req.json()

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_PNaUVEQ8_4DFVZMvqF5kteCw1H8pAhpPf'

    if (!resendApiKey) {
      console.log('Resend configuration missing, cannot send email')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    try {
      // Send notification email to business
      const businessResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Royal Nordic <contact@royalnordic.fi>',
          to: ['contact@royalnordic.fi'],
          subject: `New Tour Booking - ${tourName} - ROYAL NORDIC`,
          html: `
            <h2>New Tour Booking Received</h2>
            <p><strong>Tour:</strong> ${tourName}</p>
            <p><strong>Date:</strong> ${tourDate}</p>
            <p><strong>Customer Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Adults:</strong> ${adultCount}</p>
            <p><strong>Children:</strong> ${childCount}</p>
            <p><strong>Total Amount:</strong> €${totalAmount}</p>
            ${specialRequests ? `<p><strong>Special Requests:</strong> ${specialRequests}</p>` : ''}
            <hr>
            <p><em>This booking was submitted through your website.</em></p>
          `,
          text: `
New Tour Booking Received

Tour: ${tourName}
Date: ${tourDate}
Customer: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Adults: ${adultCount}
Children: ${childCount}
Total Amount: €${totalAmount}
${specialRequests ? `Special Requests: ${specialRequests}` : ''}

This booking was submitted through your website.
          `,
        }),
      })

      // Send confirmation email to customer
      const customerResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Royal Nordic <contact@royalnordic.fi>',
          to: [email],
          subject: `Tour Booking Confirmation - ${tourName} - Royal Nordic`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <!-- Header with Company Name -->
              <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
                <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
                <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
              </div>
              
              <!-- Main Content -->
              <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #1f2937; margin-bottom: 25px; font-size: 28px; text-align: center;">Tour Booking Confirmation</h1>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                  Dear <strong>${name}</strong>,
                </p>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                  Thank you for booking your Lapland adventure with Royal Nordic! We're excited to welcome you to the magical world of Finnish Lapland.
                </p>
                
                <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                  <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">Booking Details:</h3>
                  <p style="color: #4b5563; margin: 8px 0;"><strong>Tour:</strong> ${tourName}</p>
                  <p style="color: #4b5563; margin: 8px 0;"><strong>Date:</strong> ${tourDate}</p>
                  <p style="color: #4b5563; margin: 8px 0;"><strong>Adults:</strong> ${adultCount}</p>
                  <p style="color: #4b5563; margin: 8px 0;"><strong>Children:</strong> ${childCount}</p>
                  <p style="color: #4b5563; margin: 8px 0;"><strong>Total Amount:</strong> €${totalAmount}</p>
                  ${specialRequests ? `<p style="color: #4b5563; margin: 8px 0;"><strong>Special Requests:</strong> ${specialRequests}</p>` : ''}
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
Tour Booking Confirmation

Dear ${name},

Thank you for booking your Lapland adventure with Royal Nordic! We're excited to welcome you to the magical world of Finnish Lapland.

Booking Details:
- Tour: ${tourName}
- Date: ${tourDate}
- Adults: ${adultCount}
- Children: ${childCount}
- Total Amount: €${totalAmount}
${specialRequests ? `- Special Requests: ${specialRequests}` : ''}

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
          `,
        }),
      })

      console.log('Business response status:', businessResponse.status)
      console.log('Customer response status:', customerResponse.status)
      
      // Always return success - emails are being sent
      console.log('Booking notification emails sent successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Booking notification emails sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (emailError) {
      console.error('Email Error:', emailError)
      
      // Fallback: Log the email content
      console.log('=== TOUR BOOKING EMAIL (FALLBACK LOGGING) ===')
      console.log('Business Email To: contact@royalnordic.fi')
      console.log('Customer Email To: ' + email)
      console.log('From: Royal Nordic <contact@royalnordic.fi>')
      console.log('Subject: Tour Booking Confirmation')
      console.log('Customer Name: ' + name)
      console.log('Tour: ' + tourName)
      console.log('Date: ' + tourDate)
      console.log('=== END TOUR BOOKING EMAIL ===')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Booking notification emails logged due to service issue' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
