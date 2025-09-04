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

    // Use Resend with your existing setup but send to Gmail
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    console.log('=== RESEND API KEY CHECK ===')
    console.log('RESEND_API_KEY exists:', !!resendApiKey)
    console.log('RESEND_API_KEY length:', resendApiKey ? resendApiKey.length : 0)
    console.log('RESEND_API_KEY starts with:', resendApiKey ? resendApiKey.substring(0, 10) + '...' : 'N/A')
    console.log('=== END API KEY CHECK ===')
    
    if (!resendApiKey) {
      console.log('Resend API key not configured, logging email content')
      console.log('=== CONTACT FORM EMAIL CONTENT ===')
      console.log('TO: royalnordicfi@gmail.com')
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
      console.log('Sending email via Resend to Gmail...')
      console.log('From: Royal Nordic <contact@royalnordic.fi>')
      console.log('To: royalnordicfi@gmail.com')
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Royal Nordic <contact@royalnordic.fi>',
          to: ['royalnordicfi@gmail.com'],
          reply_to: email,
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
      console.log('Resend response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('Email sent successfully via Resend:', result)
        console.log('Email ID:', result.id)
        return new Response(
          JSON.stringify({ success: true, message: 'Message sent successfully!', emailId: result.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        const errorText = await response.text()
        console.error('Resend API error:', response.status, errorText)
        console.error('Full response:', response)
        throw new Error(`Resend API error: ${response.status} - ${errorText}`)
      }
    } catch (emailError) {
      console.error('Resend email failed:', emailError)
      
      // Fallback: Log the email content
      console.log('=== CONTACT FORM EMAIL (FALLBACK) ===')
      console.log('TO: royalnordicfi@gmail.com')
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
