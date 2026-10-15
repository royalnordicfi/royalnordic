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
    const body = await req.json()
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
      tripType,
      returnDate,
      returnTime,
      adults,
      children,
      infants,
      totalPassengers,
      largeSuitcases,
      smallBags,
      specialLuggage,
      specialRequirements,
      to,
      subject,
    } = body

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.log('Resend configuration missing, cannot send email')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
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
          status: 'new',
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
    const safeTrip =
      tripType === 'round_trip' ? 'Round trip' : tripType === 'one_way' ? 'One way' : 'Not specified'
    const safeReturn =
      tripType === 'round_trip'
        ? `${returnDate || '—'} ${returnTime || ''}`.trim()
        : 'N/A'
    const safePax =
      totalPassengers != null
        ? String(totalPassengers)
        : adults != null || children != null || infants != null
          ? `${adults ?? 0} adults, ${children ?? 0} children, ${infants ?? 0} infants`
          : 'Not specified'
    const safeLuggage = [
      largeSuitcases != null ? `${largeSuitcases} large` : null,
      smallBags != null ? `${smallBags} small/carry-on` : null,
    ]
      .filter(Boolean)
      .join(', ') || 'Not specified'
    const safeSpecialLuggage = specialLuggage ? String(specialLuggage) : 'N/A'
    const safeSpecialReq = specialRequirements ? String(specialRequirements) : 'N/A'
    const safeInfo = additionalInfo ? String(additionalInfo) : 'N/A'

    const emailContent = `
Transportation Request - ${safeService}

Customer Details:
- Name: ${safeName}
- Email: ${safeEmail}
- Phone: ${safePhone}

Journey:
- Pickup: ${safePickup}
- Destination: ${safeDestination}
- Date: ${safeDate}
- Pickup time: ${safeTime}
- Trip type: ${safeTrip}
- Return: ${safeReturn}

Group & luggage:
- Passengers: ${safeGroup}
- Total passengers: ${safePax}
- Luggage: ${safeLuggage}
- Additional luggage / equipment: ${safeSpecialLuggage}
- Special requirements: ${safeSpecialReq}

Additional information:
${safeInfo}

This request was submitted through your website's transportation form.
    `.trim()

    const details: DetailRow[] = [
      { label: 'Service', value: safeService },
      { label: 'Pickup', value: safePickup },
      { label: 'Destination', value: safeDestination },
      { label: 'Preferred date', value: safeDate },
      { label: 'Preferred time', value: safeTime },
      { label: 'Trip type', value: safeTrip },
      { label: 'Return', value: safeReturn },
      { label: 'Passengers', value: safeGroup },
      { label: 'Luggage', value: safeLuggage },
      { label: 'Additional luggage / equipment', value: safeSpecialLuggage },
      { label: 'Special requirements', value: safeSpecialReq },
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
            <p><strong>Pickup:</strong> ${escapeHtml(safePickup)}</p>
            <p><strong>Destination:</strong> ${escapeHtml(safeDestination)}</p>
            <p><strong>Date:</strong> ${escapeHtml(safeDate)}</p>
            <p><strong>Pickup time:</strong> ${escapeHtml(safeTime)}</p>
            <p><strong>Trip type:</strong> ${escapeHtml(safeTrip)}</p>
            <p><strong>Return:</strong> ${escapeHtml(safeReturn)}</p>
            <p><strong>Passengers:</strong> ${escapeHtml(safeGroup)}</p>
            <p><strong>Luggage:</strong> ${escapeHtml(safeLuggage)}</p>
            <p><strong>Additional luggage / equipment:</strong> ${escapeHtml(safeSpecialLuggage)}</p>
            <p><strong>Special requirements:</strong> ${escapeHtml(safeSpecialReq)}</p>
            <p><strong>Additional information:</strong></p>
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

      if (!businessResponse.ok) {
        const errText = await businessResponse.text()
        console.error('Business email failed:', errText)
        return new Response(
          JSON.stringify({ error: 'Failed to send transportation request emails' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
        )
      }

      console.log('Transportation request emails sent successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Transportation request emails sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    } catch (emailError) {
      console.error('Email Error:', emailError)
      return new Response(
        JSON.stringify({ error: 'Failed to send transportation request emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
      )
    }
  } catch (error) {
    console.error('Function Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
