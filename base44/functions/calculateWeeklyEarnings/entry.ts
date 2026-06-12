import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Calculate the previous week (Monday to Sunday)
        const now = new Date();
        const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Find last Monday
        const daysSinceMonday = today === 0 ? 6 : today - 1;
        const lastMonday = new Date(now);
        lastMonday.setDate(now.getDate() - daysSinceMonday - 7);
        lastMonday.setHours(0, 0, 0, 0);
        
        // Find last Sunday
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        lastSunday.setHours(23, 59, 59, 999);

        const weekStart = lastMonday.toISOString().split('T')[0];
        const weekEnd = lastSunday.toISOString().split('T')[0];

        console.log(`Calculating earnings for week: ${weekStart} to ${weekEnd}`);

        // Get all completed and paid rides from last week
        const allRides = await base44.asServiceRole.entities.Ride.filter({ 
            status: 'completed', 
            payment_status: 'paid' 
        });

        // Filter rides from last week
        const lastWeekRides = allRides.filter(ride => {
            const rideDate = new Date(ride.created_date);
            return rideDate >= lastMonday && rideDate <= lastSunday;
        });

        if (lastWeekRides.length === 0) {
            console.log('No completed rides found for last week');
            return Response.json({ 
                success: true, 
                message: 'No rides found for last week',
                week_start: weekStart,
                week_end: weekEnd,
                rides_processed: 0
            });
        }

        // Aggregate by driver
        const driverEarnings = {};
        
        for (const ride of lastWeekRides) {
            const driverEmail = ride.driver_email;
            if (!driverEmail) continue;

            if (!driverEarnings[driverEmail]) {
                driverEarnings[driverEmail] = {
                    trips: 0,
                    gross_fare: 0,
                    driver_payout: 0,
                    platform_cut: 0
                };
            }

            const fare = ride.fare || 0;
            const driverShare = fare * 0.8; // 80% to driver
            const platformShare = fare * 0.2; // 20% to platform

            driverEarnings[driverEmail].trips += 1;
            driverEarnings[driverEmail].gross_fare += fare;
            driverEarnings[driverEmail].driver_payout += driverShare;
            driverEarnings[driverEmail].platform_cut += platformShare;
        }

        // Create or update DriverEarnings records
        const records = [];
        for (const [driverEmail, earnings] of Object.entries(driverEarnings)) {
            // Check if record already exists for this week
            const existing = await base44.asServiceRole.entities.DriverEarnings.filter({
                driver_email: driverEmail,
                week_start: weekStart,
                week_end: weekEnd
            });

            const earningsData = {
                driver_email: driverEmail,
                week_start: weekStart,
                week_end: weekEnd,
                trips_completed: earnings.trips,
                gross_fare: Math.round(earnings.gross_fare * 100) / 100,
                driver_payout: Math.round(earnings.driver_payout * 100) / 100,
                platform_cut: Math.round(earnings.platform_cut * 100) / 100,
                calculated_date: new Date().toISOString()
            };

            if (existing.length > 0) {
                // Update existing record
                await base44.asServiceRole.entities.DriverEarnings.update(existing[0].id, earningsData);
                console.log(`Updated earnings for ${driverEmail}: $${earnings.driver_payout.toFixed(2)}`);
            } else {
                // Create new record
                await base44.asServiceRole.entities.DriverEarnings.create(earningsData);
                console.log(`Created earnings record for ${driverEmail}: $${earnings.driver_payout.toFixed(2)}`);
            }

            records.push(earningsData);
        }

        const totalPayout = Object.values(driverEarnings).reduce((sum, e) => sum + e.driver_payout, 0);
        const totalPlatform = Object.values(driverEarnings).reduce((sum, e) => sum + e.platform_cut, 0);

        console.log(`Weekly earnings calculation complete: ${records.length} drivers, $${totalPayout.toFixed(2)} total payout`);

        return Response.json({
            success: true,
            week_start: weekStart,
            week_end: weekEnd,
            drivers_processed: records.length,
            rides_processed: lastWeekRides.length,
            total_driver_payout: Math.round(totalPayout * 100) / 100,
            total_platform_revenue: Math.round(totalPlatform * 100) / 100,
            records: records
        });
    } catch (error) {
        console.error('Weekly earnings calculation error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});