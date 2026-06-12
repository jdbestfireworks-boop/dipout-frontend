import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Only admins can check alerts
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { earningsThreshold = 50 } = await req.json().catch(() => ({}));

        // Get current week date range
        const weekStart = moment().startOf('week');
        const weekEnd = moment().endOf('week');

        // Fetch all drivers and rides
        const [drivers, rides] = await Promise.all([
            base44.entities.DriverProfile.list(),
            base44.entities.Ride.list()
        ]);

        const alerts = [];

        // Check each driver's earnings
        for (const driver of drivers) {
            if (!driver.approved) continue; // Skip unapproved drivers

            // Calculate weekly earnings
            const driverRides = rides.filter(r => {
                if (!r.created_date || r.status !== 'completed' || r.payment_status !== 'paid') return false;
                if (r.driver_email !== driver.user_email) return false;
                const rideDate = moment(r.created_date);
                return rideDate.isBetween(weekStart, weekEnd, null, '[]');
            });

            const grossFare = driverRides.reduce((sum, r) => sum + (r.fare || 0), 0);
            const weeklyEarnings = grossFare * 0.8; // 80% driver share

            // Alert if earnings below threshold
            if (weeklyEarnings < earningsThreshold && driverRides.length > 0) {
                alerts.push({
                    type: 'low_earnings',
                    severity: 'medium',
                    title: 'Low Weekly Earnings',
                    message: `${driver.user_email} has earned only $${weeklyEarnings.toFixed(2)} this week (threshold: $${earningsThreshold})`,
                    driver_email: driver.user_email,
                    action_required: 'Consider sending surge zone alert or checking driver status',
                    data: {
                        weekly_earnings: weeklyEarnings,
                        threshold: earningsThreshold,
                        trips_completed: driverRides.length
                    }
                });
            }

            // Alert if no trips this week but driver is online
            if (driverRides.length === 0 && driver.status !== 'offline' && driver.approved) {
                alerts.push({
                    type: 'no_trips',
                    severity: 'low',
                    title: 'No Trips This Week',
                    message: `${driver.user_email} is ${driver.status} but has no completed trips this week`,
                    driver_email: driver.user_email,
                    action_required: 'Check if driver is active in high-demand areas',
                    data: {
                        driver_status: driver.status,
                        weeks_active: driver.trips_completed || 0
                    }
                });
            }
        }

        // Check for rides with issues (cancelled after acceptance, payment issues, etc.)
        const issueRides = rides.filter(r => {
            return (
                (r.status === 'cancelled' && r.cancellation_fee > 0) ||
                (r.payment_status === 'unpaid' && r.status === 'completed') ||
                (r.rider_rating && r.rider_rating < 3)
            );
        });

        issueRides.forEach(ride => {
            let issueType = '';
            let actionRequired = '';

            if (ride.status === 'cancelled' && ride.cancellation_fee > 0) {
                issueType = 'Cancellation Fee Dispute';
                actionRequired = 'Review cancellation reason and process refund if needed';
            } else if (ride.payment_status === 'unpaid' && ride.status === 'completed') {
                issueType = 'Unpaid Ride';
                actionRequired = 'Contact rider for payment or mark as cash';
            } else if (ride.rider_rating && ride.rider_rating < 3) {
                issueType = 'Low Rating';
                actionRequired = 'Review ride details and follow up with driver/rider';
            }

            alerts.push({
                type: 'ride_issue',
                severity: 'high',
                title: issueType,
                message: `Ride from ${ride.rider_email} to ${ride.dropoff_address} has an issue`,
                ride_id: ride.id,
                driver_email: ride.driver_email,
                action_required: actionRequired,
                data: {
                    ride_status: ride.status,
                    payment_status: ride.payment_status,
                    rating: ride.rider_rating,
                    cancellation_fee: ride.cancellation_fee,
                    fare: ride.fare
                }
            });
        });

        // Save critical alerts to SystemAlert entity
        const criticalAlerts = alerts.filter(a => a.severity === 'high');
        for (const alert of criticalAlerts) {
            await base44.entities.SystemAlert.create({
                type: alert.type === 'ride_issue' ? 'payment_issues' : 'system_error',
                severity: alert.severity,
                title: alert.title,
                message: alert.message,
                ride_id: alert.ride_id,
                driver_email: alert.driver_email,
                action_required: alert.action_required
            });
        }

        console.log(`Generated ${alerts.length} alerts (${criticalAlerts.length} critical)`);

        return Response.json({
            success: true,
            alerts,
            summary: {
                total: alerts.length,
                critical: alerts.filter(a => a.severity === 'high').length,
                medium: alerts.filter(a => a.severity === 'medium').length,
                low: alerts.filter(a => a.severity === 'low').length,
                low_earnings: alerts.filter(a => a.type === 'low_earnings').length,
                no_trips: alerts.filter(a => a.type === 'no_trips').length,
                ride_issues: alerts.filter(a => a.type === 'ride_issue').length
            }
        });
    } catch (error) {
        console.error('Driver alert check error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});