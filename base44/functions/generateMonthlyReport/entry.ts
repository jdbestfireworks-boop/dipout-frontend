import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Only admins can generate reports
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Get current month date range
        const monthStart = moment().startOf('month');
        const monthEnd = moment().endOf('month');
        
        console.log(`Generating monthly report for ${monthStart.format('MMMM YYYY')}`);

        // Fetch all rides and drivers
        const [rides, drivers] = await Promise.all([
            base44.entities.Ride.list(),
            base44.entities.DriverProfile.list()
        ]);

        // Filter completed rides for current month
        const completedRides = rides.filter(ride => {
            if (ride.status !== 'completed' || ride.payment_status !== 'paid') return false;
            const rideDate = moment(ride.created_date);
            return rideDate.isBetween(monthStart, monthEnd, null, '[]');
        });

        // Calculate totals
        const totalRevenue = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
        const platformCut = totalRevenue * 0.2; // 20% platform commission
        const totalDriverPayouts = totalRevenue * 0.8; // 80% to drivers

        // Get driver stats
        const driverEmails = [...new Set(completedRides.map(r => r.driver_email).filter(Boolean))];
        const driverStats = await Promise.all(driverEmails.map(async (email) => {
            const driverRides = completedRides.filter(r => r.driver_email === email);
            const grossFare = driverRides.reduce((sum, r) => sum + (r.fare || 0), 0);
            const payout = grossFare * 0.8;
            
            // Get driver profile
            const driversList = await base44.entities.DriverProfile.filter({ user_email: email });
            const driver = driversList[0];
            
            return {
                email,
                trips: driverRides.length,
                gross_fare: grossFare,
                payout,
                rating: driver?.rating || 5.0
            };
        }));

        // Sort by revenue
        driverStats.sort((a, b) => b.gross_fare - a.gross_fare);

        // Build email body
        const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
        .stat-box { display: inline-block; background: #f8f9fa; padding: 20px; margin: 10px; border-radius: 8px; min-width: 150px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #667eea; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #667eea; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">Dip Out Monthly Report</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${monthStart.format('MMMM YYYY')}</p>
    </div>

    <h2>Platform Overview</h2>
    <div>
        <div class="stat-box">
            <div class="stat-value">${completedRides.length}</div>
            <div class="stat-label">Completed Rides</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">$${totalRevenue.toFixed(2)}</div>
            <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">$${platformCut.toFixed(2)}</div>
            <div class="stat-label">Platform Commission (20%)</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">$${totalDriverPayouts.toFixed(2)}</div>
            <div class="stat-label">Driver Payouts (80%)</div>
        </div>
    </div>

    <h2>Driver Performance</h2>
    <table>
        <thead>
            <tr>
                <th>Driver</th>
                <th>Trips</th>
                <th>Gross Fare</th>
                <th>Payout (80%)</th>
                <th>Rating</th>
            </tr>
        </thead>
        <tbody>
            ${driverStats.map(d => `
                <tr>
                    <td>${d.email}</td>
                    <td>${d.trips}</td>
                    <td>$${d.gross_fare.toFixed(2)}</td>
                    <td>$${d.payout.toFixed(2)}</td>
                    <td>⭐ ${d.rating.toFixed(1)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <h2>Trends & Insights</h2>
    <ul>
        <li><strong>Average Fare:</strong> $${(completedRides.length ? totalRevenue / completedRides.length : 0).toFixed(2)}</li>
        <li><strong>Active Drivers:</strong> ${driverStats.length}</li>
        <li><strong>Platform Growth:</strong> Data tracked in Google Sheets</li>
    </ul>

    <div class="footer">
        <p>This report was automatically generated by Dip Out Analytics.<br>
        Data is synced to Google Sheets for trend analysis.</p>
    </div>
</body>
</html>
`.trim();

        // Send email to admin
        await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `Dip Out Monthly Report - ${monthStart.format('MMMM YYYY')}`,
            body: emailBody
        });

        console.log(`Monthly report sent to ${user.email}`);

        return Response.json({
            success: true,
            message: `Monthly report generated and sent to ${user.email}`,
            stats: {
                period: monthStart.format('MMMM YYYY'),
                total_rides: completedRides.length,
                total_revenue: totalRevenue,
                platform_cut: platformCut,
                driver_payouts: totalDriverPayouts,
                active_drivers: driverStats.length
            }
        });
    } catch (error) {
        console.error('Monthly report error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});