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
                body: JSON.stringify({ properties: { title: 'Dip Out - Ride Records' } })
            });
            if (!createRes.ok) throw new Error('Failed to create spreadsheet');
            const sheet = await createRes.json();
            spreadsheetId = sheet.spreadsheetId;
        }

        // Clear existing data and rewrite everything fresh
        await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1:clear`,
            { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        // Fetch all completed rides
        const rides = await base44.asServiceRole.entities.Ride.filter({ status: 'completed' }, '-created_date', 1000);

        const headers = [
            'Date', 'Time', 'Rider', 'Driver', 'Pickup', 'Dropoff',
            'Distance (mi)', 'Base Fare', 'Surge', 'Total Fare',
            'Driver Earnings (80%)', 'Payment Method', 'Payment Status',
            'Rating', 'Comment'
        ];

        const rows = rides.map(r => [
            r.created_date ? new Date(r.created_date).toLocaleDateString('en-US') : '',
            r.created_date ? new Date(r.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            r.rider_email || '',
            r.driver_email || '',
            r.pickup_address || '',
            r.dropoff_address || '',
            (r.distance_km || 0).toFixed(2),
            `$${(r.base_fare || 0).toFixed(2)}`,
            `${(r.surge_multiplier || 1).toFixed(2)}x`,
            `$${(r.fare || 0).toFixed(2)}`,
            `$${((r.fare || 0) * 0.8).toFixed(2)}`,
            r.payment_method || '',
            r.payment_status || 'unpaid',
            r.rider_rating ? `${r.rider_rating}/5` : '',
            r.rider_comment || '',
        ]);

        const values = [headers, ...rows];

        const updateRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
            {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ values })
            }
        );

        if (!updateRes.ok) {
            const err = await updateRes.json();
            throw new Error(err.error?.message || 'Failed to write data');
        }

        const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
        console.log(`Synced ${rides.length} rides to: ${sheetUrl}`);

        return Response.json({
            success: true,
            rides_synced: rides.length,
            spreadsheet_url: sheetUrl,
            spreadsheet_id: spreadsheetId,
        });
    } catch (error) {
        console.error('Bulk sync error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});