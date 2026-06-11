import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate random coordinates in Louisiana (New Orleans area)
    const pickupLat = 29.9511 + (Math.random() - 0.5) * 0.1;
    const pickupLng = -90.0715 + (Math.random() - 0.5) * 0.1;
    const dropoffLat = 29.9511 + (Math.random() - 0.5) * 0.1;
    const dropoffLng = -90.0715 + (Math.random() - 0.5) * 0.1;

    // Create a simulated ride request
    const ride = await base44.entities.Ride.create({
      rider_email: `rider_${Date.now()}@test.com`,
      rider_phone: '+1-555-0123',
      pickup_address: `${Math.floor(Math.random() * 999) + 1} Canal St, New Orleans, LA 70112`,
      dropoff_address: `${Math.floor(Math.random() * 999) + 1} Bourbon St, New Orleans, LA 70116`,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      dropoff_lat: dropoffLat,
      dropoff_lng: dropoffLng,
      status: 'requested',
      distance_km: Math.round((2 + Math.random() * 8) * 10) / 10,
      base_fare: 5.0,
      surge_multiplier: Math.random() > 0.7 ? Math.round((1.5 + Math.random() * 0.5) * 10) / 10 : 1.0,
      fare: 0, // Will be calculated
      ai_pricing_reason: 'Simulated ride request',
      payment_method: Math.random() > 0.5 ? 'card' : 'cash',
      payment_status: 'unpaid',
      declined_by: []
    });

    // Calculate fare
    const distanceMiles = ride.distance_km;
    const baseRate = 2.5;
    const calculatedFare = Math.round((5 + (distanceMiles * baseRate) * ride.surge_multiplier) * 100) / 100;
    
    await base44.entities.Ride.update(ride.id, {
      fare: calculatedFare,
      base_fare: 5 + (distanceMiles * baseRate)
    });

    return Response.json({
      success: true,
      message: 'Simulated ride request created',
      ride: {
        id: ride.id,
        pickup: ride.pickup_address,
        dropoff: ride.dropoff_address,
        distance: ride.distance_km,
        fare: calculatedFare,
        surge: ride.surge_multiplier,
        payment: ride.payment_method
      }
    });

  } catch (error) {
    console.error('Simulate ride error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});