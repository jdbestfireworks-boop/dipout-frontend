import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Encode email to base64 for Gmail API
function encodeEmail(emailData) {
  const mimeMessage = [
    `From: Dip Out <no-reply@dipout.com>`,
    `To: ${emailData.to}`,
    `Subject: ${emailData.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    emailData.html,
  ].join('\r\n');
  
  const encoder = new TextEncoder();
  const bytes = encoder.encode(mimeMessage);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify this is an admin/system call
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { ride_id, ride } = await req.json();

    // Support both ride_id only (fetch from DB) or ride object passed directly
    if (!ride_id && !ride) {
        return Response.json({ error: 'Ride ID or ride object required' }, { status: 400 });
    }

    // If ride object not provided, fetch from database
    let rideData = ride;
    if (!rideData && ride_id) {
        rideData = await base44.asServiceRole.entities.Ride.get(ride_id);
        if (!rideData) {
            return Response.json({ error: 'Ride not found' }, { status: 404 });
        }
    }

    // Only send for completed rides
    if (rideData.status !== 'completed') {
      return Response.json({ error: 'Ride not completed yet' }, { status: 400 });
    }

    // Get Gmail connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Calculate fare breakdown
    const baseFare = rideData.base_fare || 0;
    const surge = rideData.surge_multiplier || 1;
    const total = rideData.fare || 0;

    // Create thank you email with rating link
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; }
            .trip-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .detail-label { color: #666; font-weight: 500; }
            .detail-value { font-weight: 600; color: #333; }
            .rating-section { text-align: center; margin: 30px 0; padding: 20px; background: #f0f4ff; border-radius: 8px; }
            .rating-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 15px; }
            .rating-button:hover { background: #5568d3; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Thank You for Riding with Dip Out!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>Thank you for choosing Dip Out for your recent trip! We hope you had a great experience.</p>
              
              <div class="trip-details">
                <h3 style="margin-top: 0;">Trip Summary</h3>
                <div class="detail-row">
                  <span class="detail-label">From:</span>
                  <span class="detail-value">${rideData.pickup_address || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">To:</span>
                  <span class="detail-value">${rideData.dropoff_address || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(rideData.created_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Distance:</span>
                  <span class="detail-value">${rideData.distance_km || 0} miles</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Fare:</span>
                  <span class="detail-value">$${total.toFixed(2)}</span>
                </div>
                ${surge > 1 ? `<div class="detail-row"><span class="detail-label">Surge Multiplier:</span><span class="detail-value">${surge}x</span></div>` : ''}
              </div>

              <div class="rating-section">
              <h3 style="margin-top: 0; color: #667eea;">How was your ride?</h3>
              <p>Your feedback helps us improve and helps our drivers provide better service!</p>
              <a href="https://your-app.base44.app/rides" class="rating-button">
                ⭐ Rate Your Experience
              </a>
              </div>

              <p>If you have any questions or concerns, please don't hesitate to reach out to our support team.</p>
              
              <p>Safe travels!<br/>
              <strong>The Dip Out Team</strong></p>

              <div class="footer">
                <p>This email was sent to ${rideData.rider_email || 'our valued rider'}</p>
                <p>&copy; ${new Date().getFullYear()} Dip Out. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailData = {
      to: rideData.rider_email,
      subject: 'Thank You for Riding with Dip Out! 🚗',
      html: htmlContent,
    };

    const encodedEmail = encodeEmail(emailData);

    // Send email via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gmail API error:', error);
      return Response.json({ error: 'Failed to send email', details: error }, { status: 500 });
    }

    const result = await response.json();
    console.log('Thank you email sent to:', rideData.rider_email, 'Message ID:', result.id);

    return Response.json({ 
      success: true, 
      message: 'Thank you email sent successfully',
      messageId: result.id 
    });
  } catch (error) {
    console.error('Send thank you email error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});