import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get admin user (system call)
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Calculate previous month range
        const now = moment();
        const lastMonth = now.clone().subtract(1, 'month');
        const monthStart = lastMonth.clone().startOf('month');
        const monthEnd = lastMonth.clone().endOf('month');
        
        console.log(`Generating monthly report for ${monthStart.format('MMMM YYYY')}`);

        // Fetch all rides and drivers
        const [rides, drivers] = await Promise.all([
            base44.entities.Ride.list(),
            base44.entities.DriverProfile.list()
        ]);

        // Filter rides for previous month
        const monthRides = rides.filter(ride => {
            if (!ride.created_date) return false;
            const rideDate = moment(ride.created_date);
            return rideDate.isBetween(monthStart, monthEnd, null, '[]');
        });

        // Calculate metrics
        const completedRides = monthRides.filter(r => r.status === 'completed');
        const totalRevenue = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
        const platformCut = completedRides.reduce((sum, r) => {
            const driverPayout = (r.fare || 0) * 0.8;
            return sum + ((r.fare || 0) - driverPayout);
        }, 0);
        const totalDriverPayouts = totalRevenue - platformCut;

        // Driver performance
        const driverStats = drivers.map(driver => {
            const driverRides = completedRides.filter(r => r.driver_email === driver.user_email);
            const grossFare = driverRides.reduce((sum, r) => sum + (r.fare || 0), 0);
            const payout = grossFare * 0.8;
            
            return {
                email: driver.user_email,
                trips: driverRides.length,
                gross_fare: grossFare,
                payout: payout,
                rating: driver.rating || 0,
                status: driver.status
            };
        }).filter(d => d.trips > 0).sort((a, b) => b.gross_fare - a.gross_fare);

        // Get Gmail connector
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
        
        // Send email using Gmail API
        const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
        .metric-value { font-size: 28px; font-weight: bold; color: #667eea; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #667eea; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #667eea; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🚗 Dip Out Monthly Report</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${monthStart.format('MMMM YYYY')}</p>
        </div>

        <h2 style="color: #667eea;">📊 Platform Overview</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${completedRides.length}</div>
                <div class="metric-label">Total Rides</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$${totalRevenue.toFixed(2)}</div>
                <div class="metric-label">Total Revenue</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$${platformCut.toFixed(2)}</div>
                <div class="metric-label">Platform Commission (20%)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$${totalDriverPayouts.toFixed(2)}</div>
                <div class="metric-label">Driver Payouts (80%)</div>
            </div>
        </div>

        <h2 style="color: #667eea; margin-top: 40px;">🏆 Top Performing Drivers</h2>
        ${driverStats.length > 0 ? `
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
                ${driverStats.slice(0, 10).map(d => `
                <tr>
                    <td>${d.email}</td>
                    <td>${d.trips}</td>
                    <td>$${d.gross_fare.toFixed(2)}</td>
                    <td><strong>$${d.payout.toFixed(2)}</strong></td>
                    <td>⭐ ${d.rating.toFixed(1)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p style="color: #666; font-style: italic;">No driver activity this month.</p>'}

        <div class="footer">
            <p><strong>Dip Out</strong> · Louisiana's Ride-Sharing Platform</p>
            <p>Report generated on ${now.format('MMMM D, YYYY')}</p>
        </div>
    </div>
</body>
</html>
        `;

        // Create MIME message
        const mimeMessage = [
            'From: Dip Out Reports <noreply@dipout.com>',
            'To: Admin <admin@dipout.com>',
            `Subject: 🚗 Dip Out Monthly Report - ${monthStart.format('MMMM YYYY')}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            emailBody
        ].join('\r\n');

        // Encode for Gmail API using TextEncoder for UTF-8 support
        const encoder = new TextEncoder();
        const encodedBytes = encoder.encode(mimeMessage);
        let binary = '';
        for (let i = 0; i < encodedBytes.byteLength; i++) {
            binary += String.fromCharCode(encodedBytes[i]);
        }
        const encodedMessage = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        // Send via Gmail API
        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw: encodedMessage })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to send email');
        }

        console.log(`Monthly report sent successfully for ${monthStart.format('MMMM YYYY')}`);

        return Response.json({ 
            success: true, 
            month: monthStart.format('MMMM YYYY'),
            rides: completedRides.length,
            revenue: totalRevenue,
            drivers_reported: driverStats.length
        });
    } catch (error) {
        console.error('Monthly report error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});