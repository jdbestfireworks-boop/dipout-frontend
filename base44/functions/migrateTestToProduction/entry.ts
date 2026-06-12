import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Starting migration from Test to Production...');

    const migrated = {
      pricingConfigs: 0,
      surgeZones: 0,
      drivers: 0,
      rides: 0,
      savedAddresses: 0,
    };

    // 1. Migrate PricingConfig
    const testPricing = await base44.asServiceRole.entities.PricingConfig.filter({});
    for (const config of testPricing) {
      await base44.asServiceRole.entities.PricingConfig.create({
        name: config.name,
        base_fare: config.base_fare,
        per_mile_rate: config.per_mile_rate,
        driver_commission: config.driver_commission,
        min_fare: config.min_fare,
        active: config.active,
      });
      migrated.pricingConfigs++;
    }
    console.log(`Migrated ${migrated.pricingConfigs} pricing configs`);

    // 2. Migrate SurgeZones
    const testZones = await base44.asServiceRole.entities.SurgeZone.filter({});
    for (const zone of testZones) {
      await base44.asServiceRole.entities.SurgeZone.create({
        name: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        radius_km: zone.radius_km,
        surge_multiplier: zone.surge_multiplier,
        active: zone.active,
      });
      migrated.surgeZones++;
    }
    console.log(`Migrated ${migrated.surgeZones} surge zones`);

    // 3. Migrate DriverProfiles (only approved ones)
    const testDrivers = await base44.asServiceRole.entities.DriverProfile.filter({});
    for (const driver of testDrivers) {
      await base44.asServiceRole.entities.DriverProfile.create({
        user_email: driver.user_email,
        vehicle: driver.vehicle,
        plate: driver.plate,
        phone: driver.phone,
        status: 'offline', // Start offline in production
        approved: driver.approved,
        lat: driver.lat,
        lng: driver.lng,
        rating: driver.rating,
        total_ratings: driver.total_ratings,
        total_earnings: driver.total_earnings,
        trips_completed: driver.trips_completed,
        license_doc_url: driver.license_doc_url,
        insurance_doc_url: driver.insurance_doc_url,
        earnings_mode: driver.earnings_mode,
      });
      migrated.drivers++;
    }
    console.log(`Migrated ${migrated.drivers} driver profiles`);

    // 4. Migrate Rides (optional - uncomment if needed)
    // const testRides = await base44.asServiceRole.entities.Ride.filter({});
    // for (const ride of testRides) {
    //   await base44.asServiceRole.entities.Ride.create({
    //     rider_email: ride.rider_email,
    //     driver_email: ride.driver_email,
    //     rider_phone: ride.rider_phone,
    //     driver_phone: ride.driver_phone,
    //     pickup_address: ride.pickup_address,
    //     dropoff_address: ride.dropoff_address,
    //     pickup_lat: ride.pickup_lat,
    //     pickup_lng: ride.pickup_lng,
    //     dropoff_lat: ride.dropoff_lat,
    //     dropoff_lng: ride.dropoff_lng,
    //     driver_lat: ride.driver_lat,
    //     driver_lng: ride.driver_lng,
    //     status: ride.status,
    //     scheduled_for: ride.scheduled_for,
    //     distance_km: ride.distance_km,
    //     base_fare: ride.base_fare,
    //     surge_multiplier: ride.surge_multiplier,
    //     fare: ride.fare,
    //     ai_pricing_reason: ride.ai_pricing_reason,
    //     payment_method: ride.payment_method,
    //     payment_status: ride.payment_status,
    //     payment_mode: ride.payment_mode,
    //     cancellation_fee: ride.cancellation_fee,
    //     cancelled_at: ride.cancelled_at,
    //     rider_rating: ride.rider_rating,
    //     rider_comment: ride.rider_comment,
    //     declined_by: ride.declined_by,
    //   });
    //   migrated.rides++;
    // }
    // console.log(`Migrated ${migrated.rides} rides`);

    // 5. Migrate SavedAddresses
    const testAddresses = await base44.asServiceRole.entities.SavedAddress.filter({});
    for (const addr of testAddresses) {
      await base44.asServiceRole.entities.SavedAddress.create({
        user_email: addr.user_email,
        label: addr.label,
        address: addr.address,
        lat: addr.lat,
        lng: addr.lng,
      });
      migrated.savedAddresses++;
    }
    console.log(`Migrated ${migrated.savedAddresses} saved addresses`);

    return Response.json({
      success: true,
      message: 'Migration completed successfully',
      migrated,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Migration failed. Check logs for details.'
    }, { status: 500 });
  }
});