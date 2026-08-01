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

const SUPPORT_EMAIL = 'contact@royalnordic.fi'
const SUPPORT_PHONE = '+358 45 78345138'
const SUPPORT_PHONE_TEL = '+3584578345138'
const SITE_URL = 'https://royalnordic.fi'

export function tourTimeSuffix(tourName: string): string {
  if (tourName.includes('Family-Friendly Northern Lights')) return ' at 21:00'
  if (
    tourName === 'Northern Lights Tour' ||
    tourName === 'Guaranteed Northern Lights Tour' ||
    tourName.includes('Northern Lights')
  ) {
    return ' at 18:30'
  }
  return ''
}

export function formatBookingDateLabel(tourDate: string, tourName: string): string {
  return `${formatTourDateForDisplay(tourDate, 'en-GB', 'long')}${tourTimeSuffix(tourName)}`
}

export function buildCustomerConfirmationEmail(booking: BookingEmailData) {
  const dateLabel = formatBookingDateLabel(booking.tourDate, booking.tourName)
  const guests =
    booking.children > 0
      ? `${booking.adults} adult${booking.adults === 1 ? '' : 's'}, ${booking.children} child${booking.children === 1 ? '' : 'ren'}`
      : `${booking.adults} adult${booking.adults === 1 ? '' : 's'}`
  const total =
    typeof booking.totalPrice === 'number'
      ? booking.totalPrice.toFixed(2)
      : String(booking.totalPrice)

  const subject = `Booking confirmed — ${booking.tourName} | Royal Nordic`
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
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
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;font-weight:700;">Your booking is confirmed</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3f3f46;">
                Hi ${escapeHtml(booking.customerName)}, thank you for booking with Royal Nordic.
                Payment is received and your place is reserved.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid #e4e4e7;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 20px 8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;font-weight:700;">Booking details</td>
                </tr>
                <tr>
                  <td style="padding:0 20px 20px;font-size:14px;line-height:1.7;color:#27272a;">
                    <strong>Booking ID:</strong> #${booking.bookingId}<br />
                    <strong>Experience:</strong> ${escapeHtml(booking.tourName)}<br />
                    <strong>Date:</strong> ${escapeHtml(dateLabel)}<br />
                    <strong>Guests:</strong> ${escapeHtml(guests)}<br />
                    <strong>Total paid:</strong> €${escapeHtml(total)}
                    ${
                      booking.specialRequests
                        ? `<br /><strong>Notes:</strong> ${escapeHtml(booking.specialRequests)}`
                        : ''
                    }
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 10px;font-size:16px;color:#18181b;">What happens next</h2>
              <ul style="margin:0 0 24px;padding-left:18px;font-size:14px;line-height:1.7;color:#3f3f46;">
                <li>We will confirm your pickup time and meeting details before the tour.</li>
                <li>Dress for Arctic conditions: warm layers, proper winter footwear, hat and gloves.</li>
                <li>Free cancellation up to 24 hours before departure (see Terms).</li>
                <li>Keep this email for your records — quote booking #${booking.bookingId} if you contact us.</li>
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
              This confirmation was sent to ${escapeHtml(booking.customerEmail)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `Your booking is confirmed — Royal Nordic

Hi ${booking.customerName},

Thank you for booking with Royal Nordic. Payment is received and your place is reserved.

BOOKING DETAILS
Booking ID: #${booking.bookingId}
Experience: ${booking.tourName}
Date: ${dateLabel}
Guests: ${guests}
Total paid: €${total}
${booking.specialRequests ? `Notes: ${booking.specialRequests}\n` : ''}
WHAT HAPPENS NEXT
- We will confirm your pickup time and meeting details before the tour.
- Dress for Arctic conditions: warm layers, proper winter footwear, hat and gloves.
- Free cancellation up to 24 hours before departure (see Terms).
- Quote booking #${booking.bookingId} if you contact us.

NEED HELP?
Email: ${SUPPORT_EMAIL}
Phone: ${SUPPORT_PHONE}
Web: ${SITE_URL}

See you in Lapland,
The Royal Nordic team
`

  return {
    from: `Royal Nordic <${SUPPORT_EMAIL}>`,
    to: [booking.customerEmail],
    subject,
    html,
    text,
  }
}

export function buildAdminBookingAlertEmail(booking: BookingEmailData) {
  const dateLabel = formatBookingDateLabel(booking.tourDate, booking.tourName)
  const total =
    typeof booking.totalPrice === 'number'
      ? booking.totalPrice.toFixed(2)
      : String(booking.totalPrice)

  return {
    from: `Royal Nordic <${SUPPORT_EMAIL}>`,
    to: ['royalnordicfi@gmail.com', SUPPORT_EMAIL],
    subject: `New booking #${booking.bookingId}: ${booking.tourName} — ${booking.customerName}`,
    html: `
      <h2 style="font-family:Arial,sans-serif;">New booking</h2>
      <p style="font-family:Arial,sans-serif;line-height:1.6;">
        <strong>ID:</strong> #${booking.bookingId}<br />
        <strong>Tour:</strong> ${escapeHtml(booking.tourName)}<br />
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
Tour: ${booking.tourName}
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

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
