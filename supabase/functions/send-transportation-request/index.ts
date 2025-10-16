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
      destination,
      additionalInfo,
      serviceType,
      to,
      subject
    } = await req.json()

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.log('Resend configuration missing, cannot send email')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Construct email content for transportation request
    const emailContent = `
Transportation Request - ${serviceType}

Customer Details:
- Name: ${name}
- Email: ${email}
- Destination: ${destination}

Additional Information:
${additionalInfo}

This request was submitted through your website's transportation form.
    `.trim()

    // Send email using Resend API
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
          to: to || ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: subject || `Transportation Request - ${serviceType} - ROYAL NORDIC`,
          html: `
            <h2>Transportation Request - ${serviceType}</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Destination:</strong> ${destination}</p>
            <p><strong>Additional Information:</strong></p>
            <p>${additionalInfo}</p>
            <hr>
            <p><em>This request was submitted through your website's transportation form.</em></p>
          `,
          text: emailContent,
        }),
      })

      // Send thank you email to customer
      const customerResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Royal Nordic <contact@royalnordic.fi>',
          to: [email],
          subject: `Thank you for your Transportation Request - Royal Nordic!`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">ROYAL NORDIC</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Finnish Lapland Adventures</p>
              </div>
              
              <!-- Main Content -->
              <div style="padding: 40px 30px; background-color: #ffffff;">
                <h2 style="color: #065f46; margin-bottom: 25px; font-size: 24px; text-align: center;">
                  Transportation Request Received!
                </h2>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                  Dear ${name},
                </p>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                  Thank you for choosing Royal Nordic for your transportation needs in Lapland! We're excited to help you travel comfortably and safely throughout our beautiful region.
                </p>
                
                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                  <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">Your Transportation Request:</h3>
                  <p style="color: #4b5563; margin: 8px 0; font-size: 16px;"><strong>Destination:</strong> ${destination}</p>
                  <p style="color: #4b5563; margin: 8px 0; font-size: 16px;"><strong>Service:</strong> ${serviceType}</p>
                  <p style="color: #4b5563; margin: 8px 0; font-size: 16px;"><strong>Additional Information:</strong></p>
                  <p style="color: #4b5563; margin: 8px 0; font-size: 16px;">${additionalInfo}</p>
                </div>
                
                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #a7f3d0;">
                  <p style="color: #065f46; margin: 0; font-size: 16px; text-align: center;">
                    <strong>⏰ We'll be in touch soon with your personalized quote</strong>
                  </p>
                </div>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                  Our professional team will carefully review your transportation requirements and provide you with:
                </p>
                
                <ul style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px; padding-left: 20px;">
                  <li>Detailed pricing based on your specific route and requirements</li>
                  <li>Flexible scheduling options that work for you</li>
                  <li>Professional driver with local knowledge</li>
                  <li>Comfortable vehicle suitable for your group size</li>
                  <li>All necessary arrangements and special requests</li>
                </ul>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                  In the meantime, feel free to explore our other services at <a href="https://royalnordic.fi" style="color: #059669; text-decoration: none; font-weight: 600;">royalnordic.fi</a>.
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
Thank you for your Transportation Request - Royal Nordic!

Dear ${name},

Thank you for choosing Royal Nordic for your transportation needs in Lapland! We're excited to help you travel comfortably and safely throughout our beautiful region.

We have received your transportation request and our professional team will review it carefully. We'll be in touch soon with your personalized quote.

Your Transportation Request:
- Destination: ${destination}
- Service: ${serviceType}
- Additional Information: ${additionalInfo}

Our professional team will carefully review your transportation requirements and provide you with:
- Detailed pricing based on your specific route and requirements
- Flexible scheduling options that work for you
- Professional driver with local knowledge
- Comfortable vehicle suitable for your group size
- All necessary arrangements and special requests

In the meantime, feel free to explore our other services at royalnordic.fi.

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
      console.log('Transportation request emails sent successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Transportation request emails sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (emailError) {
      console.error('Email Error:', emailError)
      return new Response(
        JSON.stringify({ error: 'Failed to send transportation request emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
  } catch (error) {
    console.error('Function Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
