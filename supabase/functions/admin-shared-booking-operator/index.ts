/**
 * Admin-only Shared Bookings operator provisioning.
 * Creates Auth users via service role; returns a one-time temporary password.
 * Never stores or re-reads plaintext passwords.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

function randomTempPassword(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `Sb-${raw.slice(0, 10)}-${raw.slice(10, 20)}!`
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
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '').toLowerCase()

    if (action === 'create') {
      return await createOperator(admin, adminUser.id, body)
    }
    if (action === 'set_active') {
      return await setActive(admin, body)
    }
    if (action === 'reset_temporary_password') {
      return await resetTemporaryPassword(admin, body)
    }

    return json({ error: 'invalid_action' }, 400)
  } catch (err) {
    console.error('admin-shared-booking-operator error', err)
    return json({ error: err instanceof Error ? err.message : 'server_error' }, 500)
  }
})

async function createOperator(
  admin: ReturnType<typeof createClient>,
  createdBy: string,
  body: Record<string, unknown>,
) {
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const displayName = String(body.display_name || '').trim().slice(0, 120) || null
  const supplierId = String(body.supplier_id || '').trim()

  if (!email || !email.includes('@')) return json({ error: 'email_required' }, 400)
  if (!supplierId) return json({ error: 'supplier_required' }, 400)

  const { data: supplier, error: supplierErr } = await admin
    .from('shared_suppliers')
    .select('id, code, display_name, is_active')
    .eq('id', supplierId)
    .maybeSingle()
  if (supplierErr || !supplier || !supplier.is_active) {
    return json({ error: 'supplier_not_found' }, 404)
  }

  const { data: existingOp } = await admin
    .from('shared_booking_operators')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  if (existingOp) return json({ error: 'operator_email_exists' }, 409)

  const temporaryPassword = randomTempPassword()
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      shared_bookings_operator: true,
    },
    app_metadata: {
      shared_bookings_role: 'operator',
      shared_supplier_code: supplier.code,
    },
  })
  if (createErr || !created.user) {
    return json({ error: createErr?.message || 'auth_create_failed' }, 400)
  }

  const { data: operator, error: opErr } = await admin
    .from('shared_booking_operators')
    .insert({
      user_id: created.user.id,
      supplier_id: supplierId,
      email,
      display_name: displayName,
      is_active: true,
      must_change_password: true,
      created_by: createdBy,
    })
    .select('id, user_id, email, display_name, supplier_id, is_active, must_change_password, created_at')
    .single()

  if (opErr) {
    await admin.auth.admin.deleteUser(created.user.id)
    return json({ error: opErr.message || 'operator_insert_failed' }, 400)
  }

  // Authorize supplier on all current shared_bus departures.
  const { data: sharedDeps } = await admin
    .from('shared_departures')
    .select('id')
    .eq('board', 'shared_bus')
  if (sharedDeps?.length) {
    await admin.from('shared_departure_access').upsert(
      sharedDeps.map((d) => ({ departure_id: d.id, supplier_id: supplierId })),
      { onConflict: 'departure_id,supplier_id' },
    )
  }

  return json({
    ok: true,
    operator: {
      ...operator,
      supplier_code: supplier.code,
      supplier_name: supplier.display_name,
    },
    temporary_password: temporaryPassword,
    note: 'Share this temporary password once. It cannot be retrieved again. Operator must change it on first login.',
  })
}

async function setActive(admin: ReturnType<typeof createClient>, body: Record<string, unknown>) {
  const operatorId = String(body.operator_id || '').trim()
  const isActive = Boolean(body.is_active)
  if (!operatorId) return json({ error: 'operator_id_required' }, 400)

  const { data, error } = await admin
    .from('shared_booking_operators')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', operatorId)
    .select('id, email, is_active, user_id')
    .maybeSingle()
  if (error || !data) return json({ error: error?.message || 'not_found' }, 404)

  if (data.user_id) {
    await admin.auth.admin.updateUserById(data.user_id, {
      app_metadata: {
        shared_bookings_role: isActive ? 'operator' : 'operator_disabled',
      },
      ban_duration: isActive ? 'none' : '876000h',
    })
  }

  return json({ ok: true, operator: data })
}

async function resetTemporaryPassword(
  admin: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
) {
  const operatorId = String(body.operator_id || '').trim()
  if (!operatorId) return json({ error: 'operator_id_required' }, 400)

  const { data: op, error } = await admin
    .from('shared_booking_operators')
    .select('id, user_id, email, is_active')
    .eq('id', operatorId)
    .maybeSingle()
  if (error || !op) return json({ error: 'not_found' }, 404)
  if (!op.is_active) return json({ error: 'operator_inactive' }, 400)

  const temporaryPassword = randomTempPassword()
  const { error: updAuthErr } = await admin.auth.admin.updateUserById(op.user_id, {
    password: temporaryPassword,
  })
  if (updAuthErr) return json({ error: updAuthErr.message }, 400)

  await admin
    .from('shared_booking_operators')
    .update({
      must_change_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', operatorId)

  return json({
    ok: true,
    operator_id: op.id,
    email: op.email,
    temporary_password: temporaryPassword,
    note: 'One-time temporary password. Operator must change it on next login.',
  })
}
