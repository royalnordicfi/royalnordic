import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, phone, message, topic, topicLabel } = await req.json()

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and message are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const topicLine = topicLabel || topic || 'General'
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.log('Resend API key not configured — contact form payload logged')
      console.log({ name, email, phone, topicLine, message })
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Message submitted successfully! We will contact you soon.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
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
          subject: `Contact — ${topicLine} — ROYAL NORDIC`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Topic:</strong> ${topicLine}</p>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>${String(message).replace(/\n/g, '<br>')}</p>
            <hr>
            <p><em>Reply to this email to reach ${email}</em></p>
          `,
          text: `
New Contact Form Submission

Topic: ${topicLine}
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}

Message:
${message}
          `,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        return new Response(
          JSON.stringify({ success: true, message: 'Message sent successfully!', emailId: result.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const errorText = await response.text()
      console.error('Resend API error:', response.status, errorText)
      throw new Error(`Resend API error: ${response.status}`)
    } catch (emailError) {
      console.error('Resend email failed:', emailError)
      return new Response(
        JSON.stringify({
          error: 'Could not send message right now. Please email contact@royalnordic.fi directly.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
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
