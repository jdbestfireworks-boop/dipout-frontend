import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// AI Rider names and addresses
const AI_RIDERS = [
  { email: 'sarah.johnson@example.com', phone: '+1-504-555-0101', name: 'Sarah Johnson' },
  { email: 'mike.chen@example.com', phone: '+1-504-555-0102', name: 'Mike Chen' },
  { email: 'emma.williams@example.com', phone: '+1-504-555-0103', name: 'Emma Williams' },
];

// AI Driver names
const AI_DRIVERS = [
  { email: 'james.driver@example.com', phone: '+1-504-555-0201', name: 'James Rodriguez', vehicle: 'Toyota Camry', plate: 'ABC-123' },
  { email: 'lisa.driver@example.com', phone: '+1-504-555-0202', name: 'Lisa Thompson', vehicle: 'Honda Accord', plate: 'XYZ-789' },
  { email: 'david.driver@example.com', phone: '+1-504-555-0203', name: 'David Martinez', vehicle: 'Tesla Model 3', plate: 'EV-456' },
];

// New Orleans area addresses
const ADDRESSES = [
  '301 Canal St, New Orleans, LA 70112',
  '400 Bourbon St, New Orleans, LA 70130',
  '800 Toulouse St, New Orleans, LA 70112',
  '1201 S Claiborne Ave, New Orleans, LA 70125',
  '500 Magazine St, New Orleans, LA 70130',
  '2000 Gentilly Blvd, New Orleans, LA 70119',
  '900 Poydras St, New Orleans, LA 70112',
  '1500 St Charles Ave, New Orleans, LA 70130',
];

function randomCoords() {
  // New Orleans area coordinates
  const baseLat = 29.9511;
  const baseLng = -90.0715;
  return {
    lat: baseLat + (Math.random() - 0.5) * 0.1,
    lng: baseLng + (Math.random() - 0.5) * 0.1,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create AI riders and drivers if they don't exist
    for (const rider of AI_RIDERS) {
      // Check if rider exists
      const existingRides = await base44.asServiceRole.entities.Ride.filter({ rider_email: rider.email }, '-created_date', 1);
      if (existingRides.length === 0) {
        // Create a completed ride for this rider to simulate activity
        const pickup = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)];
        const dropoff = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)];
        const coords1 = randomCoords();
        const coords2 = randomCoords();
        
        await base44.asServiceRole.entities.Ride.create({
          rider_email: rider.email,
          rider_phone: rider.phone,
          pickup_address: pickup,
          dropoff_address: dropoff,
          pickup_lat: coords1.lat,
          pickup_lng: coords1.lng,
          dropoff_lat: coords2.lat,
          dropoff_lng: coords2.lng,
          status: 'completed',
          distance_km: Math.round((2 + Math.random() * 5) * 10) / 10,
          base_fare: 5 + Math.random() * 5,
          surge_multiplier: 1.0,
          fare: Math.round((8 + Math.random() * 10) * 100) / 100,
          ai_pricing_reason: 'Standard pricing',
          payment_method: Math.random() > 0.5 ? 'card' : 'cash',
          payment_status: 'paid',
          rider_rating: Math.floor(4 + Math.random()),
          rider_comment: ['Great ride!', 'Very professional', 'Thanks!', 'Smooth trip'][Math.floor(Math.random() * 4)],
          declined_by: [],
        });
      }
    }

    // Create AI drivers if they don't exist
    for (const driver of AI_DRIVERS) {
      const existing = await base44.asServiceRole.entities.DriverProfile.filter({ user_email: driver.email }, null, 1);
      if (existing.length === 0) {
        const coords = randomCoords();
        await base44.asServiceRole.entities.DriverProfile.create({
          user_email: driver.email,
          phone: driver.phone,
          vehicle: driver.vehicle,
          plate: driver.plate,
          status: Math.random() > 0.3 ? 'available' : 'busy',
          approved: true,
          lat: coords.lat,
          lng: coords.lng,
          rating: Math.round((4.5 + Math.random() * 0.5) * 10) / 10,
          total_ratings: Math.floor(10 + Math.random() * 50),
          total_earnings: Math.round((100 + Math.random() * 500) * 100) / 100,
          trips_completed: Math.floor(10 + Math.random() * 100),
          license_doc_url: null,
          insurance_doc_url: null,
        });
      }
    }

    // Optionally create an active ride request
    if (Math.random() > 0.5) {
      const rider = AI_RIDERS[Math.floor(Math.random() * AI_RIDERS.length)];
      const pickup = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)];
      const dropoff = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)];
      const coords1 = randomCoords();
      const coords2 = randomCoords();
      const distance = Math.round((2 + Math.random() * 8) * 10) / 10;
      const fare = Math.round((8 + distance * 2.5) * 100) / 100;

      await base44.asServiceRole.entities.Ride.create({
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
        base_fare: Math.round((5 + distance * 2.5) * 100) / 100,
        surge_multiplier: Math.random() > 0.7 ? Math.round((1.2 + Math.random() * 0.5) * 10) / 10 : 1.0,
        fare: fare,
        ai_pricing_reason: 'AI dynamic pricing based on demand',
        payment_method: Math.random() > 0.5 ? 'card' : 'cash',
        payment_status: 'unpaid',
        declined_by: [],
      });
    }

    return Response.json({
      success: true,
      message: 'AI simulation active - 3 riders and 3 drivers created with realistic activity',
      stats: {
        ai_riders: AI_RIDERS.length,
        ai_drivers: AI_DRIVERS.length,
        active_requests: '1-2 simulated requests created',
      },
    });

  } catch (error) {
    console.error('AI simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});