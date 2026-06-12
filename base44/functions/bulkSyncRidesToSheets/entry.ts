import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin only' }, { status: 403 });
        }

        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

        // Find or create the spreadsheet
        let spreadsheetId = null;
        const searchRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name%3D'Dip%20Out%20-%20Ride%20Records'%20and%20mimeType%3D'application%2Fvnd.google-apps.spreadsheet'%20and%20trashed%3Dfalse`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        if (searchRes.ok) {
            const result = await searchRes.json();
            if (result.files?.length > 0) spreadsheetId = result.files[0].id;
        }

        if (!spreadsheetId) {
            const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    properties: { title: 'Dip Out - Ride Records' },
                    sheets: [
                        { properties: { title: 'All Rides', sheetId: 0 } },
                        { properties: { title: 'Driver Earnings', sheetId: 1 } },
                    ]
                })
            });
            if (!createRes.ok) throw new Error('Failed to create spreadsheet');
            const sheet = await createRes.json();
            spreadsheetId = sheet.spreadsheetId;
        } else {
            // Ensure both sheets exist
            const metaRes = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            const meta = await metaRes.json();
            const existingTitles = (meta.sheets || []).map(s => s.properties.title);
            const requests = [];
            if (!existingTitles.includes('All Rides')) {
                requests.push({ addSheet: { properties: { title: 'All Rides' } } });
            }
            if (!existingTitles.includes('Driver Earnings')) {
                requests.push({ addSheet: { properties: { title: 'Driver Earnings' } } });
            }
            if (requests.length > 0) {
                await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requests })
                });
            }
        }

        // ── Sheet 1: All Rides ──
        const allRides = await base44.asServiceRole.entities.Ride.list('-created_date', 2000);

        const rideHeaders = [
            'Date', 'Time', 'Ride ID', 'Status', 'Rider Email', 'Driver Email',
            'Pickup', 'Dropoff', 'Distance (mi)', 'Base Fare', 'Surge Multiplier',
            'Total Fare', 'Driver Earnings (80%)', 'Payment Method', 'Payment Status',
            'Rating', 'Rider Comment', 'Scheduled For'
        ];

        const rideRows = allRides.map(r => [
            r.created_date ? new Date(r.created_date).toLocaleDateString('en-US') : '',
            r.created_date ? new Date(r.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            r.id || '',
            r.status || '',
            r.rider_email || '',
            r.driver_email || '',
            r.pickup_address || '',
            r.dropoff_address || '',
            (r.distance_km || 0).toFixed(2),
            (r.base_fare || 0).toFixed(2),
            (r.surge_multiplier || 1).toFixed(2),
            (r.fare || 0).toFixed(2),
            r.status === 'completed' ? ((r.fare || 0) * 0.8).toFixed(2) : '',
            r.payment_method || '',
            r.payment_status || 'unpaid',
            r.rider_rating ? String(r.rider_rating) : '',
            r.rider_comment || '',
            r.scheduled_for || '',
        ]);

        // ── Sheet 2: Driver Earnings ──
        const drivers = await base44.asServiceRole.entities.DriverProfile.list('-created_date', 500);
        const completedRides = allRides.filter(r => r.status === 'completed');

        const earningsHeaders = [
            'Driver Email', 'Vehicle', 'Plate', 'Status', 'Approved',
            'Total Trips', 'Completed Rides (DB)', 'Total Earnings (DB)', 'Calculated Earnings',
            'Average Rating', 'Total Ratings'
        ];

        const earningsRows = drivers.map(d => {
            const driverRides = completedRides.filter(r => r.driver_email === d.user_email);
            const calcEarnings = driverRides.reduce((sum, r) => sum + (r.fare || 0) * 0.8, 0);
            return [
                d.user_email || '',
                d.vehicle || '',
                d.plate || '',
                d.status || '',
                d.approved ? 'Yes' : 'No',
                d.trips_completed || 0,
                driverRides.length,
                (d.total_earnings || 0).toFixed(2),
                calcEarnings.toFixed(2),
                (d.rating || 5).toFixed(2),
                d.total_ratings || 0,
            ];
        });

        // Write both sheets in parallel
        const [ridesWriteRes, earningsWriteRes] = await Promise.all([
            fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/All%20Rides!A1?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values: [rideHeaders, ...rideRows] })
                }
            ),
            fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Driver%20Earnings!A1?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values: [earningsHeaders, ...earningsRows] })
                }
            )
        ]);

        if (!ridesWriteRes.ok) {
            const err = await ridesWriteRes.json();
            throw new Error(err.error?.message || 'Failed to write rides data');
        }
        if (!earningsWriteRes.ok) {
            const err = await earningsWriteRes.json();
            throw new Error(err.error?.message || 'Failed to write earnings data');
        }

        const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
        console.log(`Synced ${allRides.length} rides + ${drivers.length} drivers to: ${sheetUrl}`);

        return Response.json({
            success: true,
            rides_synced: allRides.length,
            drivers_synced: drivers.length,
            spreadsheet_url: sheetUrl,
            spreadsheet_id: spreadsheetId,
        });
    } catch (error) {
        console.error('Bulk sync error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});