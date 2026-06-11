import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Sample data
        const sampleDrivers = [
            {
                user_email: 'mike.driver@example.com',
                vehicle: 'Toyota Camry',
                plate: 'ABC-1234',
                phone: '(504) 555-0101',
                status: 'available',
                approved: true,
                lat: 29.9511,
                lng: -90.0715,
                rating: 4.8,
                total_ratings: 342,
                total_earnings: 4250.50,
                trips_completed: 187,
            },
            {
                user_email: 'sarah.rides@example.com',
                vehicle: 'Honda Accord',
                plate: 'XYZ-5678',
                phone: '(504) 555-0102',
                status: 'busy',
                approved: true,
                lat: 29.9584,
                lng: -90.0644,
                rating: 4.9,
                total_ratings: 521,
                total_earnings: 6890.25,
                trips_completed: 298,
            },
            {
                user_email: 'james.newdriver@example.com',
                vehicle: 'Nissan Altima',
                plate: 'DEF-9012',
                phone: '(504) 555-0103',
                status: 'offline',
                approved: false,
                rating: 5.0,
                total_ratings: 0,
                total_earnings: 0,
                trips_completed: 0,
            },
        ];

        const sampleRides = [
            {
                rider_email: 'john.rider@example.com',
                driver_email: 'mike.driver@example.com',
                pickup_address: '123 Canal St, New Orleans, LA 70112',
                dropoff_address: 'Louis Armstrong Airport, Kenner, LA 70062',
                pickup_lat: 29.9511,
                pickup_lng: -90.0715,
                dropoff_lat: 29.9934,
                dropoff_lng: -90.2580,
                driver_lat: 29.9511,
                driver_lng: -90.0715,
                status: 'completed',
                distance_km: 28.5,
                base_fare: 38.00,
                surge_multiplier: 1.2,
                fare: 45.60,
                ai_pricing_reason: 'Moderate demand in downtown area',
                payment_method: 'card',
                payment_status: 'paid',
                rider_rating: 5,
                rider_comment: 'Great service! Mike was very professional.',
            },
            {
                rider_email: 'emma.passenger@example.com',
                driver_email: 'sarah.rides@example.com',
                pickup_address: 'French Quarter, New Orleans, LA 70116',
                dropoff_address: 'Garden District, New Orleans, LA 70130',
                pickup_lat: 29.9584,
                pickup_lng: -90.0644,
                dropoff_lat: 29.9287,
                dropoff_lng: -90.0878,
                driver_lat: 29.9584,
                driver_lng: -90.0644,
                status: 'completed',
                distance_km: 5.2,
                base_fare: 12.50,
                surge_multiplier: 1.5,
                fare: 18.75,
                ai_pricing_reason: 'High demand in French Quarter - surge pricing active',
                payment_method: 'cash',
                payment_status: 'paid',
                rider_rating: 4,
                rider_comment: 'Quick ride, thanks!',
            },
            {
                rider_email: 'alex.traveler@example.com',
                driver_email: 'mike.driver@example.com',
                pickup_address: 'Superdome, New Orleans, LA 70112',
                dropoff_address: 'Bourbon Street, New Orleans, LA 70116',
                pickup_lat: 29.9511,
                pickup_lng: -90.0812,
                dropoff_lat: 29.9584,
                dropoff_lng: -90.0644,
                driver_lat: 29.9511,
                driver_lng: -90.0812,
                status: 'in_progress',
                distance_km: 2.8,
                base_fare: 8.00,
                surge_multiplier: 1.0,
                fare: 8.00,
                ai_pricing_reason: 'Normal demand, short distance',
                payment_method: 'card',
                payment_status: 'unpaid',
            },
            {
                rider_email: 'lisa.visitor@example.com',
                driver_email: null,
                pickup_address: 'Convention Center, New Orleans, LA 70130',
                dropoff_address: 'City Park, New Orleans, LA 70124',
                pickup_lat: 29.9436,
                pickup_lng: -90.0604,
                dropoff_lat: 29.9987,
                dropoff_lng: -90.0958,
                status: 'requested',
                distance_km: 8.5,
                base_fare: 18.00,
                surge_multiplier: 1.3,
                fare: 23.40,
                ai_pricing_reason: 'Moderate demand, medium distance',
                payment_method: 'card',
                payment_status: 'unpaid',
            },
        ];

        // Create drivers
        const createdDrivers = [];
        for (const driver of sampleDrivers) {
            const existing = await base44.entities.DriverProfile.filter({ user_email: driver.user_email });
            if (existing.length === 0) {
                const created = await base44.entities.DriverProfile.create(driver);
                createdDrivers.push(created);
            }
        }

        // Create rides
        const createdRides = [];
        for (const ride of sampleRides) {
            const created = await base44.entities.Ride.create(ride);
            createdRides.push(created);
        }

        return Response.json({
            success: true,
            message: 'Demo data seeded successfully',
            drivers: createdDrivers.length,
            rides: createdRides.length,
        });
    } catch (error) {
        console.error('Seed error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});