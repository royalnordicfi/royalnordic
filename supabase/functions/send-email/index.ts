import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string[]
  subject: string
  html: string
  text: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json()

    // Validate request
    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new Error('Invalid recipients')
    }
    if (!subject || !html || !text) {
      throw new Error('Missing required fields')
    }

    // Use Resend for fast email delivery
    const emailResult = await sendViaResend({
      to,
      subject,
      html,
      text
    })

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.messageId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Resend implementation for fast email delivery
async function sendViaResend(emailData: EmailRequest) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

  // Send from your verified domain for better deliverability
  const fromEmail = 'noreply@royalnordic.fi'
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Royal Nordic <${fromEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      // Add headers for better deliverability
      headers: {
        'X-Priority': '1', // High priority
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Resend API error:', errorData)
    throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`)
  }

  const result = await response.json()
  return { messageId: result.id }
}
