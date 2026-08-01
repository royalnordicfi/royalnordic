// Email notification service for Royal Nordic
import { formatTourDateForDisplay } from './tourDate'

export interface EmailNotification {
  to: string[]
  subject: string
  html: string
  text: string
}

export interface BookingNotificationData {
  bookingId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  tourName: string
  tourDate: string
  adults: number
  children: number
  totalPrice: number
  specialRequests?: string
  paymentStatus: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
}

// Send booking notification to Royal Nordic staff
export async function sendBookingNotification(bookingData: BookingNotificationData) {
  const notification: EmailNotification = {
    to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
    subject: `New Booking: ${bookingData.tourName} - ${bookingData.customerName}`,
    html: generateBookingEmailHTML(bookingData),
    text: generateBookingEmailText(bookingData)
  }

  try {
    // Send via Supabase Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(notification),
    })

    if (!response.ok) {
      throw new Error('Failed to send email notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending email notification:', error)
    // Don't throw error - email failure shouldn't break the booking
    return null
  }
}

// Send booking confirmation to customer
export async function sendCustomerConfirmation(bookingData: BookingNotificationData) {
  const experience = displayTourName(bookingData.tourName)
  const confirmation: EmailNotification = {
    to: [bookingData.customerEmail],
    subject: `Booking confirmed — ${experience} | Royal Nordic`,
    html: generateCustomerConfirmationHTML(bookingData),
    text: generateCustomerConfirmationText(bookingData)
  }

  try {
    // Send via Supabase Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(confirmation),
    })

    if (!response.ok) {
      throw new Error('Failed to send customer confirmation')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending customer confirmation:', error)
    // Don't throw error - email failure shouldn't break the booking
    return null
  }
}

/** Same template as sendCustomerConfirmation, but throws on failure (admin ops). */
export async function sendCustomerConfirmationStrict(bookingData: BookingNotificationData) {
  const experience = displayTourName(bookingData.tourName)
  const confirmation: EmailNotification = {
    to: [bookingData.customerEmail],
    subject: `Booking confirmed — ${experience} | Royal Nordic`,
    html: generateCustomerConfirmationHTML(bookingData),
    text: generateCustomerConfirmationText(bookingData)
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(confirmation),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      (body as { error?: string }).error ||
        `Failed to send confirmation (${response.status})`,
    )
  }
  return body as { messageId?: string; success?: boolean }
}

