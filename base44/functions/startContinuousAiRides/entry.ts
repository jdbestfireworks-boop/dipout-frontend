import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// AI Rider names and addresses
const AI_RIDERS = [
  { email: 'sarah.johnson@example.com', phone: '+1-504-555-0101', name: 'Sarah Johnson' },
  { email: 'mike.chen@example.com', phone: '+1-504-555-0102', name: 'Mike Chen' },
  { email: 'emma.williams@example.com', phone: '+1-504-555-0103', name: 'Emma Williams' },
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
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body for action
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'stop') {
      // Stop simulation - clear any flag
      return Response.json({
        success: true,
        message: 'AI ride simulation stopped',
      });
    }

    // Start continuous simulation - create ride requests every 2-3 minutes for 30 minutes
    const simulationDuration = 30 * 60 * 1000; // 30 minutes in ms
    const requestInterval = Math.floor(2 + Math.random() * 2) * 60 * 1000; // 2-3 minutes
    const maxRequests = Math.floor(simulationDuration / requestInterval);
    let requestsCreated = 0;

    // Create first request immediately
    const createRideRequest = async () => {
      if (requestsCreated >= maxRequests) return;

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
        ai_pricing_reason: 'AI dynamic pricing - continuous simulation',
        payment_method: Math.random() > 0.5 ? 'card' : 'cash',
        payment_status: 'unpaid',
        declined_by: [],
      });

      requestsCreated++;
      console.log(`AI ride request ${requestsCreated}/${maxRequests} created`);
    };

    // Create initial batch of 3 requests
    await Promise.all([
      createRideRequest(),
      createRideRequest(),
      createRideRequest(),
    ]);

    // Schedule ongoing requests (note: Deno Deploy doesn't support setInterval in edge functions,
    // so we'll create a scheduled automation instead)
    return Response.json({
      success: true,
      message: `AI simulation started - created 3 initial ride requests. Use the scheduled automation 'Continuous AI Ride Simulation' for ongoing requests.`,
      stats: {
        initial_requests: 3,
        duration_minutes: 30,
        estimated_total_requests: maxRequests,
        interval_minutes: Math.round(requestInterval / 60000),
      },
    });

  } catch (error) {
    console.error('AI simulation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});