import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Create realistic demo data for a fully working app

    // 1. Create 8 driver profiles
    const drivers = [
      { email: 'driver1@dipout.com', phone: '+1-337-555-0201', vehicle: 'Toyota Camry', plate: 'LA-ABC-123', lat: 30.2241, lng: -92.0198, status: 'available', approved: true, rating: 4.9, total_earnings: 1250.50, trips_completed: 87 },
      { email: 'driver2@dipout.com', phone: '+1-337-555-0202', vehicle: 'Honda Accord', plate: 'LA-XYZ-789', lat: 30.2350, lng: -92.0250, status: 'available', approved: true, rating: 4.8, total_earnings: 980.25, trips_completed: 65 },
      { email: 'driver3@dipout.com', phone: '+1-337-555-0203', vehicle: 'Tesla Model 3', plate: 'LA-EV-456', lat: 30.2180, lng: -92.0150, status: 'busy', approved: true, rating: 5.0, total_earnings: 2100.00, trips_completed: 142 },
      { email: 'driver4@dipout.com', phone: '+1-337-555-0204', vehicle: 'Nissan Altima', plate: 'LA-DEF-321', lat: 30.2300, lng: -92.0300, status: 'available', approved: true, rating: 4.7, total_earnings: 750.75, trips_completed: 52 },
      { email: 'driver5@dipout.com', phone: '+1-337-555-0205', vehicle: 'Ford Fusion', plate: 'LA-GHI-654', lat: 30.2150, lng: -92.0100, status: 'offline', approved: true, rating: 4.6, total_earnings: 540.00, trips_completed: 38 },
      { email: 'driver6@dipout.com', phone: '+1-337-555-0206', vehicle: 'Hyundai Sonata', plate: 'LA-JKL-987', lat: 30.2400, lng: -92.0280, status: 'available', approved: true, rating: 4.9, total_earnings: 1450.30, trips_completed: 98 },
      { email: 'driver7@dipout.com', phone: '+1-337-555-0207', vehicle: 'Chevrolet Malibu', plate: 'LA-MNO-147', lat: 30.2280, lng: -92.0220, status: 'busy', approved: true, rating: 4.8, total_earnings: 890.60, trips_completed: 61 },
      { email: 'driver8@dipout.com', phone: '+1-337-555-0208', vehicle: 'Kia Optima', plate: 'LA-PQR-258', lat: 30.2320, lng: -92.0180, status: 'available', approved: true, rating: 4.7, total_earnings: 670.40, trips_completed: 45 },
    ];

    for (const driver of drivers) {
      const existing = await base44.asServiceRole.entities.DriverProfile.filter({ user_email: driver.email });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.DriverProfile.create(driver);
      }
    }

    // 2. Create 5-8 initial active ride requests
    const AI_RIDERS = [
      { email: 'sarah.johnson@example.com', phone: '+1-337-555-0101' },
      { email: 'mike.chen@example.com', phone: '+1-337-555-0102' },
      { email: 'emma.williams@example.com', phone: '+1-337-555-0103' },
      { email: 'james.brown@example.com', phone: '+1-337-555-0104' },
      { email: 'lisa.garcia@example.com', phone: '+1-337-555-0105' },
      { email: 'robert.miller@example.com', phone: '+1-337-555-0106' },
      { email: 'jennifer.davis@example.com', phone: '+1-337-555-0107' },
      { email: 'william.rodriguez@example.com', phone: '+1-337-555-0108' },
    ];

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
    ];

    const randomCoords = () => ({
      lat: 30.2241 + (Math.random() - 0.5) * 0.15,
      lng: -92.0198 + (Math.random() - 0.5) * 0.15,
    });

    const initialRides = 5 + Math.floor(Math.random() * 4);
    const createdRides = [];

    for (let i = 0; i < initialRides; i++) {
      const rider = AI_RIDERS[Math.floor(Math.random() * AI_RIDERS.length)];
      const pickup = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)];
      const dropoff = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)];
      const coords1 = randomCoords();
      const coords2 = randomCoords();
      const distance = Math.round((1.5 + Math.random() * 8) * 10) / 10;
      const fare = Math.round((7 + distance * 2.3) * 100) / 100;
      const surgeMultiplier = Math.random() > 0.8 ? Math.round((1.2 + Math.random() * 0.6) * 10) / 10 : 1.0;

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
        fare: Math.round(fare * surgeMultiplier * 100) / 100,
        ai_pricing_reason: surgeMultiplier > 1.0 ? 'High demand - surge pricing' : 'Standard pricing',
        payment_method: Math.random() > 0.4 ? 'card' : 'cash',
        payment_status: 'unpaid',
        declined_by: [],
      });
      createdRides.push(ride);
    }

    return Response.json({
      success: true,
      message: 'Demo data seeded successfully',
      stats: {
        drivers: drivers.length,
        initial_rides: createdRides.length,
        location: 'Lafayette, LA',
      },
    });

  } catch (error) {
    console.error('Seed demo data error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});