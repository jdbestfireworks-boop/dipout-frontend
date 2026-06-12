import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { ride_data } = await req.json();

        if (!ride_data) {
            console.error('Missing ride data');
            return Response.json({ error: 'Ride data required' }, { status: 400 });
        }

        // Create the ride with payment status based on method
        const paymentMethod = ride_data.payment_method || 'cash';
        const paymentStatus = paymentMethod === 'card' ? 'paid' : 'unpaid';
        
        const ride = await base44.entities.Ride.create({
            rider_email: ride_data.rider_email,
            rider_phone: ride_data.rider_phone || '',
            pickup_address: ride_data.pickup_address,
            dropoff_address: ride_data.dropoff_address,
            pickup_lat: ride_data.pickup_lat,
            pickup_lng: ride_data.pickup_lng,
            dropoff_lat: ride_data.dropoff_lat,
            dropoff_lng: ride_data.dropoff_lng,
            status: 'requested',
            distance_km: ride_data.distance_km,
            base_fare: ride_data.base_fare,
            surge_multiplier: ride_data.surge_multiplier,
            fare: ride_data.fare,
            ai_pricing_reason: ride_data.ai_pricing_reason,
            payment_status: paymentStatus,
            payment_method: paymentMethod,
        });

        // Create stop records if any
        if (ride_data.stops && ride_data.stops.length > 0) {
            const stopPromises = ride_data.stops.map((stop, index) => 
                base44.entities.RideStop.create({
                    ride_id: ride.id,
                    address: stop.address,
                    lat: stop.lat,
                    lng: stop.lng,
                    stop_number: index + 1,
                    stop_type: 'intermediate',
                    completed: false,
                })
            );
            await Promise.all(stopPromises);
        }

        console.log('Ride created after payment:', ride.id);

        return Response.json({ 
            success: true,
            ride_id: ride.id 
        });
    } catch (error) {
        console.error('Complete booking error:', error.message, error.stack);
        return Response.json({ error: 'Failed to complete booking. Please contact support.' }, { status: 500 });
    }
});