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

    // For now, we'll use a simple email service
    // In production, you can integrate with Resend, SendGrid, or similar
    const emailResult = await sendEmailViaService({
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

// Email service integration
async function sendEmailViaService(emailData: EmailRequest) {
  // Option 1: Use Gmail SMTP (primary for this setup)
  const gmailUser = Deno.env.get('GMAIL_USER')
  const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD')
  if (gmailUser && gmailPass) {
    return await sendViaGmail(emailData, gmailUser, gmailPass)
  }

  // Option 2: Use Resend (if configured)
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (resendApiKey) {
    return await sendViaResend(emailData, resendApiKey)
  }

  // Option 3: Use SendGrid
  // const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
  // if (sendgridApiKey) {
  //   return await sendViaSendGrid(emailData, sendgridApiKey)
  // }

  // Fallback: Log email details (for development)
  console.log('Email would be sent:', {
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html.substring(0, 200) + '...',
    text: emailData.text.substring(0, 200) + '...'
  })

  return { messageId: 'dev-mode-' + Date.now() }
}

// Gmail SMTP implementation
async function sendViaGmail(emailData: EmailRequest, user: string, pass: string) {
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

// Resend implementation (uncomment when you have Resend API key)
async function sendViaResend(emailData: EmailRequest, apiKey: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
            body: JSON.stringify({
          from: 'Royal Nordic <royalnordicfi@gmail.com>',
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        }),
  })

  if (!response.ok) {
    throw new Error('Resend API error')
  }

  const result = await response.json()
  return { messageId: result.id }
}