// Generate HTML email content
function generateBookingEmailHTML(booking: BookingNotificationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .booking-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .highlight { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }
        .status-pending { color: #d97706; font-weight: bold; }
        .status-confirmed { color: #059669; font-weight: bold; }
        .status-cancelled { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌟 New Booking Alert</h1>
        <p>Royal Nordic Tours</p>
      </div>
      
      <div class="content">
        <h2>New booking received!</h2>
        
        <div class="booking-details">
          <h3>📋 Booking Details</h3>
          <p><strong>Booking ID:</strong> #${booking.bookingId}</p>
          <p><strong>Tour:</strong> ${booking.tourName}</p>
          <p><strong>Date:</strong> ${formatTourDateForDisplay(booking.tourDate, 'fi-FI', 'short')}</p>
          <p><strong>Status:</strong> <span class="status-${booking.paymentStatus}">${booking.paymentStatus.toUpperCase()}</span></p>
        </div>
        
        <div class="highlight">
          <h3>👥 Customer Information</h3>
          <p><strong>Name:</strong> ${booking.customerName}</p>
          <p><strong>Email:</strong> ${booking.customerEmail}</p>
          <p><strong>Phone:</strong> ${booking.customerPhone || 'Not provided'}</p>
        </div>
        
        <div class="highlight">
          <h3>💰 Pricing</h3>
          <p><strong>Adults:</strong> ${booking.adults} × €${getAdultPrice(booking.tourName)}</p>
          <p><strong>Children:</strong> ${booking.children} × €${getChildPrice(booking.tourName)}</p>
          <p><strong>Total:</strong> €${booking.totalPrice}</p>
        </div>
        
        ${booking.specialRequests ? `
        <div class="highlight">
          <h3>📝 Special Requests</h3>
          <p>${booking.specialRequests}</p>
        </div>
        ` : ''}
        
        <div class="highlight">
          <h3>⏰ Booking Time</h3>
          <p>${new Date(booking.createdAt).toLocaleString('fi-FI')}</p>
        </div>
      </div>
      
      <div class="footer">
        <p>This notification was automatically generated by the Royal Nordic booking system.</p>
        <p>Booking ID: #${booking.bookingId}</p>
      </div>
    </body>
    </html>
  `
}

// Generate plain text email content
function generateBookingEmailText(booking: BookingNotificationData): string {
  return `
New Booking Alert - Royal Nordic Tours

New booking received!

📋 Booking Details:
- Booking ID: #${booking.bookingId}
- Tour: ${booking.tourName}
- Date: ${formatTourDateForDisplay(booking.tourDate, 'fi-FI', 'short')}
- Status: ${booking.paymentStatus.toUpperCase()}

👥 Customer Information:
- Name: ${booking.customerName}
- Email: ${booking.customerEmail}
- Phone: ${booking.customerPhone || 'Not provided'}

💰 Pricing:
- Adults: ${booking.adults} × €${getAdultPrice(booking.tourName)}
- Children: ${booking.children} × €${getChildPrice(booking.tourName)}
- Total: €${booking.totalPrice}

${booking.specialRequests ? `
📝 Special Requests:
${booking.specialRequests}
` : ''}

⏰ Booking Time: ${new Date(booking.createdAt).toLocaleString('fi-FI')}

---
This notification was automatically generated by the Royal Nordic booking system.
Booking ID: #${booking.bookingId}
  `
}

// Helper functions to get tour prices
function getAdultPrice(tourName: string): number {
  const prices: Record<string, number> = {
    'Northern Lights Tour': 149,
    'Guaranteed Northern Lights Tour': 149,
    'Quality Snowshoe Rental': 59,
    'Customized Tour': 200
  }
  return prices[tourName] || 0
}

function getChildPrice(tourName: string): number {
  const prices: Record<string, number> = {
    'Northern Lights Tour': 129,
    'Guaranteed Northern Lights Tour': 129,
    'Quality Snowshoe Rental': 49,
    'Customized Tour': 150
  }
  return prices[tourName] || 0
}

/** Keep in sync with supabase/functions/_shared/bookingEmails.ts */
function displayTourName(tourName: string): string {
  if (tourName === 'Northern Lights Tour') return 'Guaranteed Northern Lights Tour'
  return tourName
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function tourTimeSuffix(tourName: string): string {
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

function formatCustomerDate(booking: BookingNotificationData): string {
  return `${formatTourDateForDisplay(booking.tourDate, 'en-GB', 'long')}${tourTimeSuffix(booking.tourName)}`
}

function guestSummary(booking: BookingNotificationData): string {
  return booking.children > 0
    ? `${booking.adults} adult${booking.adults === 1 ? '' : 's'}, ${booking.children} child${booking.children === 1 ? '' : 'ren'}`
    : `${booking.adults} adult${booking.adults === 1 ? '' : 's'}`
}

// Generate customer confirmation HTML (kept aligned with stripe-webhook shared template)
function generateCustomerConfirmationHTML(booking: BookingNotificationData): string {
  const experience = displayTourName(booking.tourName)
  const dateLabel = formatCustomerDate(booking)
  const guests = guestSummary(booking)
  const total =
    typeof booking.totalPrice === 'number' ? booking.totalPrice.toFixed(2) : String(booking.totalPrice)

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,'Times New Roman',serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;">
        <tr>
          <td style="background:#0a0a0a;padding:28px 28px 24px;text-align:center;">
            <div style="font-size:22px;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;">Royal Nordic</div>
            <div style="margin-top:6px;font-family:Arial,sans-serif;font-size:12px;color:#a1a1aa;">Finnish Lapland</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
            <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">Your booking is confirmed</h1>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3f3f46;">
              Hi ${escapeHtml(booking.customerName)}, thank you for booking with Royal Nordic.
              Payment is received and your place is reserved.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid #e4e4e7;margin:0 0 24px;">
              <tr><td style="padding:20px 20px 8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;font-weight:700;">Booking details</td></tr>
              <tr><td style="padding:0 20px 20px;font-size:14px;line-height:1.7;color:#27272a;">
                <strong>Booking ID:</strong> #${booking.bookingId}<br />
                <strong>Experience:</strong> ${escapeHtml(experience)}<br />
                <strong>Date:</strong> ${escapeHtml(dateLabel)}<br />
                <strong>Guests:</strong> ${escapeHtml(guests)}<br />
                <strong>Total paid:</strong> €${escapeHtml(total)}
                ${booking.specialRequests ? `<br /><strong>Notes:</strong> ${escapeHtml(booking.specialRequests)}` : ''}
              </td></tr>
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
              Email <a href="mailto:contact@royalnordic.fi" style="color:#047857;text-decoration:none;">contact@royalnordic.fi</a><br />
              Phone <a href="tel:+3584578345138" style="color:#047857;text-decoration:none;">+358 45 78345138</a><br />
              Web <a href="https://royalnordic.fi" style="color:#047857;text-decoration:none;">royalnordic.fi</a>
            </p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">
              See you in Lapland,<br /><strong style="color:#18181b;">The Royal Nordic team</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;border-top:1px solid #e4e4e7;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#a1a1aa;text-align:center;">
            Royal Nordic · Rovaniemi, Finnish Lapland<br />
            This email was sent to ${escapeHtml(booking.customerEmail)}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function generateCustomerConfirmationText(booking: BookingNotificationData): string {
  const experience = displayTourName(booking.tourName)
  const dateLabel = formatCustomerDate(booking)
  const guests = guestSummary(booking)
  const total =
    typeof booking.totalPrice === 'number' ? booking.totalPrice.toFixed(2) : String(booking.totalPrice)

  return `Your booking is confirmed — Royal Nordic

Hi ${booking.customerName},

Thank you for booking with Royal Nordic. Payment is received and your place is reserved.

BOOKING DETAILS
Booking ID: #${booking.bookingId}
Experience: ${experience}
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
Email: contact@royalnordic.fi
Phone: +358 45 78345138
Web: https://royalnordic.fi

See you in Lapland,
The Royal Nordic team
`
}
