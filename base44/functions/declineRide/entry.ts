import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ride_id } = await req.json();
    if (!ride_id) {
      return Response.json({ error: 'ride_id required' }, { status: 400 });
    }

    // Get the ride
    const ride = await base44.entities.Ride.get(ride_id);
    if (!ride) {
      return Response.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Record the decline
    const declinedBy = ride.declined_by || [];
    if (!declinedBy.includes(user.email)) {
      declinedBy.push(user.email);
    }
    
    await base44.entities.Ride.update(ride_id, { declined_by: declinedBy });

    // Find available drivers near pickup location
    const allDrivers = await base44.entities.DriverProfile.filter({ 
      status: 'available',
      approved: true 
    });

    // Filter out drivers who already declined
    const eligibleDrivers = allDrivers.filter(d => 
      d.user_email !== user.email && 
      !(d.declined_by || []).includes(ride_id) &&
      d.lat && d.lng &&
      ride.pickup_lat && ride.pickup_lng
    );

    // Calculate distances and sort by closest
    const driversWithDistance = eligibleDrivers.map(driver => {
      const distance = haversineMiles(
        driver.lat, driver.lng,
        ride.pickup_lat, ride.pickup_lng
      );
      return { ...driver, distance };
    });

    driversWithDistance.sort((a, b) => a.distance - b.distance);

    // Notify the closest available driver
    if (driversWithDistance.length > 0) {
      const nextDriver = driversWithDistance[0];
      
      // Create a notification for the next driver
      await base44.entities.DriverAlert.create({
        driver_email: nextDriver.user_email,
        message: `New ride available! $${((ride.fare || 0) * 0.8).toFixed(2)} earnings - ${ride.distance_km || 0} mi`,
        type: 'surge_zone',
        surge_multiplier: ride.surge_multiplier || 1,
        zone_name: 'Ride Request'
      });
      
      return Response.json({ 
        success: true, 
        message: 'Ride declined',
        notified_driver: nextDriver.user_email,
        distance: nextDriver.distance.toFixed(2)
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Ride declined - no other drivers nearby',
      notified_driver: null
    });

  } catch (error) {
    console.error('Decline ride error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Haversine formula to calculate distance between two coordinates in miles
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}