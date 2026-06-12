import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();

        const ride_id = body.event?.entity_id || body.ride_id;
        const data = body.data;
        const old_data = body.old_data;

        // Only fire when a ride transitions to "accepted" and gains a driver_email
        if (!data || data.status !== 'accepted' || !data.driver_email) {
            return Response.json({ skipped: true });
        }
        // Avoid duplicate alerts if driver_email didn't change
        if (old_data?.driver_email === data.driver_email && old_data?.status === 'accepted') {
            return Response.json({ skipped: true, reason: 'no change' });
        }

        await base44.asServiceRole.entities.DriverAlert.create({
            driver_email: data.driver_email,
            message: `New ride assigned: ${data.pickup_address} → ${data.dropoff_address}. Fare: $${(data.fare || 0).toFixed(2)}`,
            type: 'surge_zone', // reusing existing enum — acts as general alert
            read: false,
        });

        console.log(`Alert created for driver: ${data.driver_email}, ride: ${ride_id}`);
        return Response.json({ success: true });
    } catch (error) {
        console.error('alertDriverOnAssignment error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});