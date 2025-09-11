// Test script to send a booking confirmation email
const fetch = require('node-fetch');

async function sendTestEmail() {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_1234567890', // This would need the actual Resend API key
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Royal Nordic <noreply@royalnordic.fi>',
        to: ['mirov.vesterinen@gmail.com'],
        subject: 'Test Booking Confirmation - Northern Lights Tour - Royal Nordic',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%);">
              <h1 style="color: white; margin: 0 0 10px 0; font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Royal Nordic</h1>
              <p style="color: #9ca3af; margin: 0; font-size: 16px; font-style: italic;">Finnish Lapland Adventures</p>
            </div>
            
            <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #1f2937; margin-bottom: 25px; font-size: 28px; text-align: center;">Booking Confirmed! 🎉</h1>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
                Dear <strong>Miro Vesterinen</strong>,
              </p>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                Thank you for booking with Royal Nordic! Your Lapland adventure is confirmed and we're excited to show you the magic of the Northern Lights.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Tour Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Tour:</strong> Northern Lights Tour</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Date:</strong> Monday, September 15, 2025 at 20:00</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Adults:</strong> 2</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Children:</strong> 1</p>
                  </div>
                  <div>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Booking ID:</strong> #TEST123</p>
                    <p style="margin: 8px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Confirmed</span></p>
                  </div>
                </div>
              </div>
              
              <p style="color: #4b5563; line-height: 1.7; margin-bottom: 30px; font-size: 16px;">
                Best regards,<br>
                <strong>The Royal Nordic Team</strong>
              </p>
            </div>
          </div>
        `,
        text: `
Booking Confirmed - Northern Lights Tour - Royal Nordic

Dear Miro Vesterinen,

Thank you for booking with Royal Nordic! Your Lapland adventure is confirmed and we're excited to show you the magic of the Northern Lights.

Tour Details:
- Tour: Northern Lights Tour
- Date: Monday, September 15, 2025 at 20:00
- Adults: 2
- Children: 1
- Booking ID: #TEST123
- Status: Confirmed

Best regards,
The Royal Nordic Team
        `
      })
    });

    if (response.ok) {
      console.log('Test email sent successfully!');
      const result = await response.json();
      console.log('Response:', result);
    } else {
      console.error('Failed to send email:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

sendTestEmail();
