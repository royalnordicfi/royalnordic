import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildRequestReceivedEmail,
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
      destination,
      additionalInfo,
      serviceType,
      phone,
      pickupDetails,
      preferredDate,
      preferredTime,
      groupSize,
      to,
      subject
    } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.log('Resend configuration missing, cannot send email')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (supabase) {
      const { error: insertError } = await supabase
        .from('transportation_requests')
        .insert({
          name,
          email,
          phone: phone || '',
          service_type: serviceType,
          destination: destination || '',
          pickup_details: pickupDetails || destination || '',
          preferred_date: preferredDate || null,
          preferred_time: preferredTime || '',
          group_size: groupSize || '',
          additional_info: additionalInfo || '',
          status: 'new'
        })

      if (insertError) {
        console.error('Error saving transportation request to Supabase:', insertError)
      } else {
        console.log('Transportation request stored successfully')
      }
    } else {
      console.warn('Supabase credentials missing, skipping database persistence')
    }

    const safeName = String(name || 'there')
    const safeEmail = String(email || '')
    const safePhone = phone ? String(phone) : 'Not provided'
    const safeService = String(serviceType || 'Private Transportation')
    const safeDestination = String(destination || 'Not specified')
    const safePickup = String(pickupDetails || 'Not provided')
    const safeDate = preferredDate ? String(preferredDate) : 'Not provided'
    const safeTime = preferredTime ? String(preferredTime) : 'Not provided'
    const safeGroup = groupSize ? String(groupSize) : 'Not specified'
    const safeInfo = additionalInfo ? String(additionalInfo) : 'N/A'

    const emailContent = `
Transportation Request - ${safeService}

Customer Details:
- Name: ${safeName}
- Email: ${safeEmail}
- Phone: ${safePhone}
- Destination: ${safeDestination}
- Pickup Details: ${safePickup}
- Preferred Date: ${safeDate}
- Preferred Time: ${safeTime}
- Group Size: ${safeGroup}

Additional Information:
${safeInfo}

This request was submitted through your website's transportation form.
    `.trim()

    const details: DetailRow[] = [
      { label: 'Service', value: safeService },
      { label: 'Destination', value: safeDestination },
      { label: 'Pickup', value: safePickup },
      { label: 'Preferred date', value: safeDate },
      { label: 'Preferred time', value: safeTime },
      { label: 'Group size', value: safeGroup },
      { label: 'Additional information', value: safeInfo },
    ]

    const customerEmail = buildRequestReceivedEmail({
      kind: 'transportation',
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
          to: to || ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: subject || `Transportation Request - ${safeService} - ROYAL NORDIC`,
          html: `
            <h2>Transportation Request - ${escapeHtml(safeService)}</h2>
            <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(safePhone)}</p>
            <p><strong>Destination:</strong> ${escapeHtml(safeDestination)}</p>
            <p><strong>Pickup Details:</strong> ${escapeHtml(safePickup)}</p>
            <p><strong>Preferred Date:</strong> ${escapeHtml(safeDate)}</p>
            <p><strong>Preferred Time:</strong> ${escapeHtml(safeTime)}</p>
            <p><strong>Group Size:</strong> ${escapeHtml(safeGroup)}</p>
            <p><strong>Additional Information:</strong></p>
            <p style="white-space:pre-wrap;">${escapeHtml(safeInfo)}</p>
            <hr>
            <p><em>This request was submitted through your website's transportation form.</em></p>
          `,
          text: emailContent,
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
      console.log('Transportation request emails sent successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Transportation request emails sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (emailError) {
      console.error('Email Error:', emailError)
      return new Response(
        JSON.stringify({ error: 'Failed to send transportation request emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
  } catch (error) {
    console.error('Function Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
