import { formatTourDateForDisplay } from './tourDate.ts'
import {
  departureSuffixForTour,
  isRanuaTour,
  isStandardGroupTour,
  RANUA_PUBLIC_NAME,
} from './tourBookingRules.ts'

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
  departureTime?: string
  meetingPoint?: string
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
  /** Optional primary CTA (e.g. Pay securely) */
  ctaLabel?: string
  ctaUrl?: string
}

const SUPPORT_EMAIL = 'contact@royalnordic.fi'
const SUPPORT_PHONE = '+358 45 78345138'
const SUPPORT_PHONE_TEL = '+3584578345138'
const SITE_URL = 'https://royalnordic.fi'

/** Map DB tour names to the customer-facing product names used on the site. */
export function displayTourName(tourName: string): string {
  if (tourName === 'Northern Lights Tour') return 'Guaranteed Northern Lights Tour'
  if (isRanuaTour(null, tourName)) return RANUA_PUBLIC_NAME
  return tourName
}

export function tourTimeSuffix(tourName: string, departureTime?: string | null): string {
  return departureSuffixForTour(displayTourName(tourName), departureTime)
}

export function formatBookingDateLabel(
  tourDate: string,
  tourName: string,
  departureTime?: string | null,
): string {
  return `${formatTourDateForDisplay(tourDate, 'en-GB', 'long')}${tourTimeSuffix(tourName, departureTime)}`
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

  const ctaHtml =
    content.ctaLabel && content.ctaUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
          <tr>
            <td style="border-radius:8px;background:#047857;">
              <a href="${escapeHtml(content.ctaUrl)}" style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                ${escapeHtml(content.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>`
      : ''

  const ctaText =
    content.ctaLabel && content.ctaUrl ? `\n${content.ctaLabel}: ${content.ctaUrl}\n` : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#0c1410;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e8ebe8;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#ffffff;padding:22px 28px 18px;text-align:center;border-bottom:1px solid #ecefec;">
              <img src="${SITE_URL}/logo.png" width="28" height="28" alt="" style="display:inline-block;vertical-align:middle;margin-right:8px;" />
              <span style="display:inline-block;vertical-align:middle;font-family:Georgia,serif;font-size:18px;font-weight:600;letter-spacing:-0.02em;color:#0c1410;">Royal Nordic</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;line-height:1.3;color:#0c1410;font-weight:600;">${escapeHtml(content.title)}</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3d4a44;">
                ${content.introHtml}
              </p>

              ${ctaHtml}

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafbfa;border:1px solid #e8ebe8;border-radius:8px;margin:0 0 24px;">
                <tr>
                  <td style="padding:18px 18px 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#5b6b63;font-weight:700;">${escapeHtml(content.detailsHeading)}</td>
                </tr>
                <tr>
                  <td style="padding:0 18px 18px;font-size:14px;line-height:1.7;color:#0c1410;">
                    ${detailRowsHtml}
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 10px;font-size:15px;color:#0c1410;">What happens next</h2>
              <ul style="margin:0 0 24px;padding-left:18px;font-size:14px;line-height:1.7;color:#3d4a44;">
                ${nextStepsHtml}
              </ul>

              <h2 style="margin:0 0 10px;font-size:15px;color:#0c1410;">Need help?</h2>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#3d4a44;">
                Email <a href="mailto:${SUPPORT_EMAIL}" style="color:#047857;text-decoration:none;">${SUPPORT_EMAIL}</a><br />
                Phone <a href="tel:${SUPPORT_PHONE_TEL}" style="color:#047857;text-decoration:none;">${SUPPORT_PHONE}</a><br />
                Web <a href="${SITE_URL}" style="color:#047857;text-decoration:none;">royalnordic.fi</a>
              </p>

              <p style="margin:0;font-size:14px;line-height:1.6;color:#5b6b63;">
                See you in Lapland,<br />
                <strong style="color:#0c1410;">The Royal Nordic team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;border-top:1px solid #ecefec;font-size:11px;line-height:1.5;color:#8a9690;text-align:center;">
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
${ctaText}
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
  const dateLabel = formatBookingDateLabel(booking.tourDate, booking.tourName, booking.departureTime)
  const guests = formatGuestSummary(booking.adults, booking.children)
  const total = formatEuro(booking.totalPrice)

  const details: DetailRow[] = [
    { label: 'Booking ID', value: `#${booking.bookingId}` },
    { label: 'Experience', value: experience },
    { label: 'Date', value: dateLabel },
    { label: 'Guests', value: guests },
    { label: 'Total', value: `€${total}` },
  ]
  if (booking.meetingPoint) {
    details.push({ label: 'Meeting / pickup', value: booking.meetingPoint })
  }
  if (booking.specialRequests) {
    details.push({ label: 'Notes', value: booking.specialRequests })
  }

  return renderBrandedEmail({
    subject: `Booking confirmed — ${experience} | Royal Nordic`,
    title: 'Your booking is confirmed',
    introHtml: `Hi ${escapeHtml(booking.customerName)}, thank you for booking with Royal Nordic.
                Your place is reserved.`,
    introText: 'Thank you for booking with Royal Nordic. Your place is reserved.',
    detailsHeading: 'Booking details',
    details,
    nextSteps: [
      isStandardGroupTour(null, booking.tourName)
        ? `Meet at ${booking.meetingPoint || 'Ruokasenkatu 3, 96100 Rovaniemi, Finland'}. Departure is ${booking.departureTime || '20:00'}. Hotel pickup is not included. Bring your own thermal clothing.`
        : isRanuaTour(null, booking.tourName)
          ? 'Round-trip transfer from Rovaniemi and Ranua Wildlife Park admission are included. This is a self-guided park visit — your driver provides transportation, not a guided tour inside the park. Exact pickup time and return meeting point are confirmed before departure.'
          : booking.meetingPoint
            ? 'Hotel pickup is included. Exact pickup time is confirmed before departure.'
            : 'We will confirm your pickup time and meeting details before the tour.',
      'Dress for Arctic conditions: warm layers, proper winter footwear, hat and gloves.',
      'Free cancellation up to 24 hours before departure. Cancellations within 24 hours are non-refundable (see Terms).',
      `Keep this email for your records — quote booking #${booking.bookingId} if you contact us.`,
    ],
    customerEmail: booking.customerEmail,
    customerName: booking.customerName,
  })
}

/** Payment request for unpaid admin payment-link bookings. */
export function buildPaymentRequestEmail(
  booking: BookingEmailData & { paymentUrl: string; expiresAt?: string },
) {
  const experience = displayTourName(booking.tourName)
  const dateLabel = formatBookingDateLabel(booking.tourDate, booking.tourName, booking.departureTime)
  const guests = formatGuestSummary(booking.adults, booking.children)
  const total = formatEuro(booking.totalPrice)

  return renderBrandedEmail({
    subject: `Complete payment — ${experience} | Royal Nordic`,
    title: 'Complete your booking payment',
    introHtml: `Hi ${escapeHtml(booking.customerName)}, your Royal Nordic booking is reserved pending payment.
                Use the secure button below to pay €${escapeHtml(total)}.`,
    introText: `Your Royal Nordic booking is reserved pending payment. Pay €${total} using the secure link.`,
    detailsHeading: 'Booking details',
    details: [
      { label: 'Booking ID', value: `#${booking.bookingId}` },
      { label: 'Experience', value: experience },
      { label: 'Date', value: dateLabel },
      { label: 'Guests', value: guests },
      { label: 'Amount due', value: `€${total}` },
      ...(booking.expiresAt
        ? [{ label: 'Link expires', value: booking.expiresAt }]
        : []),
    ],
    nextSteps: [
      'Pay securely via Stripe to confirm your place.',
      'After payment you will receive a booking confirmation email.',
      'If the link expires, reply to this email and we will send a new one.',
    ],
    customerEmail: booking.customerEmail,
    customerName: booking.customerName,
    ctaLabel: 'Pay securely',
    ctaUrl: booking.paymentUrl,
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
  const dateLabel = formatBookingDateLabel(booking.tourDate, booking.tourName, booking.departureTime)
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
      isStandardGroupTour(null, booking.tourName)
        ? `After payment is confirmed, meet at ${booking.meetingPoint || 'Ruokasenkatu 3, 96100 Rovaniemi'} at ${booking.departureTime || '20:00'}. Hotel pickup is not included.`
        : 'After payment is confirmed, we will send pickup and meeting details before the tour.',
      `Quote booking #${booking.bookingId} if you contact us.`,
    ],
    customerEmail: booking.customerEmail,
    customerName: booking.customerName,
  })
}

export function buildAdminBookingAlertEmail(booking: BookingEmailData) {
  const experience = displayTourName(booking.tourName)
  const dateLabel = formatBookingDateLabel(booking.tourDate, booking.tourName, booking.departureTime)
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
