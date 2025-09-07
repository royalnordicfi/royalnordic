// Email notification service for Royal Nordic
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
  const confirmation: EmailNotification = {
    to: [bookingData.customerEmail],
    subject: `Booking Confirmed: ${bookingData.tourName} - Royal Nordic`,
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
          <p><strong>Date:</strong> ${new Date(booking.tourDate).toLocaleDateString('fi-FI')}</p>
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
- Date: ${new Date(booking.tourDate).toLocaleDateString('fi-FI')}
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
    'Northern Lights Tour': 179,
    'Quality Snowshoe Rental': 59,
    'Customized Tour': 200
  }
  return prices[tourName] || 0
}

function getChildPrice(tourName: string): number {
  const prices: Record<string, number> = {
    'Northern Lights Tour': 149,
    'Quality Snowshoe Rental': 49,
    'Customized Tour': 150
  }
  return prices[tourName] || 0
}

// Generate customer confirmation HTML
function generateCustomerConfirmationHTML(booking: BookingNotificationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .booking-details { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
        .highlight { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }
        .status-confirmed { color: #059669; font-weight: bold; }
        .contact-info { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌟 Booking Confirmed!</h1>
        <p>Royal Nordic Tours</p>
      </div>
      
      <div class="content">
        <h2>Thank you for your booking, ${booking.customerName}!</h2>
        <p>Your tour has been successfully confirmed. We're excited to show you the magic of Lapland!</p>
        
        <div class="booking-details">
          <h3>📋 Your Booking Details</h3>
          <p><strong>Booking ID:</strong> #${booking.bookingId}</p>
          <p><strong>Tour:</strong> ${booking.tourName}</p>
          <p><strong>Date:</strong> ${new Date(booking.tourDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Status:</strong> <span class="status-confirmed">CONFIRMED</span></p>
        </div>
        
        <div class="highlight">
          <h3>👥 Your Group</h3>
          <p><strong>Adults:</strong> ${booking.adults}</p>
          <p><strong>Children:</strong> ${booking.children}</p>
          <p><strong>Total Amount:</strong> €${booking.totalPrice}</p>
        </div>
        
        ${booking.specialRequests ? `
        <div class="highlight">
          <h3>📝 Your Special Requests</h3>
          <p>${booking.specialRequests}</p>
        </div>
        ` : ''}
        
        <div class="contact-info">
          <h3>📞 Contact Information</h3>
          <p><strong>Email:</strong> contact@royalnordic.fi</p>
          <p><strong>Phone:</strong> +358 40 123 4567</p>
          <p><strong>Website:</strong> royalnordic.fi</p>
        </div>
        
        <div class="highlight">
          <h3>🎯 What's Next?</h3>
          <p>• You will receive a reminder email 24 hours before your tour</p>
          <p>• Please arrive 15 minutes before your scheduled time</p>
          <p>• Dress warmly for Arctic conditions</p>
          <p>• Contact us if you have any questions</p>
        </div>
      </div>
      
      <div class="footer">
        <p>Thank you for choosing Royal Nordic Tours!</p>
        <p>Booking ID: #${booking.bookingId}</p>
      </div>
    </body>
    </html>
  `
}

// Generate customer confirmation text
function generateCustomerConfirmationText(booking: BookingNotificationData): string {
  return `
Booking Confirmed - Royal Nordic Tours

Thank you for your booking, ${booking.customerName}!

Your tour has been successfully confirmed. We're excited to show you the magic of Lapland!

📋 Your Booking Details:
- Booking ID: #${booking.bookingId}
- Tour: ${booking.tourName}
- Date: ${new Date(booking.tourDate).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
- Status: CONFIRMED

👥 Your Group:
- Adults: ${booking.adults}
- Children: ${booking.children}
- Total Amount: €${booking.totalPrice}

${booking.specialRequests ? `
📝 Your Special Requests:
${booking.specialRequests}
` : ''}

📞 Contact Information:
- Email: contact@royalnordic.fi
- Phone: +358 40 123 4567
- Website: royalnordic.fi

🎯 What's Next?
• You will receive a reminder email 24 hours before your tour
• Please arrive 15 minutes before your scheduled time
• Dress warmly for Arctic conditions
• Contact us if you have any questions

Thank you for choosing Royal Nordic Tours!
Booking ID: #${booking.bookingId}
  `
}
