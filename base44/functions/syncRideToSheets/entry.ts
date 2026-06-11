import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Handle both automation event and direct call
        const body = await req.json();
        const ride_id = body.ride_id || body.event?.entity_id;
        
        if (!ride_id) {
            return Response.json({ error: 'Ride ID required' }, { status: 400 });
        }

        // Get Google Sheets connection
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
        
        // Fetch the ride data
        const ride = await base44.asServiceRole.entities.Ride.get(ride_id);
        
        if (!ride) {
            return Response.json({ error: 'Ride not found' }, { status: 404 });
        }
        
        // Only sync completed rides with payment
        if (ride.status !== 'completed' || ride.payment_status !== 'paid') {
            return Response.json({ success: true, message: 'Ride not yet completed/paid, skipping sync' });
        }

        // Get or create spreadsheet ID from app settings (or create new one)
        let spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
        
        if (!spreadsheetId) {
            // Try to get existing spreadsheet by name first
            const searchResponse = await fetch('https://sheets.googleapis.com/drive/v3/files?q=name=%27Dip%20Out%20-%20Ride%20Records%27%20and%20mimeType=%27application/vnd.google-apps.spreadsheet%27%20and%20trashed=false', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });
            
            if (searchResponse.ok) {
                const searchResult = await searchResponse.json();
                if (searchResult.files && searchResult.files.length > 0) {
                    spreadsheetId = searchResult.files[0].id;
                    console.log('Found existing spreadsheet:', spreadsheetId);
                }
            }
            
            // If still no spreadsheet, create new one
            if (!spreadsheetId) {
                const createResponse = await fetch('https://sheets.googleapis.com/spreadsheets', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        properties: {
                            title: 'Dip Out - Ride Records'
                        }
                    })
                });
                
                const spreadsheet = await createResponse.json();
                spreadsheetId = spreadsheet.spreadsheetId;
                console.log('Created new spreadsheet:', spreadsheetId);
            }
        }

        // Prepare row data with headers on first run
        const rowData = [
            ride.created_date || '',
            ride.rider_email || '',
            ride.driver_email || 'N/A',
            ride.pickup_address || '',
            ride.dropoff_address || '',
            `${(ride.distance_km || 0).toFixed(2)} mi`,
            `$${(ride.base_fare || 0).toFixed(2)}`,
            `${ride.surge_multiplier || 1}x`,
            `$${(ride.fare || 0).toFixed(2)}`,
            ride.payment_method || 'N/A',
            ride.payment_status || 'unpaid',
            ride.rider_rating ? `${ride.rider_rating}/5` : 'N/A',
            ride.rider_comment || '',
        ];

        // Append row to the first sheet
        const appendResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1:append`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [rowData],
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                }),
            }
        );

        if (!appendResponse.ok) {
            const error = await appendResponse.json();
            throw new Error(error.error?.message || 'Failed to append row');
        }

        return Response.json({ 
            success: true, 
            spreadsheetId,
            message: 'Ride logged to Google Sheets' 
        });
    } catch (error) {
        console.error('Sync to Sheets error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});