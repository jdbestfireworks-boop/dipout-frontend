import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Import haversine distance calculation
function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

    // Only process requested rides
    if (ride.status !== 'requested') {
      return Response.json({ 
        success: true, 
        message: `Ride not in requested status (current: ${ride.status})` 
      });
    }

    // Validate pickup coordinates
    if (!ride.pickup_lat || !ride.pickup_lng) {
      return Response.json({ error: 'Pickup coordinates missing' }, { status: 400 });
    }

    // Fetch all available and approved drivers with location data
    const drivers = await base44.asServiceRole.entities.DriverProfile.filter({ 
      status: 'available',
      approved: true 
    });

    if (!drivers.length) {
      // No available drivers - cancel the ride gracefully
      await base44.asServiceRole.entities.Ride.update(ride_id, {
        status: 'cancelled',
        cancellation_fee: 0,
        cancelled_at: new Date().toISOString(),
      });
      return Response.json({ 
        success: true, 
        assigned: false,
        message: 'No available drivers - ride cancelled' 
      });
    }

    // Calculate distance for each driver and filter those with valid locations
    const driversWithDistance = drivers
      .filter(driver => driver.lat && driver.lng)
      .map(driver => ({
        ...driver,
        distance: haversineMiles(ride.pickup_lat, ride.pickup_lng, driver.lat, driver.lng)
      }))
      .sort((a, b) => a.distance - b.distance);

    if (driversWithDistance.length === 0) {
      // Drivers exist but no location data - cancel ride
      await base44.asServiceRole.entities.Ride.update(ride_id, {
        status: 'cancelled',
        cancellation_fee: 0,
        cancelled_at: new Date().toISOString(),
      });
      return Response.json({ 
        success: true, 
        assigned: false,
        message: 'No drivers with location data - ride cancelled' 
      });
    }

    // Get the nearest driver
    const nearestDriver = driversWithDistance[0];
    const distanceMiles = nearestDriver.distance;

    // Assign ride to nearest driver
    await base44.asServiceRole.entities.Ride.update(ride_id, {
      status: 'accepted',
      driver_email: nearestDriver.user_email,
    });

    // Update driver status to busy
    await base44.asServiceRole.entities.DriverProfile.update(nearestDriver.id, {
      status: 'busy'
    });

    // Send notification email to the assigned driver
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#1a1025;color:#f5f0e8;padding:32px;border-radius:12px;">
        <h1 style="font-size:24px;font-weight:700;color:#f5c518;margin:0 0 4px;">🚗 Ride Assigned!</h1>
        <p style="color:#9a8fb0;margin:0 0 24px;">You've been matched with a rider</p>

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
            <td style="padding:8px 0;color:#9a8fb0;border-bottom:1px solid #2e2040;">Distance to Pickup</td>
            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #2e2040;">${distanceMiles.toFixed(1)} mi</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9a8fb0;border-bottom:1px solid #2e2040;">Trip Distance</td>
            <td style="padding:8px 0;text-align:right;border-bottom:1px solid #2e2040;">${ride.distance_km || 0} mi</td>
          </tr>
          <tr>
            <td style="padding:12px 0;font-weight:700;font-size:16px;">Your Earnings</td>
            <td style="padding:12px 0;text-align:right;font-weight:700;font-size:16px;color:#f5c518;">$${((ride.fare || 0) * 0.8).toFixed(2)}</td>
          </tr>
        </table>

        <p style="margin-top:24px;font-size:12px;color:#6b6080;">Payment: ${ride.payment_method === 'cash' ? 'Cash 💵' : 'Card 💳'}</p>
        <p style="margin-top:16px;font-size:13px;color:#f5c518;font-weight:600;">Open the Dip Out app to start the trip!</p>
      </div>
    `;

    const raw = buildMimeEmail({
      to: nearestDriver.user_email,
      subject: `🚗 Ride Assigned - $${((ride.fare || 0) * 0.8).toFixed(2)} earnings`,
      body: html,
    });

    try {
      await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });
    } catch (err) {
      console.error('Failed to send email:', err);
    }

    return Response.json({ 
      success: true, 
      assigned_driver: nearestDriver.user_email,
      distance: distanceMiles.toFixed(1),
      message: `Ride assigned to nearest driver (${distanceMiles.toFixed(1)} mi away)` 
    });
  } catch (error) {
    console.error('Assign nearest driver error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});