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
  // Use TextEncoder for proper UTF-8 encoding
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
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
        
        // Only notify for requested rides (fallback when auto-assignment fails)
        if (ride.status !== 'requested') {
            return Response.json({ success: true, message: 'Ride not in requested status, skipping notification' });
        }

        // Check if ride was already assigned by auto-assign function
        if (ride.driver_email) {
            return Response.json({ success: true, message: 'Ride already assigned to driver' });
        }

        // Fetch all available/online drivers
        const drivers = await base44.asServiceRole.entities.DriverProfile.filter({ 
            status: 'available',
            approved: true 
        });

        if (!drivers.length) {
            return Response.json({ alerted: 0, message: 'No available drivers - manual assignment needed' });
        }

        const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

        let alerted = 0;
        for (const driver of drivers) {
            const html = `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#1a1025;color:#f5f0e8;padding:32px;border-radius:12px;">
                    <h1 style="font-size:24px;font-weight:700;color:#f5c518;margin:0 0 4px;">🔔 New Ride Request!</h1>
                    <p style="color:#9a8fb0;margin:0 0 24px;">A customer needs a ride in your area</p>

                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                        <tr>
                            <td style="padding:8px 0;color:#9a8fb0;border-bottom:1px solid #2e2040;">Pickup</td>
                            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #2e2040;">${ride.pickup_address}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0;color:#9a8fb0;border-bottom:1px solid #2e2040;">Drop-off</td>
                            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #2e2040;">${ride.dropoff_address}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0;color:#9a8fb0;border-bottom:1px solid #2e2040;">Distance</td>
                            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #2e2040;">${ride.distance_km || 0} mi</td>
                        </tr>
                        <tr>
                            <td style="padding:12px 0;font-weight:700;font-size:16px;">Your Earnings</td>
                            <td style="padding:12px 0;text-align:right;font-weight:700;font-size:16px;color:#f5c518;">$${((ride.fare || 0) * 0.8).toFixed(2)}</td>
                        </tr>
                    </table>

                    <p style="margin-top:24px;font-size:12px;color:#6b6080;">Payment: ${ride.payment_method === 'cash' ? 'Cash 💵' : 'Card 💳'}</p>
                    <p style="margin-top:16px;font-size:13px;color:#f5c518;font-weight:600;">Open the Dip Out app to accept this ride!</p>
                </div>
            `;

            const raw = buildMimeEmail({
                to: driver.user_email,
                subject: `🔔 New Ride Request - $${((ride.fare || 0) * 0.8).toFixed(2)} earnings`,
                body: html,
            });

            try {
                const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ raw }),
                });

                if (res.ok) {
                    alerted++;
                }
            } catch (err) {
                console.error(`Failed to notify driver ${driver.user_email}:`, err);
            }
        }

        // If no drivers were notified, update ride status to indicate issue
        if (alerted === 0) {
            await base44.asServiceRole.entities.Ride.update(ride_id, {
                status: 'cancelled',
                cancellation_fee: 0,
                cancelled_at: new Date().toISOString(),
            });
        }

        return Response.json({ 
            success: true, 
            alerted,
            message: alerted > 0 ? `Notified ${alerted} available driver(s)` : 'No drivers notified - ride cancelled' 
        });
    } catch (error) {
        console.error('Driver notification error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});