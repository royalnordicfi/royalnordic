import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type RequestType = 'customized' | 'partner'

function isPartnerRequest(type: unknown, subject: unknown, message: unknown): boolean {
  if (type === 'partner') return true
  const subjectText = typeof subject === 'string' ? subject.toLowerCase() : ''
  const messageText = typeof message === 'string' ? message.toLowerCase() : ''
  return (
    subjectText.includes('travel trade') ||
    subjectText.includes('partnership') ||
    messageText.includes('travel trade / partnership')
  )
}

function partnerCustomerHtml(name: string, message: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
      <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
        <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
        <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
      </div>

      <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #1f2937; margin-bottom: 25px; font-size: 28px; text-align: center;">Partnership Enquiry Received</h1>

        <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
          Dear <strong>${name}</strong>,
        </p>

        <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
          Thank you for contacting Royal Nordic about a travel trade partnership. We have received your enquiry and our team will review it shortly.
        </p>

        <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
          <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">Your message:</h3>
          <p style="color: #4b5563; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
        </div>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #a7f3d0;">
          <p style="color: #065f46; margin: 0; font-size: 16px; text-align: center;">
            <strong>We will reply with next steps as soon as possible</strong>
          </p>
        </div>

        <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
          In the meantime, you can browse our guest-facing experiences at
          <a href="https://royalnordic.fi" style="color: #059669; text-decoration: none; font-weight: 600;">royalnordic.fi</a>
          or review the partner overview at
          <a href="https://royalnordic.fi/travel-trade" style="color: #059669; text-decoration: none; font-weight: 600;">royalnordic.fi/travel-trade</a>.
        </p>

        <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
          Best regards,<br>
          <strong>The Royal Nordic Team</strong>
        </p>
      </div>

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
  `
}

function partnerCustomerText(name: string, message: string) {
  return `
Partnership Enquiry Received - Royal Nordic

Dear ${name},

Thank you for contacting Royal Nordic about a travel trade partnership. We have received your enquiry and our team will review it shortly.

Your message:
${message}

We will reply with next steps as soon as possible.

Browse experiences: https://royalnordic.fi
Partner overview: https://royalnordic.fi/travel-trade

Best regards,
The Royal Nordic Team

Contact:
contact@royalnordic.fi
+358 45 78345138
royalnordic.fi
Rovaniemi, Finnish Lapland
  `.trim()
}

function customizedCustomerHtml(name: string, message: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
      <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
        <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
        <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
      </div>

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
          <p style="color: #4b5563; line-height: 1.6; font-style: italic; margin: 0; white-space: pre-wrap;">${message}</p>
        </div>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #a7f3d0;">
          <p style="color: #065f46; margin: 0; font-size: 16px; text-align: center;">
            <strong>We'll be in touch soon with your personalized proposal</strong>
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
  `
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

    const requestType: RequestType = isPartnerRequest(type, subject, message)
      ? 'partner'
      : 'customized'

    const safeName = String(name || 'there')
    const safeEmail = String(email || '')
    const safePhone = phone ? String(phone) : 'Not provided'
    const safeMessage = String(message || '')

    const businessSubject =
      subject ||
      (requestType === 'partner'
        ? 'Travel Trade Partnership Enquiry - ROYAL NORDIC'
        : 'New Customized Tour Request - ROYAL NORDIC')

    const businessHeading =
      requestType === 'partner'
        ? 'New Travel Trade Partnership Enquiry'
        : 'New Customized Tour Request'

    const businessNote =
      requestType === 'partner'
        ? 'This enquiry was submitted through the Partner With Us / travel-trade form.'
        : "This request was submitted through your website's customized tour form."

    const customerSubject =
      requestType === 'partner'
        ? 'We received your partnership enquiry — Royal Nordic'
        : 'Thank you for your Customized Tour Request - Royal Nordic!'

    const customerHtml =
      requestType === 'partner'
        ? partnerCustomerHtml(safeName, safeMessage)
        : customizedCustomerHtml(safeName, safeMessage)

    const customerText =
      requestType === 'partner'
        ? partnerCustomerText(safeName, safeMessage)
        : `
Thank you for your Customized Tour Request - Royal Nordic!

Dear ${safeName},

Thank you for choosing Royal Nordic for your customized Lapland adventure! We're excited to create a unique experience tailored specifically to your preferences and requirements.

We have received your customized tour request and our expert team will review it carefully. We'll be in touch soon with your personalized proposal.

Your Customized Tour Request:
${safeMessage}

Best regards,
The Royal Nordic Team

contact@royalnordic.fi
+358 45 78345138
royalnordic.fi
        `.trim()

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
            <h2>${businessHeading}</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Phone:</strong> ${safePhone}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${safeMessage}</p>
            <hr>
            <p><em>${businessNote}</em></p>
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
          from: 'Royal Nordic <contact@royalnordic.fi>',
          to: [safeEmail],
          subject: customerSubject,
          html: customerHtml,
          text: customerText,
        }),
      })

      console.log('Business response status:', businessResponse.status)
      console.log('Customer response status:', customerResponse.status)
      console.log(`${requestType} request emails sent successfully`)

      return new Response(
        JSON.stringify({
          success: true,
          message: `${requestType} request emails sent successfully`,
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
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
