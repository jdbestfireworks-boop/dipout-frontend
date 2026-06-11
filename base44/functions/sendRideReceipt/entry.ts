import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function buildMimeEmail({ to, subject, body }) {
  const messageParts = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    body,
  ];
  const message = messageParts.join('\n');
  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    // Handle both automation event and direct call
    const ride_id = body.ride_id || body.event?.entity_id;

    if (!ride_id) {
      return Response.json({ error: 'Ride ID required' }, { status: 400 });
    }

    const ride = await base44.asServiceRole.entities.Ride.get(ride_id);
    if (!ride) {
      return Response.json({ error: 'Ride not found' }, { status: 404 });
    }
    
    // Only send receipt for completed rides
    if (ride.status !== 'completed') {
      return Response.json({ success: true, message: 'Ride not yet completed, skipping receipt' });
    }

    // Check user's notification preferences
    try {
      const riders = await base44.asServiceRole.entities.User.filter({ email: ride.rider_email });
      if (riders.length > 0) {
        const rider = riders[0];
        const prefs = rider.data?.notification_preferences;
        // Skip if user has disabled receipt emails
        if (prefs && prefs.receipt_emails === false) {
          return Response.json({ success: true, message: 'User has disabled receipt emails' });
        }
      }
    } catch (error) {
      console.error('Error checking user preferences:', error);
      // Continue with sending if we can't check preferences
    }

    const fare = ride.fare || 0;
    // tip = final fare minus original base fare (if fare was updated with tip)
    const baseFare = ride.base_fare || fare;
    const tip = Math.max(0, fare - baseFare * (ride.surge_multiplier || 1));
    const total = fare;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#1a1025;color:#f5f0e8;padding:32px;border-radius:12px;">
        <h1 style="font-size:24px;font-weight:700;color:#f5c518;margin:0 0 4px;">Your Dip Out Receipt</h1>
        <p style="color:#9a8fb0;margin:0 0 24px;">Thanks for riding with us!</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:8px 0;color:#9a8fb0;border-bottom:1px solid #2e2040;">From</td>
            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #2e2040;">${ride.pickup_address}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9a8fb0;border-bottom:1px solid #2e2040;">To</td>
            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #2e2040;">${ride.dropoff_address}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9a8fb0;border-bottom:1px solid #2e2040;">Distance</td>
            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #2e2040;">${ride.distance_km} km</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9a8fb0;border-bottom:1px solid #2e2040;">Fare</td>
            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #2e2040;">$${baseFare.toFixed(2)}</td>
          </tr>
          ${tip > 0 ? `
          <tr>
            <td style="padding:8px 0;color:#9a8fb0;border-bottom:1px solid #2e2040;">Tip</td>
            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #2e2040;">$${tip.toFixed(2)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:12px 0;font-weight:700;font-size:16px;">Total</td>
            <td style="padding:12px 0;text-align:right;font-weight:700;font-size:16px;color:#f5c518;">$${total.toFixed(2)}</td>
          </tr>
        </table>

        <p style="margin-top:24px;font-size:12px;color:#6b6080;">Payment method: ${ride.payment_method === 'cash' ? 'Cash' : 'Card'}</p>
        <p style="font-size:12px;color:#6b6080;margin:4px 0 0;">Driver: ${ride.driver_email || 'N/A'}</p>
        <p style="margin-top:24px;font-size:13px;color:#9a8fb0;">See you next time 🚗</p>
      </div>
    `;

    const raw = buildMimeEmail({
      to: ride.rider_email,
      subject: `Your Dip Out receipt — $${total.toFixed(2)}`,
      body: html,
    });

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});