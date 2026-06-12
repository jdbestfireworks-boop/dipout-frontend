import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function runs automatically via scheduled automation
        // No user authentication needed for automated tasks

        console.log('Running automated system alerts...');

        const now = new Date();
        const alerts = [];

        // Check 1: Stuck rides (waiting > 15 minutes)
        const requestedRides = await base44.asServiceRole.entities.Ride.filter({ status: 'requested' });
        for (const ride of requestedRides) {
            const rideTime = new Date(ride.created_date);
            const minutesWaiting = (now - rideTime) / (1000 * 60);
            
            if (minutesWaiting > 15) {
                alerts.push({
                    type: 'stuck_ride',
                    severity: 'high',
                    title: 'Ride Waiting Too Long',
                    message: `Ride from ${ride.pickup_address} has been waiting ${Math.round(minutesWaiting)} minutes`,
                    ride_id: ride.id,
                    action_required: 'Check driver availability or notify riders'
                });
            }
        }

        // Check 2: No online drivers
        const drivers = await base44.asServiceRole.entities.DriverProfile.list();
        const onlineDrivers = drivers.filter(d => d.status !== 'offline');
        
        if (onlineDrivers.length === 0 && requestedRides.length > 0) {
            alerts.push({
                type: 'no_drivers',
                severity: 'critical',
                title: 'No Drivers Online',
                message: `${requestedRides.length} rides waiting but no drivers available`,
                action_required: 'Notify drivers about surge zones or high demand'
            });
        }

        // Check 3: Long rides (in progress > 3 hours)
        const inProgressRides = await base44.asServiceRole.entities.Ride.filter({ status: 'in_progress' });
        for (const ride of inProgressRides) {
            const rideTime = new Date(ride.created_date);
            const hoursElapsed = (now - rideTime) / (1000 * 60 * 60);
            
            if (hoursElapsed > 3) {
                alerts.push({
                    type: 'long_ride',
                    severity: 'medium',
                    title: 'Unusually Long Ride',
                    message: `Ride to ${ride.dropoff_address} has been in progress for ${hoursElapsed.toFixed(1)} hours`,
                    ride_id: ride.id,
                    action_required: 'Check if ride completed successfully'
                });
            }
        }

        // Check 4: Unapproved drivers pending > 48 hours
        const pendingDrivers = drivers.filter(d => !d.approved);
        const fortyEightHoursAgo = new Date();
        fortyEightHoursAgo.setDate(fortyEightHoursAgo.getDate() - 2);
        
        for (const driver of pendingDrivers) {
            if (driver.created_date && new Date(driver.created_date) < fortyEightHoursAgo) {
                alerts.push({
                    type: 'pending_driver',
                    severity: 'low',
                    title: 'Driver Approval Pending',
                    message: `Driver ${driver.user_email} awaiting approval for > 48 hours`,
                    driver_email: driver.user_email,
                    action_required: 'Review and approve/reject driver application'
                });
            }
        }

        // Check 5: Payment issues (completed but unpaid)
        const completedRides = await base44.asServiceRole.entities.Ride.filter({ status: 'completed', payment_status: 'unpaid' });
        if (completedRides.length > 0) {
            alerts.push({
                type: 'payment_issues',
                severity: 'medium',
                title: 'Unpaid Rides',
                message: `${completedRides.length} completed rides awaiting payment`,
                count: completedRides.length,
                action_required: 'Follow up on payment collection'
            });
        }

        // Send critical alerts via email
        const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
        if (criticalAlerts.length > 0) {
            // Get admin emails
            const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
            
            for (const admin of admins) {
                const emailBody = `
<h2>Dip Out - Critical System Alerts</h2>
<p>${criticalAlerts.length} critical/high priority alerts require your attention:</p>
${criticalAlerts.map(alert => `
    <div style="margin: 15px 0; padding: 10px; border-left: 4px solid ${alert.severity === 'critical' ? 'red' : 'orange'}; background: #f9f9f9;">
        <strong>${alert.title}</strong><br>
        ${alert.message}<br>
        <em>Action: ${alert.action_required}</em>
    </div>
`).join('')}
<p>Please review in the admin dashboard.</p>
                `.trim();

                try {
                    await base44.integrations.Core.SendEmail({
                        to: admin.email,
                        subject: `🚨 Dip Out Alert: ${criticalAlerts.length} Critical Issues`,
                        body: emailBody
                    });
                    console.log(`Alert email sent to ${admin.email}`);
                } catch (emailError) {
                    console.error('Failed to send alert email:', emailError);
                }
            }
        }

        // Store alerts in database for dashboard display
        for (const alert of alerts) {
            await base44.asServiceRole.entities.SystemAlert.create({
                type: alert.type,
                severity: alert.severity,
                title: alert.title,
                message: alert.message,
                ride_id: alert.ride_id || null,
                driver_email: alert.driver_email || null,
                action_required: alert.action_required,
                resolved: false,
                created_at: now.toISOString()
            });
        }

        // Auto-resolve old alerts (older than 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const oldAlerts = await base44.asServiceRole.entities.SystemAlert.filter({ resolved: false });
        for (const oldAlert of oldAlerts) {
            if (new Date(oldAlert.created_date) < sevenDaysAgo) {
                await base44.asServiceRole.entities.SystemAlert.update(oldAlert.id, {
                    resolved: true,
                    resolved_at: now.toISOString(),
                    resolution_note: 'Auto-resolved after 7 days'
                });
            }
        }

        console.log(`Automated alerts complete: ${alerts.length} alerts generated, ${criticalAlerts.length} critical`);

        return Response.json({
            success: true,
            alerts_generated: alerts.length,
            critical_alerts: criticalAlerts.length,
            emails_sent: criticalAlerts.length > 0 ? admins?.length || 0 : 0,
            alerts: alerts
        });

    } catch (error) {
        console.error('Automated alerts error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});