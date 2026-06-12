import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all active rides
    const rides = await base44.entities.Ride.filter({
      status: ['accepted', 'in_progress']
    });

    // Get all drivers
    const drivers = await base44.entities.DriverProfile.list();

    let updatedRides = 0;
    let updatedDrivers = 0;

    // Simulate realistic movement for each active ride
    for (const ride of rides) {
      if (!ride.driver_email) continue;

      const driver = drivers.find(d => d.email === ride.driver_email);
      if (!driver) continue;

      // Calculate distance to target
      let targetLat, targetLng, distance;
      
      if (ride.status === 'accepted') {
        // Driver heading to pickup
        targetLat = ride.pickup_lat;
        targetLng = ride.pickup_lng;
      } else if (ride.status === 'in_progress') {
        // Driver heading to dropoff
        targetLat = ride.dropoff_lat;
        targetLng = ride.dropoff_lng;
      }

      if (!targetLat || !targetLng) continue;

      // Current driver position
      const currentLat = ride.driver_lat || driver.lat || targetLat;
      const currentLng = ride.driver_lng || driver.lng || targetLng;

      // Calculate distance (Haversine formula simplified)
      const latDiff = targetLat - currentLat;
      const lngDiff = targetLng - currentLng;
      distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // km

      // Realistic city driving speed: 30-40 km/h average (including stops)
      // In 5 minutes, driver covers 2.5-3.3 km
      const speedKmh = 35;
      const timeHours = 5 / 60; // 5 minutes
      const moveDistance = speedKmh * timeHours; // ~2.9 km per update

      // If close to target (< 0.5km), complete the leg
      if (distance < 0.5) {
        if (ride.status === 'accepted') {
          // Arrived at pickup - transition to in_progress
          await base44.entities.Ride.update(ride.id, {
            status: 'in_progress',
            driver_lat: targetLat,
            driver_lng: targetLng,
          });
          updatedRides++;
        } else if (ride.status === 'in_progress') {
          // Arrived at dropoff - complete the ride
          await base44.entities.Ride.update(ride.id, {
            status: 'completed',
            payment_status: ride.payment_method === 'card' ? 'paid' : 'unpaid',
            driver_lat: targetLat,
            driver_lng: targetLng,
          });
          
          // Update driver stats
          const currentEarnings = driver.total_earnings || 0;
          const currentTrips = driver.trips_completed || 0;
          await base44.entities.DriverProfile.update(driver.id, {
            total_earnings: currentEarnings + (ride.fare || 0) * 0.8,
            trips_completed: currentTrips + 1,
            status: 'available',
          });
          updatedRides++;
          updatedDrivers++;
        }
      } else {
        // Move driver toward target
        const ratio = Math.min(moveDistance / distance, 1);
        const newLat = currentLat + (targetLat - currentLat) * ratio;
        const newLng = currentLng + (targetLng - currentLng) * ratio;

        await base44.entities.Ride.update(ride.id, {
          driver_lat: newLat,
          driver_lng: newLng,
        });
        updatedRides++;
      }
    }

    // Make available drivers move around randomly (simulate cruising)
    const availableDrivers = drivers.filter(d => d.status === 'available');
    for (const driver of availableDrivers) {
      // Random small movement (cruising for rides)
      const moveLat = (Math.random() - 0.5) * 0.02; // ~2km movement
      const moveLng = (Math.random() - 0.5) * 0.02;
      
      await base44.entities.DriverProfile.update(driver.id, {
        lat: (driver.lat || 30.2241) + moveLat,
        lng: (driver.lng || -92.0198) + moveLng,
      });
      updatedDrivers++;
    }

    return Response.json({
      success: true,
      message: 'Real-time simulation updated',
      stats: {
        active_rides: rides.length,
        updated_rides: updatedRides,
        updated_drivers: updatedDrivers,
        available_drivers: availableDrivers.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});