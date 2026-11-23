/**
 * Admin Google Calendar OAuth connect / disconnect / status helpers.
 * Does not enable production sync — flags remain DB-controlled (default off).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  decryptSecret,
  encryptSecret,
  exchangeGoogleCode,
  googleFetch,
  googleOAuthConfigured,
  googleRedirectUri,
  refreshGoogleAccessToken,
} from '../_shared/googleCalendar.ts'

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
    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: isAdmin, error: adminErr } = await userClient.rpc('is_admin')
    if (adminErr || !isAdmin) return json({ error: 'Forbidden' }, 403)

    const admin = createClient(supabaseUrl, serviceKey)
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')

    if (action === 'auth_url') {
      if (!googleOAuthConfigured()) {
        return json({
          error: 'oauth_not_configured',
          required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_TOKEN_ENCRYPTION_KEY'],
        }, 503)
      }
      const state = crypto.randomUUID()
      const params = new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        redirect_uri: googleRedirectUri(),
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
        state,
      })
      return json({
        url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        state,
        redirect_uri: googleRedirectUri(),
      })
    }

    if (action === 'exchange') {
      if (!googleOAuthConfigured()) return json({ error: 'oauth_not_configured' }, 503)
      const code = String(body.code || '').trim()
      if (!code) return json({ error: 'code_required' }, 400)
      const encKey = Deno.env.get('GOOGLE_TOKEN_ENCRYPTION_KEY')!
      const tokens = await exchangeGoogleCode(code)
      if (!tokens.refresh_token) {
        return json({
          error: 'refresh_token_missing',
          hint: 'Revoke prior access at myaccount.google.com/permissions and connect again with consent.',
        }, 400)
      }

      const meRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      const me = await meRes.json().catch(() => ({}))
      const email = typeof me.email === 'string' ? me.email : null

      let calendarId = String(body.calendar_id || '').trim()
      if (!calendarId) {
        // Prefer primary calendar of the connected account
        calendarId = 'primary'
      }

      const refreshCipher = await encryptSecret(tokens.refresh_token, encKey)
      const accessCipher = await encryptSecret(tokens.access_token, encKey)
      const expiresAt = new Date(Date.now() + (Number(tokens.expires_in) || 3600) * 1000).toISOString()

      const { error: upErr } = await admin
        .from('google_calendar_settings')
        .update({
          refresh_token_ciphertext: refreshCipher,
          access_token_ciphertext: accessCipher,
          token_expires_at: expiresAt,
          connected_email: email,
          calendar_id: calendarId,
          scopes: tokens.scope || null,
          connected_at: new Date().toISOString(),
          connected_by: user.id,
          last_error: null,
          updated_at: new Date().toISOString(),
          // Keep sync/reminders OFF until explicit enable
        })
        .eq('id', 1)
      if (upErr) throw upErr

      const { data: status } = await admin.rpc('admin_get_google_calendar_status')
      return json({ ok: true, status: status?.[0] || status })
    }

    if (action === 'disconnect') {
      const { error } = await admin
        .from('google_calendar_settings')
        .update({
          refresh_token_ciphertext: null,
          access_token_ciphertext: null,
          token_expires_at: null,
          connected_email: null,
          connected_at: null,
          connected_by: null,
          calendar_sync_enabled: false,
          reminders_enabled: false,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)
      if (error) throw error
      return json({ ok: true, disconnected: true })
    }

    if (action === 'list_calendars') {
      if (!googleOAuthConfigured()) return json({ error: 'oauth_not_configured' }, 503)
      const { data: row } = await admin.from('google_calendar_settings').select('*').eq('id', 1).maybeSingle()
      if (!row?.refresh_token_ciphertext) return json({ error: 'not_connected' }, 400)
      const encKey = Deno.env.get('GOOGLE_TOKEN_ENCRYPTION_KEY')!
      const refresh = await decryptSecret(row.refresh_token_ciphertext, encKey)
      const refreshed = await refreshGoogleAccessToken(refresh)
      const listRes = await googleFetch(refreshed.access_token, '/users/me/calendarList')
      const listJson = await listRes.json()
      if (!listRes.ok) return json({ error: 'calendar_list_failed', detail: listJson }, 502)
      const calendars = (listJson.items || []).map((c: { id: string; summary?: string; primary?: boolean }) => ({
        id: c.id,
        summary: c.summary,
        primary: Boolean(c.primary),
      }))
      return json({ ok: true, calendars })
    }

    return json({ error: 'unknown_action' }, 400)
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'internal_error' }, 500)
  }
})
