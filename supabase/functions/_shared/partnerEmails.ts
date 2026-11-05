const FROM = 'Royal Nordic <noreply@royalnordic.fi>'
const SITE = 'https://royalnordic.fi'
const ADMIN = 'https://admin.royalnordic.fi'
const BRAND = '#0F8F63'

function shell(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string): {
  html: string
  text: string
} {
  const cta =
    ctaLabel && ctaUrl
      ? `<tr><td style="padding:8px 28px 28px;" align="left">
          <a href="${ctaUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;padding:12px 18px;border-radius:8px;">${ctaLabel}</a>
          <p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:#64748b;">If the button does not work, open this link:<br /><a href="${ctaUrl}" style="color:${BRAND};word-break:break-all;">${ctaUrl}</a></p>
        </td></tr>`
      : `<tr><td style="padding:0 28px 28px;"></td></tr>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#0b1220;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1220;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#111827;border:1px solid #1f2937;border-radius:12px;">
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND};">Royal Nordic Partners</p>
          <h1 style="margin:12px 0 0;font-size:26px;line-height:1.2;font-weight:600;color:#ffffff;">${title}</h1>
        </td></tr>
        <tr><td style="padding:8px 28px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;color:#cbd5e1;">
          ${bodyHtml}
        </td></tr>
        ${cta}
        <tr><td style="padding:0 28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#64748b;">
          Royal Nordic · Rovaniemi, Finnish Lapland<br />
          <a href="${SITE}" style="color:#94a3b8;text-decoration:none;">royalnordic.fi</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const text = `${title}

${ctaUrl || SITE}

Royal Nordic — ${SITE}`
  return { html, text }
}

export function partnerInviteEmail(opts: {
  contactName: string
  companyName: string
  activateUrl: string
}): { from: string; subject: string; html: string; text: string } {
  const { html, text } = shell(
    'Your partnership is approved',
    `<p style="margin:0 0 12px;">Hi ${escapeHtml(opts.contactName)},</p>
     <p style="margin:0 0 12px;"><strong style="color:#fff;">${escapeHtml(opts.companyName)}</strong> is approved as a Royal Nordic partner.</p>
     <p style="margin:0;">Use the secure link below to access your Partner dashboard. No password is sent by email — sign in or set your password through this link.</p>`,
    'Open Partner dashboard',
    opts.activateUrl,
  )
  return {
    from: FROM,
    subject: 'Welcome to Royal Nordic Partners',
    html,
    text,
  }
}

export function partnerAdminNotifyEmail(opts: {
  applicationId: string
  companyName: string
  contactName: string
  businessEmail: string
  country: string
  businessType: string
}): { from: string; subject: string; html: string; text: string; to: string[] } {
  const adminUrl = `${ADMIN}/partners?id=${encodeURIComponent(opts.applicationId)}`
  const { html, text } = shell(
    'New partner application',
    `<p style="margin:0 0 12px;"><strong style="color:#fff;">${escapeHtml(opts.companyName)}</strong> applied to partner with Royal Nordic.</p>
     <p style="margin:0 0 8px;">Contact: ${escapeHtml(opts.contactName)} · ${escapeHtml(opts.businessEmail)}</p>
     <p style="margin:0 0 8px;">Country: ${escapeHtml(opts.country)} · Type: ${escapeHtml(opts.businessType)}</p>
     <p style="margin:0;">Review in Admin (internal only). Do not forward this email publicly.</p>`,
    'Review in Admin',
    adminUrl,
  )
  return {
    from: FROM,
    to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
    subject: `Partner application: ${opts.companyName}`,
    html,
    text,
  }
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendViaResend(payload: {
  from: string
  to: string | string[]
  subject: string
  html: string
  text: string
}): Promise<void> {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) throw new Error('RESEND_API_KEY not configured')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: payload.from,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend failed: ${res.status} ${err}`)
  }
}
