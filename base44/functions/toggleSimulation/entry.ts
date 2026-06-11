import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'stop') {
      // Stop simulation - archive the automation
      const automations = await base44.asServiceRole.functions.invoke('list_automations', {
        automation_name: 'Continuous AI Ride Simulation',
      });
      
      const simAutomation = automations.data?.automations?.find(a => a.name === 'Continuous AI Ride Simulation');
      if (simAutomation) {
        await base44.asServiceRole.functions.invoke('manage_automation', {
          automation_id: simAutomation.id,
          action: 'archive',
        });
      }

      // Clear any active simulation flag
      return Response.json({
        success: true,
        message: 'Simulation stopped - no more AI rides will be generated',
        simulation_active: false,
      });
    }

    // Start simulation - ensure automation is active
    const automations = await base44.asServiceRole.functions.invoke('list_automations', {
      automation_name: 'Continuous AI Ride Simulation',
    });
    
    const simAutomation = automations.data?.automations?.find(a => a.name === 'Continuous AI Ride Simulation');
    
    if (simAutomation) {
      if (simAutomation.is_archived) {
        await base44.asServiceRole.functions.invoke('manage_automation', {
          automation_id: simAutomation.id,
          action: 'unarchive',
        });
      }
    }

    // Create initial batch of rides to make app feel active
    const AI_RIDERS = [
      { email: 'sarah.johnson@example.com', phone: '+1-337-555-0101' },
      { email: 'mike.chen@example.com', phone: '+1-337-555-0102' },
      { email: 'emma.williams@example.com', phone: '+1-337-555-0103' },
      { email: 'james.brown@example.com', phone: '+1-337-555-0104' },
      { email: 'lisa.garcia@example.com', phone: '+1-337-555-0105' },
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
    ];

    const randomCoords = () => ({
      lat: 30.2241 + (Math.random() - 0.5) * 0.15,
      lng: -92.0198 + (Math.random() - 0.5) * 0.15,
    });

    // Create 5-8 initial ride requests
    const initialCount = 5 + Math.floor(Math.random() * 4);
    const created = [];

    for (let i = 0; i < initialCount; i++) {
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
      created.push(ride);
    }

    return Response.json({
      success: true,
      message: `Simulation started! Created ${created.length} initial rides + ongoing generation every 5 min`,
      simulation_active: true,
      initial_rides_created: created.length,
    });

  } catch (error) {
    console.error('Simulation toggle error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});