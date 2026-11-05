/**
 * Admin-only partner application review.
 * Actions: approve | decline | revoke
 * Sets app_metadata.partner_status via service role only. Never accepts client-set roles.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { partnerInviteEmail, sendViaResend } from '../_shared/partnerEmails.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE = (Deno.env.get('SITE_URL') || 'https://royalnordic.fi').replace(/\/$/, '')

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user: adminUser },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !adminUser) return json({ error: 'Unauthorized' }, 401)

    const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin')
    if (adminError || !isAdmin) return json({ error: 'Admin access required' }, 403)

    const admin = createClient(supabaseUrl, serviceKey)
    const body = await req.json()
    const action = String(body.action || '').toLowerCase()
    const applicationId = String(body.application_id || '').trim()
    const note = body.admin_note != null ? String(body.admin_note).slice(0, 2000) : null
    const memberUserId = body.user_id ? String(body.user_id) : null

    if (action === 'revoke') {
      return await revokePartner(admin, {
        userId: memberUserId,
        applicationId: applicationId || null,
        adminUserId: adminUser.id,
        note,
      })
    }

    if (!applicationId || !['approve', 'decline'].includes(action)) {
      return json({ error: 'Invalid action or application_id' }, 400)
    }

    const { data: app, error: appErr } = await admin
      .from('partner_applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle()
    if (appErr || !app) return json({ error: 'Application not found' }, 404)

    if (action === 'decline') {
      if (app.status !== 'pending' && app.status !== 'approved') {
        return json({ error: 'not_pending', status: app.status }, 400)
      }
      const { error: updErr } = await admin
        .from('partner_applications')
        .update({
          status: 'declined',
          admin_note: note,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
      if (updErr) throw updErr

      // If previously approved, revoke membership + metadata
      if (app.partner_company_id) {
        await admin
          .from('partner_members')
          .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('partner_company_id', app.partner_company_id)
          .eq('status', 'active')
      }
      const targetUserId = app.applicant_user_id
      if (targetUserId) {
        await setPartnerStatus(admin, targetUserId, 'declined')
        await admin.auth.admin.signOut(targetUserId, 'global').catch(() => undefined)
      }

      return json({ ok: true, status: 'declined', application_id: applicationId })
    }

    // APPROVE
    if (app.status === 'approved') {
      return json({ ok: true, status: 'approved', application_id: applicationId, duplicate: true })
    }
    if (app.status !== 'pending') {
      return json({ error: 'not_pending', status: app.status }, 400)
    }

    const { data: company, error: coErr } = await admin
      .from('partner_companies')
      .insert({
        name: app.company_name,
        business_id: app.business_id,
        country: app.country,
        business_type: app.business_type,
        website: app.website,
        description: app.description,
        contact_name: app.contact_name,
        contact_email: app.business_email,
        contact_phone: app.phone,
      })
      .select('*')
      .single()
    if (coErr || !company) throw coErr || new Error('Could not create company')

    // Find or create auth user by business email — preserve Rewards accounts / balances.
    let partnerUserId = app.applicant_user_id as string | null
    const email = String(app.business_email).toLowerCase()

    if (!partnerUserId) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          display_name: app.contact_name,
          partner_company_name: app.company_name,
        },
      })
      if (!createErr && created.user) {
        partnerUserId = created.user.id
      } else {
        // Existing Rewards (or other) account — resolve via magic-link generation.
        const { data: probe, error: probeErr } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email,
        })
        partnerUserId = probe?.user?.id || null
        if (!partnerUserId) {
          throw createErr || probeErr || new Error('Could not link partner user')
        }
      }
    }

    await setPartnerStatus(admin, partnerUserId!, 'approved', company.id)

    const { error: memErr } = await admin.from('partner_members').upsert(
      {
        user_id: partnerUserId,
        partner_company_id: company.id,
        application_id: applicationId,
        member_role: 'owner',
        status: 'active',
        updated_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: 'user_id,partner_company_id' },
    )
    if (memErr) throw memErr

    const { error: appUpdErr } = await admin
      .from('partner_applications')
      .update({
        status: 'approved',
        partner_company_id: company.id,
        applicant_user_id: partnerUserId,
        admin_note: note,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
    if (appUpdErr) throw appUpdErr

    // Magic link / recovery-style activation — never email a password.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${SITE}/partners/dashboard`,
      },
    })
    if (linkErr) {
      console.error('generateLink', linkErr)
      return json({
        ok: true,
        status: 'approved',
        application_id: applicationId,
        company_id: company.id,
        user_id: partnerUserId,
        invite_sent: false,
        invite_error: linkErr.message,
      })
    }

    const props = (linkData.properties || {}) as Record<string, string>
    const activateUrl =
      props.action_link ||
      (props.hashed_token
        ? `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(props.hashed_token)}&type=magiclink&redirect_to=${encodeURIComponent(`${SITE}/partners/dashboard`)}`
        : `${SITE}/account/signin?intent=partners`)

    try {
      const mail = partnerInviteEmail({
        contactName: app.contact_name,
        companyName: app.company_name,
        activateUrl: String(activateUrl),
      })
      await sendViaResend({ ...mail, to: email })
      await admin
        .from('partner_applications')
        .update({ invitation_sent_at: new Date().toISOString() })
        .eq('id', applicationId)
    } catch (mailErr) {
      console.error('partner invite email', mailErr)
      return json({
        ok: true,
        status: 'approved',
        application_id: applicationId,
        company_id: company.id,
        user_id: partnerUserId,
        invite_sent: false,
        invite_error: mailErr instanceof Error ? mailErr.message : 'email_failed',
      })
    }

    return json({
      ok: true,
      status: 'approved',
      application_id: applicationId,
      company_id: company.id,
      user_id: partnerUserId,
      invite_sent: true,
    })
  } catch (error) {
    console.error('admin-partner-application', error)
    return json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    )
  }
})

async function setPartnerStatus(
  admin: ReturnType<typeof createClient>,
  userId: string,
  status: 'approved' | 'declined' | 'revoked' | null,
  companyId?: string | null,
) {
  const { data: existing, error } = await admin.auth.admin.getUserById(userId)
  if (error || !existing.user) throw error || new Error('user_not_found')
  const prev = (existing.user.app_metadata || {}) as Record<string, unknown>
  const next: Record<string, unknown> = { ...prev }
  if (status === null || status === 'revoked') {
    delete next.partner_status
    delete next.partner_company_id
  } else {
    next.partner_status = status
    if (companyId) next.partner_company_id = companyId
  }
  // Never strip unrelated metadata (Rewards intact).
  const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: next,
  })
  if (updErr) throw updErr
}

async function revokePartner(
  admin: ReturnType<typeof createClient>,
  opts: {
    userId: string | null
    applicationId: string | null
    adminUserId: string
    note: string | null
  },
) {
  let userId = opts.userId
  let companyId: string | null = null

  if (opts.applicationId) {
    const { data: app } = await admin
      .from('partner_applications')
      .select('id, applicant_user_id, partner_company_id')
      .eq('id', opts.applicationId)
      .maybeSingle()
    if (app) {
      userId = userId || app.applicant_user_id
      companyId = app.partner_company_id
      await admin
        .from('partner_applications')
        .update({
          admin_note: opts.note,
          updated_at: new Date().toISOString(),
        })
        .eq('id', opts.applicationId)
    }
  }

  if (!userId && !companyId) return json({ error: 'user_id or application_id required' }, 400)

  if (userId) {
    await admin
      .from('partner_members')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'active')
    await setPartnerStatus(admin, userId, 'revoked')
    await admin.auth.admin.signOut(userId, 'global').catch(() => undefined)
  } else if (companyId) {
    const { data: members } = await admin
      .from('partner_members')
      .select('user_id')
      .eq('partner_company_id', companyId)
      .eq('status', 'active')
    await admin
      .from('partner_members')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('partner_company_id', companyId)
      .eq('status', 'active')
    for (const m of members || []) {
      await setPartnerStatus(admin, m.user_id, 'revoked')
      await admin.auth.admin.signOut(m.user_id, 'global').catch(() => undefined)
    }
  }

  return json({ ok: true, status: 'revoked' })
}
