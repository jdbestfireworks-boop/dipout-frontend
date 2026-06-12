import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const SIMULATION_HOURS = 1;
    const CYCLES_PER_HOUR = 12; // 60 minutes / 5 minutes per cycle
    const totalCycles = SIMULATION_HOURS * CYCLES_PER_HOUR;

    console.log(`Starting ${SIMULATION_HOURS}-hour simulation (${totalCycles} cycles)...`);

    let totalRidesCreated = 0;
    let totalRidesCompleted = 0;
    let totalRevenue = 0;

    for (let cycle = 1; cycle <= totalCycles; cycle++) {
      console.log(`Cycle ${cycle}/${totalCycles}...`);

      // Get current state
      const activeRides = await base44.asServiceRole.entities.Ride.filter({
        status: ['accepted', 'in_progress']
      });
      
      const availableDrivers = await base44.asServiceRole.entities.DriverProfile.filter({
        status: 'available'
      });

      // Simulate movement for active rides
      for (const ride of activeRides) {
        if (!ride.driver_email) continue;

        const driver = await base44.asServiceRole.entities.DriverProfile.filter({
          user_email: ride.driver_email
        }).then(d => d[0]);

        if (!driver) continue;

        let targetLat, targetLng;
        
        if (ride.status === 'accepted') {
          targetLat = ride.pickup_lat;
          targetLng = ride.pickup_lng;
        } else if (ride.status === 'in_progress') {
          targetLat = ride.dropoff_lat;
          targetLng = ride.dropoff_lng;
        }

        if (!targetLat || !targetLng) continue;

        const currentLat = ride.driver_lat || driver.lat || targetLat;
        const currentLng = ride.driver_lng || driver.lng || targetLng;

        const latDiff = targetLat - currentLat;
        const lngDiff = targetLng - currentLng;
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;

        const speedKmh = 35;
        const timeHours = 5 / 60;
        const moveDistance = speedKmh * timeHours;

        if (distance < 0.5) {
          if (ride.status === 'accepted') {
            await base44.asServiceRole.entities.Ride.update(ride.id, {
              status: 'in_progress',
              driver_lat: targetLat,
              driver_lng: targetLng,
            });
          } else if (ride.status === 'in_progress') {
            await base44.asServiceRole.entities.Ride.update(ride.id, {
              status: 'completed',
              payment_status: ride.payment_method === 'card' ? 'paid' : 'unpaid',
              driver_lat: targetLat,
              driver_lng: targetLng,
            });
            
            const currentEarnings = driver.total_earnings || 0;
            const currentTrips = driver.trips_completed || 0;
            await base44.asServiceRole.entities.DriverProfile.update(driver.id, {
              total_earnings: currentEarnings + (ride.fare || 0) * 0.8,
              trips_completed: currentTrips + 1,
              status: 'available',
            });
            
            totalRidesCompleted++;
            totalRevenue += (ride.fare || 0);
          }
        } else {
          const ratio = Math.min(moveDistance / distance, 1);
          const newLat = currentLat + (targetLat - currentLat) * ratio;
          const newLng = currentLng + (targetLng - currentLng) * ratio;

          await base44.asServiceRole.entities.Ride.update(ride.id, {
            driver_lat: newLat,
            driver_lng: newLng,
          });
        }
      }

      // Move available drivers randomly
      for (const driver of availableDrivers) {
        const moveLat = (Math.random() - 0.5) * 0.02;
        const moveLng = (Math.random() - 0.5) * 0.02;
        
        await base44.asServiceRole.entities.DriverProfile.update(driver.id, {
          lat: (driver.lat || 30.2241) + moveLat,
          lng: (driver.lng || -92.0198) + moveLng,
        });
      }

      // Create new rides occasionally
      if (availableDrivers.length > 0 && Math.random() > 0.3) {
        const ADDRESSES = [
          '301 Canal St, Lafayette, LA 70501',
          '800 Johnston St, Lafayette, LA 70503',
          '1201 Ambassador Caffery Pkwy, Lafayette, LA 70506',
          '900 E Pinhook Rd, Lafayette, LA 70503',
        ];

        const distance = Math.round((1.5 + Math.random() * 10) * 10) / 10;
        const fare = Math.round((7 + distance * 2.3) * 100) / 100;
        const surgeMultiplier = Math.random() > 0.8 ? Math.round((1.2 + Math.random() * 0.6) * 10) / 10 : 1.0;
        const finalFare = Math.round(fare * surgeMultiplier * 100) / 100;

        await base44.asServiceRole.entities.Ride.create({
          rider_email: `rider${cycle}@example.com`,
          rider_phone: '+1-337-555-0100',
          pickup_address: ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)],
          dropoff_address: ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)],
          pickup_lat: 30.2241 + (Math.random() - 0.5) * 0.15,
          pickup_lng: -92.0198 + (Math.random() - 0.5) * 0.15,
          dropoff_lat: 30.2241 + (Math.random() - 0.5) * 0.15,
          dropoff_lng: -92.0198 + (Math.random() - 0.5) * 0.15,
          status: 'requested',
          distance_km: distance,
          base_fare: Math.round((4.5 + distance * 2.3) * 100) / 100,
          surge_multiplier: surgeMultiplier,
          fare: finalFare,
          ai_pricing_reason: surgeMultiplier > 1.0 ? 'High demand' : 'Standard pricing',
          payment_method: Math.random() > 0.4 ? 'card' : 'cash',
          payment_status: 'unpaid',
          declined_by: [],
        });
        totalRidesCreated++;
      }

      // Auto-assign requested rides
      const requestedRides = await base44.asServiceRole.entities.Ride.filter({
        status: 'requested'
      });

      for (const ride of requestedRides) {
        const freshAvailable = await base44.asServiceRole.entities.DriverProfile.filter({
          status: 'available'
        });
        
        if (freshAvailable.length > 0) {
          const driver = freshAvailable[0];
          
          await base44.asServiceRole.entities.Ride.update(ride.id, {
            driver_email: driver.email,
            driver_phone: driver.phone,
            status: 'accepted',
            driver_lat: driver.lat || ride.pickup_lat,
            driver_lng: driver.lng || ride.pickup_lng,
          });
          
          await base44.asServiceRole.entities.DriverProfile.update(driver.id, {
            status: 'busy',
          });
        }
      }
    }

    return Response.json({
      success: true,
      message: `Completed ${SIMULATION_HOURS}-hour simulation`,
      stats: {
        cycles_run: totalCycles,
        rides_created: totalRidesCreated,
        rides_completed: totalRidesCompleted,
        total_revenue: Math.round(totalRevenue * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Hour simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});