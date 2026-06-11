import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all online/available drivers and active surge zones
    const [drivers, zones] = await Promise.all([
      base44.asServiceRole.entities.DriverProfile.filter({ status: 'available' }),
      base44.asServiceRole.entities.SurgeZone.filter({ active: true }),
    ]);

    if (!zones.length || !drivers.length) {
      return Response.json({ alerted: 0 });
    }

    let alerted = 0;

    for (const driver of drivers) {
      if (!driver.lat || !driver.lng) continue;

      for (const zone of zones) {
        const dist = haversineKm(driver.lat, driver.lng, zone.lat, zone.lng);
        const radius = zone.radius_km || 2;

        if (dist <= radius) {
          // Avoid duplicate alerts: check if we already sent one in the last 30 min
          const recent = await base44.asServiceRole.entities.DriverAlert.filter({
            driver_email: driver.user_email,
            zone_name: zone.name,
          });

          const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
          const alreadySent = recent.some((a) => a.created_date > thirtyMinAgo);
          if (alreadySent) continue;

          const multiplier = zone.surge_multiplier || 1.5;
          await base44.asServiceRole.entities.DriverAlert.create({
            driver_email: driver.user_email,
            message: `🔥 High demand in ${zone.name}! Surge pricing is active at ${multiplier}x — head there to earn more.`,
            type: 'surge_zone',
            surge_multiplier: multiplier,
            zone_name: zone.name,
            read: false,
          });
          alerted++;
        }
      }
    }

    return Response.json({ alerted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});