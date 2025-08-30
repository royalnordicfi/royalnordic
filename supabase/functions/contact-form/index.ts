// Follow this setup guide to integrate the Deno language server with your editor:f th w
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Hello from Functions!")

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
      message
    } = await req.json()

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.log('Resend API key missing, cannot send email')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Send professional thank you email to customer and notification to business
    try {
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
          subject: 'New Contact Form Submission - ROYAL NORDIC',
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <hr>
            <p><em>This message was submitted through your website's contact form.</em></p>
          `,
          text: `
New Contact Form Submission

Customer Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone || 'Not provided'}

Message:
${message}

This message was submitted through your website's contact form.
          `,
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
                  from: 'Royal Nordic <noreply@royalnordic.fi>',
        to: [email],
          subject: 'Thank you for contacting Royal Nordic!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
              <!-- Header with Company Name -->
              <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
                <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
                <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
              </div>
              
              <!-- Main Content -->
              <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #1f2937; margin-bottom: 25px; font-size: 28px; text-align: center;">Thank you for contacting us!</h1>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                  Dear <strong>${name}</strong>,
                </p>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                  Thank you for reaching out to Royal Nordic! We're excited to help you plan your perfect Lapland adventure.
                </p>
                
                <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                  <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">Your Message:</h3>
                  <p style="color: #4b5563; line-height: 1.6; font-style: italic; margin: 0;">${message}</p>
                </div>
                
                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #a7f3d0;">
                  <p style="color: #065f46; margin: 0; font-size: 16px; text-align: center;">
                    <strong>⏰ We'll get back to you within 24 hours</strong>
                  </p>
                </div>
                
                <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                  In the meantime, feel free to explore our tours and experiences at <a href="https://royalnordic.fi" style="color: #059669; text-decoration: none; font-weight: 600;">royalnordic.fi</a>
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
Thank you for contacting Royal Nordic!

Dear ${name},

Thank you for reaching out to Royal Nordic! We're excited to help you plan your perfect Lapland adventure.

We have received your message and our team will review it carefully. You can expect a personalized response within 24 hours.

Your Message:
${message}

In the meantime, feel free to explore our tours and experiences at royalnordic.fi

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

      if (businessResponse.ok && customerResponse.ok) {
        console.log('Both emails sent successfully - business notification and customer thank you')
        return new Response(
          JSON.stringify({ success: true, message: 'Message sent successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        throw new Error('One or both emails failed to send')
      }
    } catch (emailError) {
      console.error('Email Error:', emailError)
      
      // Fallback: Log the email content
      console.log('=== CONTACT FORM EMAIL (FALLBACK LOGGING) ===')
      console.log('Business Email To: royalnordicfi@gmail.com')
      console.log('Customer Email To: ' + email)
      console.log('From: Royal Nordic <contact@royalnordic.fi>')
      console.log('Subject: Thank you for contacting Royal Nordic!')
      console.log('Customer Name: ' + name)
      console.log('Customer Message: ' + message)
      console.log('=== END CONTACT FORM EMAIL ===')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message submitted successfully (email logged due to service issue)' 
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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/contact-form' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
