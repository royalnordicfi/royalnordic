import { formatTourDateForDisplay } from './tourDate.ts'

export type BookingEmailData = {
  bookingId: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  tourName: string
  tourDate: string
  adults: number
  children: number
  totalPrice: number
  specialRequests?: string
}

export type DetailRow = { label: string; value: string }

export type BrandedEmailContent = {
  subject: string
  title: string
  introHtml: string
  introText: string
  detailsHeading: string
  details: DetailRow[]
  nextSteps: string[]
  customerEmail: string
  customerName: string
}

const SUPPORT_EMAIL = 'contact@royalnordic.fi'
const SUPPORT_PHONE = '+358 45 78345138'
const SUPPORT_PHONE_TEL = '+3584578345138'
const SITE_URL = 'https://royalnordic.fi'

/** Map DB tour names to the customer-facing product names used on the site. */
export function displayTourName(tourName: string): string {
  if (tourName === 'Northern Lights Tour') return 'Guaranteed Northern Lights Tour'
  return tourName
}

export function tourTimeSuffix(tourName: string): string {
  const name = displayTourName(tourName)
  if (name.includes('Family-Friendly Northern Lights')) return ' at 21:00'
  if (
    name === 'Northern Lights Tour' ||
    name === 'Guaranteed Northern Lights Tour' ||
    name.includes('Northern Lights')
  ) {
    return ' at 18:30'
  }
  return ''
}

export function formatBookingDateLabel(tourDate: string, tourName: string): string {
  return `${formatTourDateForDisplay(tourDate, 'en-GB', 'long')}${tourTimeSuffix(tourName)}`
}

export function formatGuestSummary(adults: number, children: number): string {
  return children > 0
    ? `${adults} adult${adults === 1 ? '' : 's'}, ${children} child${children === 1 ? '' : 'ren'}`
    : `${adults} adult${adults === 1 ? '' : 's'}`
}

