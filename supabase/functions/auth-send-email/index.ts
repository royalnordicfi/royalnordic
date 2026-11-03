/**
 * Supabase Auth "Send Email" hook → Resend.
 * From: Royal Nordic <noreply@royalnordic.fi>
 *
 * Does not use Stripe/booking paths. JWT verification is disabled so Auth can call it;
 * requests are authenticated via Standard Webhooks (SEND_EMAIL_HOOK_SECRET).
 */
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const PROJECT_REF = 'itihdgqgvlphtyidnvkt'
const FROM = 'Royal Nordic <noreply@royalnordic.fi>'
const SITE = 'https://royalnordic.fi'
const BRAND = '#0F8F63'

type EmailData = {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
  site_url: string
  token_new?: string
  token_hash_new?: string
}

type HookUser = {
  email?: string
  new_email?: string
  email_new?: string
}

function confirmationUrl(emailData: EmailData, tokenHash: string, type?: string): string {
  const params = new URLSearchParams({
    token: tokenHash,
    type: type || emailData.email_action_type,
    redirect_to: emailData.redirect_to || `${SITE}/referralprogram/verify`,
  })
  return `https://${PROJECT_REF}.supabase.co/auth/v1/verify?${params.toString()}`
}

function shell(title: string, bodyHtml: string, ctaLabel: string, ctaUrl: string): { html: string; text: string } {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#0b1220;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1220;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#111827;border:1px solid #1f2937;border-radius:12px;">
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND};">Royal Nordic</p>
          <h1 style="margin:12px 0 0;font-size:26px;line-height:1.2;font-weight:600;color:#ffffff;">${title}</h1>
        </td></tr>
        <tr><td style="padding:8px 28px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;color:#cbd5e1;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:8px 28px 28px;" align="left">
          <a href="${ctaUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;padding:12px 18px;border-radius:8px;">${ctaLabel}</a>
          <p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:#64748b;">If the button does not work, open this link:<br /><a href="${ctaUrl}" style="color:${BRAND};word-break:break-all;">${ctaUrl}</a></p>
        </td></tr>
        <tr><td style="padding:0 28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#64748b;">
          Royal Nordic · Rovaniemi, Finnish Lapland<br />
          <a href="${SITE}" style="color:#94a3b8;text-decoration:none;">royalnordic.fi</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const text = `${title}

Open this link to continue:
${ctaUrl}

Royal Nordic — ${SITE}`
  return { html, text }
}

function buildMessage(
  action: string,
  emailData: EmailData,
  opts?: { newEmail?: string },
): { subject: string; html: string; text: string } | null {
  switch (action) {
    case 'signup':
    case 'invite': {
      const url = confirmationUrl(emailData, emailData.token_hash, action === 'invite' ? 'invite' : 'signup')
      const { html, text } = shell(
        'Confirm your email',
        '<p style="margin:0 0 12px;">Confirm your email to activate your Royal Nordic Rewards account.</p><p style="margin:0;">This link expires soon and can only be used once.</p>',
        'Confirm email',
        url,
      )
      return { subject: 'Confirm your Royal Nordic Rewards email', html, text }
    }
    case 'recovery': {
      const url = confirmationUrl(emailData, emailData.token_hash, 'recovery')
      const { html, text } = shell(
        'Reset your password',
        '<p style="margin:0 0 12px;">We received a request to reset your Rewards password.</p><p style="margin:0;">If you did not ask for this, you can ignore this email.</p>',
        'Choose a new password',
        url,
      )
      return { subject: 'Reset your Royal Nordic Rewards password', html, text }
    }
    case 'magiclink': {
      const url = confirmationUrl(emailData, emailData.token_hash, 'magiclink')
      const { html, text } = shell(
        'Your sign-in link',
        '<p style="margin:0;">Use this one-time link to sign in to Royal Nordic Rewards.</p>',
        'Sign in',
        url,
      )
      return { subject: 'Your Royal Nordic Rewards sign-in link', html, text }
    }
    case 'email_change': {
      const url = confirmationUrl(emailData, emailData.token_hash, 'email_change')
      const newEmail = opts?.newEmail || ''
      const { html, text } = shell(
        'Confirm your new email',
        `<p style="margin:0 0 12px;">Confirm <strong style="color:#fff;">${newEmail || 'your new address'}</strong> for your Royal Nordic Rewards account.</p><p style="margin:0;">If you did not request this change, ignore this email.</p>`,
        'Confirm new email',
        url,
      )
      return { subject: 'Confirm your new Royal Nordic email', html, text }
    }
    case 'email_change_current': {
      // Secure email change — confirm on the current address
      const url = confirmationUrl(emailData, emailData.token_hash_new || emailData.token_hash, 'email_change')
      const { html, text } = shell(
        'Confirm email change',
        '<p style="margin:0;">Someone requested an email change on your Royal Nordic Rewards account. Confirm this request to continue.</p>',
        'Confirm request',
        url,
      )
      return { subject: 'Confirm a Royal Nordic email change request', html, text }
    }
    default:
      return null
  }
}

async function sendResend(to: string, subject: string, html: string, text: string) {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) throw new Error('RESEND_API_KEY not configured')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  })
  if (!response.ok) {
    const err = await response.text()
    console.error('Resend error', response.status, err)
    throw new Error(`Resend failed: ${response.status}`)
  }
  return await response.json()
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const hookSecretRaw = Deno.env.get('SEND_EMAIL_HOOK_SECRET') || ''
  const hookSecret = hookSecretRaw.replace('v1,whsec_', '')
  if (!hookSecret) {
    console.error('SEND_EMAIL_HOOK_SECRET missing')
    return new Response(JSON.stringify({ error: { message: 'Hook secret not configured' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)

  try {
    const event = wh.verify(payload, headers) as { user: HookUser; email_data: EmailData }
    const user = event.user
    const emailData = event.email_data
    const action = emailData.email_action_type

    // Secure email change: two messages when both hashes present
    if (action === 'email_change' && emailData.token_hash_new && emailData.token_new) {
      const currentEmail = user.email
      const newEmail = user.new_email || user.email_new
      if (currentEmail) {
        const msg = buildMessage('email_change_current', emailData)
        if (msg) await sendResend(currentEmail, msg.subject, msg.html, msg.text)
      }
      if (newEmail) {
        const msg = buildMessage('email_change', {
          ...emailData,
          token_hash: emailData.token_hash,
          token: emailData.token_new,
        }, { newEmail })
        if (msg) await sendResend(newEmail, msg.subject, msg.html, msg.text)
      }
    } else {
      const to = user.email
      if (!to) throw new Error('Missing recipient email')
      const msg = buildMessage(action, emailData, {
        newEmail: user.new_email || user.email_new,
      })
      if (!msg) {
        console.log('Ignoring unsupported auth email action', action)
      } else {
        const result = await sendResend(to, msg.subject, msg.html, msg.text)
        console.log('Auth email sent', action, result?.id)
      }
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('auth-send-email failed', error)
    const message = error instanceof Error ? error.message : 'Hook verification or send failed'
    return new Response(JSON.stringify({ error: { http_code: 401, message } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
