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
    const { name, email, phone, message } = await req.json()

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and message are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Use hardcoded API key for now
    const resendApiKey = 're_PNaUVEQ8_4DFVZMvqF5kteCw1H8pAhpPf'
    
    console.log('=== CONTACT FORM DEBUG ===')
    console.log('Name:', name)
    console.log('Email:', email)
    console.log('Phone:', phone)
    console.log('Message:', message)
    console.log('API Key present:', !!resendApiKey)
    console.log('=== END DEBUG ===')

    try {
      console.log('Attempting to send email...')
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Royal Nordic <noreply@royalnordic.fi>',
          to: ['contact@royalnordic.fi'],
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

      console.log('Email API response status:', response.status)
      console.log('Email API response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('Email sent successfully:', result)
        return new Response(
          JSON.stringify({ success: true, message: 'Message sent successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        const errorText = await response.text()
        console.error('Email API error:', response.status, errorText)
        throw new Error(`Email API error: ${response.status} - ${errorText}`)
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      
      // Fallback: Log the email content
      console.log('=== CONTACT FORM EMAIL (FALLBACK LOGGING) ===')
      console.log('Business Email To: contact@royalnordic.fi')
      console.log('Customer Email To: ' + email)
      console.log('From: Royal Nordic <noreply@royalnordic.fi>')
      console.log('Subject: New Contact Form Submission')
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
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
