import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  buildRequestReceivedEmail,
  detectRequestKind,
  escapeHtml,
  type DetailRow,
} from '../_shared/bookingEmails.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
      subject,
      type,
    } = await req.json()

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.log('Resend configuration missing, cannot send email')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const kind = detectRequestKind(subject, type, message)
    const safeName = String(name || 'there')
    const safeEmail = String(email || '')
    const safePhone = phone ? String(phone) : 'Not provided'
    const safeMessage = String(message || '')

    const businessSubject =
      subject ||
      (kind === 'partner'
        ? 'Travel Trade Partnership Enquiry - ROYAL NORDIC'
        : kind === 'snowmobile'
          ? 'New Snowmobile Safari Request - ROYAL NORDIC'
          : kind === 'monster'
            ? 'New Monster Truck Northern Lights Experience Request - ROYAL NORDIC'
            : 'New Customized Tour Request - ROYAL NORDIC')

    const businessHeading =
      kind === 'partner'
        ? 'New Travel Trade Partnership Enquiry'
        : kind === 'snowmobile'
          ? 'New Snowmobile Safari Request'
          : kind === 'monster'
            ? 'New Monster Truck Northern Lights Request'
            : 'New Customized Tour Request'

    const businessNote =
      kind === 'partner'
        ? 'This enquiry was submitted through the Partner With Us / travel-trade form.'
        : 'This request was submitted through your website.'

    const details: DetailRow[] = [
      { label: 'Name', value: safeName },
      { label: 'Email', value: safeEmail },
      { label: 'Phone', value: safePhone },
      { label: 'Message', value: safeMessage },
    ]

    const customerEmail = buildRequestReceivedEmail({
      kind: kind === 'transportation' ? 'customized' : kind,
      customerName: safeName,
      customerEmail: safeEmail,
      details,
    })

    try {
      const businessResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Royal Nordic <contact@royalnordic.fi>',
          to: to || ['royalnordicfi@gmail.com'],
          subject: businessSubject,
          html: `
            <h2>${escapeHtml(businessHeading)}</h2>
            <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(safePhone)}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${escapeHtml(safeMessage)}</p>
            <hr>
            <p><em>${escapeHtml(businessNote)}</em></p>
          `,
          text: `${businessHeading}

Name: ${safeName}
Email: ${safeEmail}
Phone: ${safePhone}

Message:
${safeMessage}

${businessNote}`,
        }),
      })

      const customerResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: customerEmail.from,
          to: customerEmail.to,
          subject: customerEmail.subject,
          html: customerEmail.html,
          text: customerEmail.text,
        }),
      })

      console.log('Business response status:', businessResponse.status)
      console.log('Customer response status:', customerResponse.status)
      console.log(`${kind} request emails sent successfully`)

      return new Response(
        JSON.stringify({
          success: true,
          message: `${kind} request emails sent successfully`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (emailError) {
      console.error('Email Error:', emailError)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Form submitted successfully (email logged due to service issue)',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error processing contact form:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
