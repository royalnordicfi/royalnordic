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

    console.log('=== CONTACT FORM DEBUG ===')
    console.log('Name:', name)
    console.log('Email:', email)
    console.log('Phone:', phone)
    console.log('Message:', message)
    console.log('=== END DEBUG ===')

    // Use Resend to send from your custom domain
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.log('Resend API key not configured, logging email content')
      console.log('=== CONTACT FORM EMAIL CONTENT ===')
      console.log('TO: contact@royalnordic.fi')
      console.log('FROM: ' + name + ' <' + email + '>')
      console.log('MESSAGE: ' + message)
      console.log('=== END EMAIL CONTENT ===')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message submitted successfully! We will contact you soon.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
      console.log('Sending email via Resend...')
      console.log('API Key:', resendApiKey ? 'Present' : 'Missing')
      console.log('From:', 'contact@royalnordic.fi')
      console.log('To:', 'contact@royalnordic.fi')
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Royal Nordic <onboarding@resend.dev>',
          to: ['contact@royalnordic.fi'],
          reply_to: [email],
          subject: 'New Contact Form Submission - ROYAL NORDIC',
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Customer Inquiry From:</strong> ${name} (${email})</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <hr>
            <p><em>This inquiry was submitted through your website's contact form.</em></p>
            <p><em>To reply to the customer, simply reply to this email - it will go to ${email}</em></p>
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

      console.log('Resend response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Email sent successfully via Resend:', result)
        return new Response(
          JSON.stringify({ success: true, message: 'Message sent successfully!' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        const errorText = await response.text()
        console.error('Resend API error:', response.status, errorText)
        throw new Error(`Resend API error: ${response.status} - ${errorText}`)
      }
    } catch (emailError) {
      console.error('Resend email failed:', emailError)
      
      // Fallback: Log the email content
      console.log('=== CONTACT FORM EMAIL (FALLBACK) ===')
      console.log('TO: contact@royalnordic.fi')
      console.log('FROM: ' + name + ' <' + email + '>')
      console.log('MESSAGE: ' + message)
      console.log('=== END EMAIL ===')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message submitted successfully! We will contact you soon.' 
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
