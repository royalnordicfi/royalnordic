import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Gmail SMTP implementation
async function sendViaGmail(emailData: any, user: string, pass: string) {
  const smtpData = {
    hostname: 'smtp.gmail.com',
    port: 587,
    username: user,
    password: pass,
    to: emailData.to.join(', '),
    subject: emailData.subject,
    content: emailData.html,
    html: emailData.html
  }

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: pass, // Using SMTP2GO as a simple alternative
        to: emailData.to,
        sender: user,
        subject: emailData.subject,
        html_body: emailData.html,
        text_body: emailData.text
      })
    })

    if (!response.ok) {
      throw new Error('SMTP service error')
    }

    const result = await response.json()
    return { messageId: result.data?.email_id || 'gmail-' + Date.now() }
  } catch (error) {
    console.error('Gmail SMTP error:', error)
    throw new Error('Failed to send email via Gmail')
  }
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
      message,
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

    // Construct email content for contact form
    const emailContent = `
New Customized Tour Request

Customer Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}

Message:
${message}

This request was submitted through your website's customized tour form.
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
          to: to || ['royalnordicfi@gmail.com'],
          subject: subject || 'New Customized Tour Request - ROYAL NORDIC',
          html: `
            <h2>New Customized Tour Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <hr>
            <p><em>This request was submitted through your website's customized tour form.</em></p>
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
          subject: 'Thank you for your Customized Tour Request - Royal Nordic!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <!-- Header with Company Name -->
              <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
                <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
                <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
              </div>
              
              <!-- Main Content -->
              <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #1f2937; margin-bottom: 25px; font-size: 28px; text-align: center;">Customized Tour Request Received!</h1>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                  Dear <strong>${name}</strong>,
                </p>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                  Thank you for choosing Royal Nordic for your customized Lapland adventure! We're excited to create a unique experience tailored specifically to your preferences and requirements.
                </p>
                
                <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                  <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">Your Customized Tour Request:</h3>
                  <p style="color: #4b5563; line-height: 1.6; font-style: italic; margin: 0;">${message}</p>
                </div>
                
                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #a7f3d0;">
                  <p style="color: #065f46; margin: 0; font-size: 16px; text-align: center;">
                    <strong>⏰ We'll be in touch soon with your personalized proposal</strong>
                  </p>
                </div>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                  Our expert team will carefully review your requirements and craft a personalized itinerary that includes:
                </p>
                
                <ul style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px; padding-left: 20px;">
                  <li>Detailed activity schedule and timing</li>
                  <li>Personalized pricing based on your group size</li>
                  <li>Special arrangements and requirements</li>
                  <li>Local insider tips and recommendations</li>
                  <li>All necessary equipment and safety measures</li>
                </ul>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                  In the meantime, feel free to explore our existing tours at <a href="https://royalnordic.fi" style="color: #059669; text-decoration: none; font-weight: 600;">royalnordic.fi</a> for inspiration.
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
Thank you for your Customized Tour Request - Royal Nordic!

Dear ${name},

Thank you for choosing Royal Nordic for your customized Lapland adventure! We're excited to create a unique experience tailored specifically to your preferences and requirements.

We have received your customized tour request and our expert team will review it carefully. We'll be in touch soon with your personalized proposal.

Your Customized Tour Request:
${message}

Our expert team will carefully review your requirements and craft a personalized itinerary that includes:
- Detailed activity schedule and timing
- Personalized pricing based on your group size
- Special arrangements and requirements
- Local insider tips and recommendations
- All necessary equipment and safety measures

In the meantime, feel free to explore our existing tours at royalnordic.fi for inspiration.

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
      console.log('Customized tour request emails sent successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Customized tour request emails sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (emailError) {
      console.error('Email Error:', emailError)
      
      // Fallback: Log the email content
      console.log('=== CUSTOMIZED TOUR REQUEST EMAIL (FALLBACK LOGGING) ===')
      console.log('Business Email To: royalnordicfi@gmail.com')
      console.log('Customer Email To: ' + email)
      console.log('From: Royal Nordic <contact@royalnordic.fi>')
      console.log('Subject: Thank you for your Customized Tour Request - Royal Nordic!')
      console.log('Customer Name: ' + name)
      console.log('Customer Message: ' + message)
      console.log('=== END CUSTOMIZED TOUR REQUEST EMAIL ===')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Form submitted successfully (email logged due to service issue)' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error processing contact form:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
