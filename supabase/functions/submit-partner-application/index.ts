import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { partnerAdminNotifyEmail, sendViaResend } from '../_shared/partnerEmails.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || `Bearer ${anonKey}`

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceKey)

    const body = await req.json()
    // Ignore any client-supplied status / role / approval fields.
    const { data, error } = await userClient.rpc('submit_partner_application', {
      p_company_name: String(body.company_name || ''),
      p_business_id: String(body.business_id || ''),
      p_country: String(body.country || ''),
      p_business_type: String(body.business_type || ''),
      p_contact_name: String(body.contact_name || ''),
      p_business_email: String(body.business_email || ''),
      p_description: String(body.description || ''),
      p_website: body.website ? String(body.website) : null,
      p_phone: body.phone ? String(body.phone) : null,
    })

    if (error) {
      console.error('submit_partner_application', error)
      return json({ error: error.message || 'Could not submit application' }, 400)
    }
    if (!data?.ok) {
      const code = String(data?.error || 'submit_failed')
      const status = code === 'duplicate_pending' ? 409 : 400
      return json({ error: code, application_id: data?.application_id || null }, status)
    }

    const applicationId = String(data.application_id)
    const { data: app } = await admin
      .from('partner_applications')
      .select(
        'id, company_name, contact_name, business_email, country, business_type, applicant_user_id',
      )
      .eq('id', applicationId)
      .maybeSingle()

    if (app) {
      try {
        const mail = partnerAdminNotifyEmail({
          applicationId: app.id,
          companyName: app.company_name,
          contactName: app.contact_name,
          businessEmail: app.business_email,
          country: app.country,
          businessType: app.business_type,
        })
        await sendViaResend(mail)
      } catch (mailErr) {
        console.error('admin notify email failed', mailErr)
      }
    }

    return json({
      ok: true,
      application_id: applicationId,
      status: 'pending',
    })
  } catch (error) {
    console.error('submit-partner-application', error)
    return json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})
