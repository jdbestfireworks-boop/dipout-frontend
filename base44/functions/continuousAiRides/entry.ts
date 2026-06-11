import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Expanded AI Rider pool for midsize town (15 riders)
const AI_RIDERS = [
  { email: 'sarah.johnson@example.com', phone: '+1-337-555-0101', name: 'Sarah Johnson' },
  { email: 'mike.chen@example.com', phone: '+1-337-555-0102', name: 'Mike Chen' },
  { email: 'emma.williams@example.com', phone: '+1-337-555-0103', name: 'Emma Williams' },
  { email: 'james.brown@example.com', phone: '+1-337-555-0104', name: 'James Brown' },
  { email: 'lisa.garcia@example.com', phone: '+1-337-555-0105', name: 'Lisa Garcia' },
  { email: 'robert.miller@example.com', phone: '+1-337-555-0106', name: 'Robert Miller' },
  { email: 'jennifer.davis@example.com', phone: '+1-337-555-0107', name: 'Jennifer Davis' },
  { email: 'william.rodriguez@example.com', phone: '+1-337-555-0108', name: 'William Rodriguez' },
  { email: 'elizabeth.martinez@example.com', phone: '+1-337-555-0109', name: 'Elizabeth Martinez' },
  { email: 'david.anderson@example.com', phone: '+1-337-555-0110', name: 'David Anderson' },
  { email: 'maria.taylor@example.com', phone: '+1-337-555-0111', name: 'Maria Taylor' },
  { email: 'richard.thomas@example.com', phone: '+1-337-555-0112', name: 'Richard Thomas' },
  { email: 'susan.hernandez@example.com', phone: '+1-337-555-0113', name: 'Susan Hernandez' },
  { email: 'joseph.moore@example.com', phone: '+1-337-555-0114', name: 'Joseph Moore' },
  { email: 'jessica.martin@example.com', phone: '+1-337-555-0115', name: 'Jessica Martin' },
];

// AI Driver pool (8 drivers for midsize town)
const AI_DRIVERS = [
  { email: 'driver1@dipout.com', phone: '+1-337-555-0201', name: 'John Driver', vehicle: 'Toyota Camry', plate: 'LA-ABC-123' },
  { email: 'driver2@dipout.com', phone: '+1-337-555-0202', name: 'Mary Driver', vehicle: 'Honda Accord', plate: 'LA-XYZ-789' },
  { email: 'driver3@dipout.com', phone: '+1-337-555-0203', name: 'Mike Driver', vehicle: 'Tesla Model 3', plate: 'LA-EV-456' },
  { email: 'driver4@dipout.com', phone: '+1-337-555-0204', name: 'Pat Driver', vehicle: 'Nissan Altima', plate: 'LA-DEF-321' },
  { email: 'driver5@dipout.com', phone: '+1-337-555-0205', name: 'Tom Driver', vehicle: 'Ford Fusion', plate: 'LA-GHI-654' },
  { email: 'driver6@dipout.com', phone: '+1-337-555-0206', name: 'Linda Driver', vehicle: 'Hyundai Sonata', plate: 'LA-JKL-987' },
  { email: 'driver7@dipout.com', phone: '+1-337-555-0207', name: 'Chris Driver', vehicle: 'Chevrolet Malibu', plate: 'LA-MNO-147' },
  { email: 'driver8@dipout.com', phone: '+1-337-555-0208', name: 'Pat Driver', vehicle: 'Kia Optima', plate: 'LA-PQR-258' },
];

// Expanded Lafayette area addresses (midsize town)
const ADDRESSES = [
  '301 Canal St, Lafayette, LA 70501',
  '400 Bourbon St, Lafayette, LA 70506',
  '800 Johnston St, Lafayette, LA 70503',
  '1201 Ambassador Caffery Pkwy, Lafayette, LA 70506',
  '500 Seeley Ln, Lafayette, LA 70503',
  '2000 NW Evangeline Thwy, Lafayette, LA 70507',
  '900 E Pinhook Rd, Lafayette, LA 70503',
  '1500 Kaliste Saloom Rd, Lafayette, LA 70508',
  '600 University Ave, Lafayette, LA 70503',
  '3000 Veterans Memorial Dr, Lafayette, LA 70506',
  '100 Cajundome Blvd, Lafayette, LA 70506',
  '5000 Johnston St, Lafayette, LA 70503',
];

function randomCoords() {
  // Lafayette, LA area coordinates
  const baseLat = 30.2241;
  const baseLng = -92.0198;
  return {
    lat: baseLat + (Math.random() - 0.5) * 0.15,
    lng: baseLng + (Math.random() - 0.5) * 0.15,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This is a scheduled automation - creates realistic midsize town activity
    // Create 2-4 new ride requests per 5-minute interval (realistic for midsize town)
    const numRequests = Math.floor(2 + Math.random() * 3);
    const created = [];

    for (let i = 0; i < numRequests; i++) {
      const rider = AI_RIDERS[Math.floor(Math.random() * AI_RIDERS.length)];
      const pickup = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)];
      const dropoff = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)];
      const coords1 = randomCoords();
      const coords2 = randomCoords();
      const distance = Math.round((1.5 + Math.random() * 10) * 10) / 10;
      const fare = Math.round((7 + distance * 2.3) * 100) / 100;

      // Occasional surge pricing (20% chance during busy times)
      const surgeMultiplier = Math.random() > 0.8 ? Math.round((1.2 + Math.random() * 0.6) * 10) / 10 : 1.0;
      const finalFare = Math.round(fare * surgeMultiplier * 100) / 100;

      const ride = await base44.asServiceRole.entities.Ride.create({
        rider_email: rider.email,
        rider_phone: rider.phone,
        pickup_address: pickup,
        dropoff_address: dropoff,
        pickup_lat: coords1.lat,
        pickup_lng: coords1.lng,
        dropoff_lat: coords2.lat,
        dropoff_lng: coords2.lng,
        status: 'requested',
        distance_km: distance,
        base_fare: Math.round((4.5 + distance * 2.3) * 100) / 100,
        surge_multiplier: surgeMultiplier,
        fare: finalFare,
        ai_pricing_reason: surgeMultiplier > 1.0 ? 'High demand - surge pricing' : 'Standard pricing',
        payment_method: Math.random() > 0.4 ? 'card' : 'cash', // 60% card, 40% cash
        payment_status: 'unpaid',
        declined_by: [],
      });

      created.push(ride);
    }

    // Occasionally update driver locations (30% chance per run)
    if (Math.random() < 0.3) {
      const drivers = await base44.asServiceRole.entities.DriverProfile.filter({ status: 'available' }, null, 5);
      for (const driver of drivers.slice(0, 2)) {
        const coords = randomCoords();
        await base44.asServiceRole.entities.DriverProfile.update(driver.id, { lat: coords.lat, lng: coords.lng });
      }
    }

    console.log(`Midsize town sim: Created ${created.length} ride requests`);

    return Response.json({
      success: true,
      message: `Created ${created.length} AI ride requests in Lafayette area`,
      rides_created: created.length,
      stats: {
        total_riders: AI_RIDERS.length,
        total_drivers: AI_DRIVERS.length,
        town: 'Lafayette, LA (midsize)',
      },
    });

  } catch (error) {
    console.error('Continuous AI rides error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});