export function formatEuro(amount: number | string): string {
  const n = typeof amount === 'number' ? amount : Number(amount)
  if (!Number.isFinite(n)) return String(amount)
  return n.toFixed(2)
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderBrandedEmail(content: BrandedEmailContent) {
  const detailRowsHtml = content.details
    .map(
      (row) =>
        `<strong>${escapeHtml(row.label)}:</strong> ${
          row.value.includes('\n')
            ? `<br /><span style="white-space:pre-wrap;">${escapeHtml(row.value)}</span>`
            : escapeHtml(row.value)
        }`,
    )
    .join('<br />')

  const detailRowsText = content.details
    .map((row) => `${row.label}: ${row.value}`)
    .join('\n')

  const nextStepsHtml = content.nextSteps
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join('')

  const nextStepsText = content.nextSteps.map((step) => `- ${step}`).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,'Times New Roman',serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;">
          <tr>
            <td style="background:#0a0a0a;padding:28px 28px 24px;text-align:center;">
              <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;">Royal Nordic</div>
              <div style="margin-top:6px;font-family:Arial,sans-serif;font-size:12px;color:#a1a1aa;">Finnish Lapland</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;font-weight:700;">${escapeHtml(content.title)}</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3f3f46;">
                ${content.introHtml}
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid #e4e4e7;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 20px 8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;font-weight:700;">${escapeHtml(content.detailsHeading)}</td>
                </tr>
                <tr>
                  <td style="padding:0 20px 20px;font-size:14px;line-height:1.7;color:#27272a;">
                    ${detailRowsHtml}
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 10px;font-size:16px;color:#18181b;">What happens next</h2>
              <ul style="margin:0 0 24px;padding-left:18px;font-size:14px;line-height:1.7;color:#3f3f46;">
                ${nextStepsHtml}
              </ul>

              <h2 style="margin:0 0 10px;font-size:16px;color:#18181b;">Need help?</h2>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#3f3f46;">
                Email <a href="mailto:${SUPPORT_EMAIL}" style="color:#047857;text-decoration:none;">${SUPPORT_EMAIL}</a><br />
                Phone <a href="tel:${SUPPORT_PHONE_TEL}" style="color:#047857;text-decoration:none;">${SUPPORT_PHONE}</a><br />
                Web <a href="${SITE_URL}" style="color:#047857;text-decoration:none;">royalnordic.fi</a>
              </p>

              <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">
                See you in Lapland,<br />
                <strong style="color:#18181b;">The Royal Nordic team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #e4e4e7;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#a1a1aa;text-align:center;">
              Royal Nordic · Rovaniemi, Finnish Lapland<br />
              This email was sent to ${escapeHtml(content.customerEmail)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `${content.title} — Royal Nordic

Hi ${content.customerName},

${content.introText}

${content.detailsHeading.toUpperCase()}
${detailRowsText}

WHAT HAPPENS NEXT
${nextStepsText}

NEED HELP?
Email: ${SUPPORT_EMAIL}
Phone: ${SUPPORT_PHONE}
Web: ${SITE_URL}

See you in Lapland,
The Royal Nordic team
`

  return {
    from: `Royal Nordic <${SUPPORT_EMAIL}>`,
    to: [content.customerEmail],
    subject: content.subject,
    html,
    text,
  }
}

export function buildCustomerConfirmationEmail(booking: BookingEmailData) {
  const experience = displayTourName(booking.tourName)
  const dateLabel = formatBookingDateLabel(booking.tourDate, booking.tourName)
  const guests = formatGuestSummary(booking.adults, booking.children)
  const total = formatEuro(booking.totalPrice)

  const details: DetailRow[] = [
    { label: 'Booking ID', value: `#${booking.bookingId}` },
    { label: 'Experience', value: experience },
    { label: 'Date', value: dateLabel },
    { label: 'Guests', value: guests },
    { label: 'Total paid', value: `€${total}` },
  ]
  if (booking.specialRequests) {
    details.push({ label: 'Notes', value: booking.specialRequests })
  }

  return renderBrandedEmail({
    subject: `Booking confirmed — ${experience} | Royal Nordic`,
    title: 'Your booking is confirmed',
    introHtml: `Hi ${escapeHtml(booking.customerName)}, thank you for booking with Royal Nordic.
                Payment is received and your place is reserved.`,
    introText:
      'Thank you for booking with Royal Nordic. Payment is received and your place is reserved.',
    detailsHeading: 'Booking details',
    details,
    nextSteps: [
      'We will confirm your pickup time and meeting details before the tour.',
      'Dress for Arctic conditions: warm layers, proper winter footwear, hat and gloves.',
      'Free cancellation up to 24 hours before departure (see Terms).',
      `Keep this email for your records — quote booking #${booking.bookingId} if you contact us.`,
    ],
    customerEmail: booking.customerEmail,
    customerName: booking.customerName,
  })
}

export type RequestEmailKind =
  | 'customized'
  | 'snowmobile'
  | 'monster'
  | 'partner'
  | 'transportation'

export function detectRequestKind(subject?: string, type?: string, message?: string): RequestEmailKind {
  if (type === 'partner') return 'partner'
  const hay = `${subject || ''} ${message || ''}`.toLowerCase()
  if (hay.includes('travel trade') || hay.includes('partnership')) return 'partner'
  if (hay.includes('snowmobile')) return 'snowmobile'
  if (hay.includes('monster truck')) return 'monster'
  if (hay.includes('transportation') || hay.includes('transfer')) return 'transportation'
  return 'customized'
}

export function buildRequestReceivedEmail(input: {
  kind: RequestEmailKind
  customerName: string
  customerEmail: string
  details: DetailRow[]
}) {
  const configs: Record<
    RequestEmailKind,
    { subject: string; title: string; intro: string; detailsHeading: string; nextSteps: string[] }
  > = {
    customized: {
      subject: 'We received your customized tour request | Royal Nordic',
      title: 'Your request has been received',
      intro:
        'Thank you for contacting Royal Nordic. We have received your customized tour request and will reply with a personalized proposal.',
      detailsHeading: 'Request details',
      nextSteps: [
        'Our team will review your preferences and group size.',
        'You will receive a tailored itinerary and pricing by email.',
        'Feel free to reply to this email if you want to add anything.',
      ],
    },
    snowmobile: {
      subject: 'We received your snowmobile safari request | Royal Nordic',
      title: 'Your request has been received',
      intro:
        'Thank you for contacting Royal Nordic. We have received your snowmobile safari request and will confirm availability and pricing with you shortly.',
      detailsHeading: 'Request details',
      nextSteps: [
        'We will check availability with our partner provider.',
        'You will receive a quote and booking details by email.',
        'Feel free to reply to this email if you want to adjust dates or group size.',
      ],
    },
    monster: {
      subject: 'We received your monster truck experience request | Royal Nordic',
      title: 'Your request has been received',
      intro:
        'Thank you for contacting Royal Nordic. We have received your monster truck Northern Lights request and will confirm availability and pricing with you shortly.',
      detailsHeading: 'Request details',
      nextSteps: [
        'We will check availability with our partner provider.',
        'You will receive a quote and booking details by email.',
        'Feel free to reply to this email if you want to adjust dates or group size.',
      ],
    },
    partner: {
      subject: 'We received your partnership enquiry | Royal Nordic',
      title: 'Your enquiry has been received',
      intro:
        'Thank you for contacting Royal Nordic about a travel trade partnership. Our team will review your enquiry and reply with next steps.',
      detailsHeading: 'Enquiry details',
      nextSteps: [
        'Our team will review your message shortly.',
        'We will reply with partnership information and next steps.',
        'You can also browse guest experiences at royalnordic.fi/travel-trade.',
      ],
    },
    transportation: {
      subject: 'We received your transportation request | Royal Nordic',
      title: 'Your request has been received',
      intro:
        'Thank you for contacting Royal Nordic. We have received your private transportation request and will reply with a personalized quote.',
      detailsHeading: 'Request details',
      nextSteps: [
        'Our team will review your route, timing, and group size.',
        'You will receive a quote and availability by email.',
        'Feel free to reply to this email if you want to change pickup details.',
      ],
    },
  }

  const config = configs[input.kind]
  return renderBrandedEmail({
    subject: config.subject,
    title: config.title,
    introHtml: `Hi ${escapeHtml(input.customerName)}, ${escapeHtml(config.intro)}`,
    introText: config.intro,
    detailsHeading: config.detailsHeading,
    details: input.details,
    nextSteps: config.nextSteps,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
  })
}

export function buildCryptoBookingEmail(
  booking: BookingEmailData & { cryptoType: string },
) {
  const experience = displayTourName(booking.tourName)
  const dateLabel = formatBookingDateLabel(booking.tourDate, booking.tourName)
  const guests = formatGuestSummary(booking.adults, booking.children)
  const total = formatEuro(booking.totalPrice)
  const crypto = booking.cryptoType.toUpperCase()

  const details: DetailRow[] = [
    { label: 'Booking ID', value: `#${booking.bookingId}` },
    { label: 'Experience', value: experience },
    { label: 'Date', value: dateLabel },
    { label: 'Guests', value: guests },
    { label: 'Total', value: `€${total}` },
    { label: 'Payment method', value: crypto },
  ]
  if (booking.specialRequests) {
    details.push({ label: 'Notes', value: booking.specialRequests })
  }

  return renderBrandedEmail({
    subject: `Booking received — ${experience} | Royal Nordic`,
    title: 'Your booking request is received',
    introHtml: `Hi ${escapeHtml(booking.customerName)}, thank you for booking with Royal Nordic.
                Your place is reserved pending crypto payment.`,
    introText:
      'Thank you for booking with Royal Nordic. Your place is reserved pending crypto payment.',
    detailsHeading: 'Booking details',
    details,
    nextSteps: [
      `You will receive ${crypto} payment instructions by email (wallet address and exact amount).`,
      'Please wait for those instructions before sending any crypto.',
      'After payment is confirmed, we will send pickup and meeting details before the tour.',
      `Quote booking #${booking.bookingId} if you contact us.`,
    ],
    customerEmail: booking.customerEmail,
    customerName: booking.customerName,
  })
}

export function buildAdminBookingAlertEmail(booking: BookingEmailData) {
  const experience = displayTourName(booking.tourName)
  const dateLabel = formatBookingDateLabel(booking.tourDate, booking.tourName)
  const total = formatEuro(booking.totalPrice)

  return {
    from: `Royal Nordic <${SUPPORT_EMAIL}>`,
    to: ['royalnordicfi@gmail.com', SUPPORT_EMAIL],
    subject: `New booking #${booking.bookingId}: ${experience} — ${booking.customerName}`,
    html: `
      <h2 style="font-family:Arial,sans-serif;">New booking</h2>
      <p style="font-family:Arial,sans-serif;line-height:1.6;">
        <strong>ID:</strong> #${booking.bookingId}<br />
        <strong>Tour:</strong> ${escapeHtml(experience)}<br />
        <strong>Date:</strong> ${escapeHtml(dateLabel)}<br />
        <strong>Customer:</strong> ${escapeHtml(booking.customerName)}<br />
        <strong>Email:</strong> ${escapeHtml(booking.customerEmail)}<br />
        <strong>Phone:</strong> ${escapeHtml(booking.customerPhone || 'Not provided')}<br />
        <strong>Adults:</strong> ${booking.adults}<br />
        <strong>Children:</strong> ${booking.children}<br />
        <strong>Total:</strong> €${escapeHtml(total)}
        ${
          booking.specialRequests
            ? `<br /><strong>Notes:</strong> ${escapeHtml(booking.specialRequests)}`
            : ''
        }
      </p>
    `,
    text: `New booking #${booking.bookingId}
Tour: ${experience}
Date: ${dateLabel}
Customer: ${booking.customerName}
Email: ${booking.customerEmail}
Phone: ${booking.customerPhone || 'Not provided'}
Adults: ${booking.adults}
Children: ${booking.children}
Total: €${total}
${booking.specialRequests ? `Notes: ${booking.specialRequests}` : ''}`,
  }
}
